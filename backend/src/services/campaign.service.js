const { Op } = require('sequelize');
const {
  Campaign,
  CampaignLog,
  SendLog,
  Subscriber,
  Template,
  EmailList,
  EmailSegment,
  ListSubscriber,
  SegmentSubscriber,
  CampaignList,
  CampaignSegment,
} = require('../models');
const { addCampaignBatch, scheduleCampaign } = require('./queue.service');
const config = require('../config');

async function logCampaignAction(campaignId, action, message, metadata = null) {
  return CampaignLog.create({ campaignId, action, message, metadata });
}

async function getCampaignRecipients(campaignId) {
  const campaign = await Campaign.findByPk(campaignId, {
    include: [
      { model: EmailList, attributes: ['id'] },
      { model: EmailSegment, attributes: ['id'] },
    ],
  });

  if (!campaign) throw new Error('Campaign not found');

  const listIds = campaign.EmailLists.map((l) => l.id);
  const segmentIds = campaign.EmailSegments.map((s) => s.id);

  const subscriberIds = new Set();

  if (listIds.length > 0) {
    const listSubs = await ListSubscriber.findAll({
      where: { list_id: listIds },
      attributes: ['subscriber_id'],
    });
    listSubs.forEach((ls) => subscriberIds.add(ls.subscriber_id));
  }

  if (segmentIds.length > 0) {
    const segSubs = await SegmentSubscriber.findAll({
      where: { segment_id: segmentIds },
      attributes: ['subscriber_id'],
    });
    segSubs.forEach((ss) => subscriberIds.add(ss.subscriber_id));
  }

  const subscribers = await Subscriber.findAll({
    where: {
      id: { [Op.in]: [...subscriberIds] },
      status: 'active',
    },
    order: [['id', 'ASC']],
  });

  return subscribers;
}

async function prepareCampaign(campaignId) {
  const campaign = await Campaign.findByPk(campaignId, {
    include: [{ model: Template }],
  });

  if (!campaign) throw new Error('Campaign not found');
  if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
    throw new Error(`Cannot start campaign in ${campaign.status} status`);
  }

  const recipients = await getCampaignRecipients(campaignId);

  await campaign.update({
    status: 'sending',
    startedAt: campaign.startedAt || new Date(),
    totalRecipients: recipients.length,
  });

  await logCampaignAction(campaignId, 'started', `Campaign started with ${recipients.length} recipients`);

  const existingLogs = await SendLog.findAll({
    where: { campaignId, status: { [Op.in]: ['sent', 'delivered'] } },
    attributes: ['subscriberId'],
  });
  const sentIds = new Set(existingLogs.map((l) => l.subscriberId));

  const pendingRecipients = recipients.filter((r) => !sentIds.has(r.id));

  const batchSize = config.emailEngine.batchSize;
  for (let i = 0; i < pendingRecipients.length; i += batchSize) {
    const batch = pendingRecipients.slice(i, i + batchSize);
    await addCampaignBatch(campaignId, {
      recipients: batch.map((r) => ({
        id: r.id,
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName,
        metadata: r.metadata,
      })),
      batchIndex: Math.floor(i / batchSize),
    });
  }

  if (pendingRecipients.length === 0) {
    await campaign.update({ status: 'completed', completedAt: new Date() });
    await logCampaignAction(campaignId, 'completed', 'All emails already sent');
  }

  return { totalRecipients: recipients.length, pending: pendingRecipients.length };
}

async function startCampaign(campaignId) {
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  if (campaign.scheduleType === 'scheduled' && campaign.scheduledAt > new Date()) {
    await campaign.update({ status: 'scheduled' });
    await scheduleCampaign(campaignId, campaign.scheduledAt);
    await logCampaignAction(campaignId, 'scheduled', `Scheduled for ${campaign.scheduledAt}`);
    return { scheduled: true, scheduledAt: campaign.scheduledAt };
  }

  return prepareCampaign(campaignId);
}

async function resumeCampaign(campaignId) {
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  if (!['paused', 'failed'].includes(campaign.status)) {
    throw new Error('Only paused or failed campaigns can be resumed');
  }

  return prepareCampaign(campaignId);
}

async function updateCampaignProgress(campaignId) {
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) return;

  const sentCount = await SendLog.count({
    where: { campaignId, status: { [Op.in]: ['sent', 'delivered'] } },
  });
  const failedCount = await SendLog.count({
    where: { campaignId, status: 'failed' },
  });
  const pendingCount = await SendLog.count({
    where: { campaignId, status: 'pending' },
  });

  const updates = { sentCount, failedCount };

  if (pendingCount === 0 && campaign.status === 'sending') {
    updates.status = failedCount > 0 && sentCount === 0 ? 'failed' : 'completed';
    updates.completedAt = new Date();
    await logCampaignAction(
      campaignId,
      'completed',
      `Campaign completed. Sent: ${sentCount}, Failed: ${failedCount}`
    );
  }

  await campaign.update(updates);
}

module.exports = {
  getCampaignRecipients,
  prepareCampaign,
  startCampaign,
  resumeCampaign,
  updateCampaignProgress,
  logCampaignAction,
};

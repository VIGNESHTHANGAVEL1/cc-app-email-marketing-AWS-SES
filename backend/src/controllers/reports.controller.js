const { Op } = require('sequelize');
const {
  Campaign,
  SendLog,
  Subscriber,
  Unsubscribe,
  BounceLog,
  ComplaintLog,
  Template,
} = require('../models');
const { asyncHandler } = require('../utils/helpers');

const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalSubscribers,
    activeSubscribers,
    unsubscribedCount,
    bouncedCount,
    totalCampaigns,
    completedCampaigns,
    totalSent,
    totalDelivered,
    totalFailed,
    totalBounces,
    totalComplaints,
  ] = await Promise.all([
    Subscriber.count(),
    Subscriber.count({ where: { status: 'active' } }),
    Subscriber.count({ where: { status: 'unsubscribed' } }),
    Subscriber.count({ where: { status: 'bounced' } }),
    Campaign.count(),
    Campaign.count({ where: { status: 'completed' } }),
    SendLog.count({ where: { status: { [Op.in]: ['sent', 'delivered'] } } }),
    SendLog.count({ where: { status: 'delivered' } }),
    SendLog.count({ where: { status: 'failed' } }),
    BounceLog.count(),
    ComplaintLog.count(),
  ]);

  const recentCampaigns = await Campaign.findAll({
    limit: 5,
    order: [['created_at', 'DESC']],
    include: [{ model: Template, attributes: ['name'] }],
  });

  res.json({
    success: true,
    data: {
      subscribers: {
        total: totalSubscribers,
        active: activeSubscribers,
        unsubscribed: unsubscribedCount,
        bounced: bouncedCount,
      },
      campaigns: {
        total: totalCampaigns,
        completed: completedCampaigns,
      },
      emails: {
        sent: totalSent,
        delivered: totalDelivered,
        failed: totalFailed,
        bounces: totalBounces,
        complaints: totalComplaints,
      },
      recentCampaigns,
    },
  });
});

const getCampaignAnalytics = asyncHandler(async (req, res) => {
  const campaignId = req.params.id;

  const campaign = await Campaign.findByPk(campaignId, {
    include: [{ model: Template, attributes: ['name', 'subject'] }],
  });

  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  const [sent, delivered, failed, bounced, complained, pending] = await Promise.all([
    SendLog.count({ where: { campaignId, status: { [Op.in]: ['sent', 'delivered'] } } }),
    SendLog.count({ where: { campaignId, status: 'delivered' } }),
    SendLog.count({ where: { campaignId, status: 'failed' } }),
    SendLog.count({ where: { campaignId, status: 'bounced' } }),
    SendLog.count({ where: { campaignId, status: 'complained' } }),
    SendLog.count({ where: { campaignId, status: 'pending' } }),
  ]);

  const deliveryRate = campaign.totalRecipients > 0
    ? ((delivered / campaign.totalRecipients) * 100).toFixed(2)
    : 0;

  const bounceRate = sent > 0 ? ((bounced / sent) * 100).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      campaign,
      analytics: {
        totalRecipients: campaign.totalRecipients,
        sent,
        delivered,
        failed,
        bounced,
        complained,
        pending,
        deliveryRate: parseFloat(deliveryRate),
        bounceRate: parseFloat(bounceRate),
      },
    },
  });
});

const exportSendLogs = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.campaignId) where.campaignId = req.query.campaignId;
  if (req.query.status) where.status = req.query.status;

  const logs = await SendLog.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: 10000,
  });

  const csv = [
    'id,campaign_id,email,status,ses_message_id,sent_at,error_message',
    ...logs.map((l) =>
      [
        l.id,
        l.campaignId,
        l.email,
        l.status,
        l.sesMessageId || '',
        l.sentAt || '',
        (l.errorMessage || '').replace(/,/g, ';'),
      ].join(',')
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=send_logs.csv');
  res.send(csv);
});

const exportUnsubscribes = asyncHandler(async (req, res) => {
  const records = await Unsubscribe.findAll({
    order: [['unsubscribed_at', 'DESC']],
    limit: 10000,
  });

  const csv = [
    'id,email,campaign_id,reason,unsubscribed_at',
    ...records.map((r) =>
      [r.id, r.email, r.campaignId || '', (r.reason || '').replace(/,/g, ';'), r.unsubscribedAt].join(',')
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=unsubscribes.csv');
  res.send(csv);
});

module.exports = {
  getDashboard,
  getCampaignAnalytics,
  exportSendLogs,
  exportUnsubscribes,
};

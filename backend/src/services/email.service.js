const {
  Campaign,
  Template,
  SendLog,
} = require('../models');
const sesService = require('./ses.service');
const { updateCampaignProgress } = require('./campaign.service');
const {
  generateUnsubscribeToken,
  buildUnsubscribeUrl,
  replacePlaceholders,
} = require('../utils/token');
const config = require('../config');

let lastSendTime = 0;

async function rateLimit() {
  const minInterval = 1000 / config.emailEngine.rateLimitPerSecond;
  const now = Date.now();
  const elapsed = now - lastSendTime;

  if (elapsed < minInterval) {
    await new Promise((resolve) => setTimeout(resolve, minInterval - elapsed));
  }

  lastSendTime = Date.now();
}

async function processBatch(campaignId, recipients) {
  const campaign = await Campaign.findByPk(campaignId, {
    include: [{ model: Template }],
  });

  if (!campaign || campaign.status === 'paused' || campaign.status === 'cancelled') {
    return { skipped: true };
  }

  const template = campaign.Template;
  const results = { sent: 0, failed: 0 };

  for (const recipient of recipients) {
    const currentCampaign = await Campaign.findByPk(campaignId);
    if (currentCampaign.status === 'paused' || currentCampaign.status === 'cancelled') {
      break;
    }

    await rateLimit();

    const token = generateUnsubscribeToken(recipient.id, recipient.email, campaignId);
    const unsubscribeUrl = buildUnsubscribeUrl(token);

    const placeholderData = {
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      email: recipient.email,
      unsubscribeUrl,
      custom: recipient.metadata || {},
    };

    const subject = replacePlaceholders(template.subject, placeholderData);
    const htmlBody = replacePlaceholders(template.htmlBody, placeholderData);
    const textBody = template.textBody
      ? replacePlaceholders(template.textBody, placeholderData)
      : undefined;

    let sendLog = await SendLog.findOne({
      where: { campaignId, subscriberId: recipient.id },
    });

    if (!sendLog) {
      sendLog = await SendLog.create({
        campaignId,
        subscriberId: recipient.id,
        email: recipient.email,
        status: 'pending',
      });
    }

    if (['sent', 'delivered'].includes(sendLog.status)) {
      continue;
    }

    try {
      const result = await sesService.sendWithRetry({
        to: recipient.email,
        subject,
        htmlBody,
        textBody,
        attachments: template.attachments || [],
      });

      await sendLog.update({
        status: 'sent',
        sesMessageId: result.messageId,
        sentAt: new Date(),
        retryCount: (sendLog.retryCount || 0) + (result.attempts || 1),
      });

      results.sent++;
    } catch (error) {
      await sendLog.update({
        status: 'failed',
        errorMessage: error.message,
        retryCount: (sendLog.retryCount || 0) + config.emailEngine.maxRetries,
      });

      results.failed++;
    }
  }

  await updateCampaignProgress(campaignId);
  return results;
}

module.exports = { processBatch, rateLimit };

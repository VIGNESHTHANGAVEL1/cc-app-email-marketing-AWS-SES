const crypto = require('crypto');
const config = require('../config');

function generateUnsubscribeToken(subscriberId, email, campaignId) {
  const payload = `${subscriberId}:${email}:${campaignId || 0}`;
  const hmac = crypto
    .createHmac('sha256', config.app.unsubscribeSecret)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

function verifyUnsubscribeToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const lastColon = decoded.lastIndexOf(':');
    const payload = decoded.substring(0, lastColon);
    const hmac = decoded.substring(lastColon + 1);

    const expectedHmac = crypto
      .createHmac('sha256', config.app.unsubscribeSecret)
      .update(payload)
      .digest('hex');

    if (hmac !== expectedHmac) return null;

    const [subscriberId, email, campaignId] = payload.split(':');
    return {
      subscriberId: parseInt(subscriberId, 10),
      email,
      campaignId: parseInt(campaignId, 10) || null,
    };
  } catch {
    return null;
  }
}

function buildUnsubscribeUrl(token) {
  return `${config.app.url}/unsubscribe/${token}`;
}

function replacePlaceholders(template, data) {
  let result = template;
  const placeholders = {
  '{{first_name}}': data.firstName || '',
  '{{last_name}}': data.lastName || '',
  '{{email}}': data.email || '',
  '{{full_name}}': [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email,
  '{{unsubscribe_url}}': data.unsubscribeUrl || '',
  };

  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'gi'), value);
  }

  if (data.custom) {
    for (const [key, value] of Object.entries(data.custom)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
      result = result.replace(pattern, value);
    }
  }

  return result;
}

module.exports = {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl,
  replacePlaceholders,
};

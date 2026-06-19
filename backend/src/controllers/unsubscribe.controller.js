const { Subscriber, Unsubscribe, BounceLog, ComplaintLog, SendLog } = require('../models');
const { verifyUnsubscribeToken } = require('../utils/token');
const { asyncHandler } = require('../utils/helpers');

const unsubscribe = asyncHandler(async (req, res) => {
  const token = req.params.token || req.body.token;
  const data = verifyUnsubscribeToken(token);

  if (!data) {
    return res.status(400).json({ success: false, message: 'Invalid unsubscribe link' });
  }

  const subscriber = await Subscriber.findByPk(data.subscriberId);
  if (!subscriber) {
    return res.status(404).json({ success: false, message: 'Subscriber not found' });
  }

  if (subscriber.status === 'unsubscribed') {
    return res.json({ success: true, message: 'You are already unsubscribed' });
  }

  await subscriber.update({ status: 'unsubscribed' });

  await Unsubscribe.create({
    subscriberId: subscriber.id,
    email: subscriber.email,
    campaignId: data.campaignId,
    reason: req.body.reason || null,
    token,
    unsubscribedAt: new Date(),
  });

  res.json({
    success: true,
    message: 'You have been successfully unsubscribed',
  });
});

const getUnsubscribeStatus = asyncHandler(async (req, res) => {
  const data = verifyUnsubscribeToken(req.params.token);
  if (!data) {
    return res.status(400).json({ success: false, message: 'Invalid token' });
  }

  const subscriber = await Subscriber.findByPk(data.subscriberId, {
    attributes: ['id', 'email', 'status'],
  });

  if (!subscriber) {
    return res.status(404).json({ success: false, message: 'Subscriber not found' });
  }

  res.json({
    success: true,
    data: {
      email: subscriber.email,
      isUnsubscribed: subscriber.status === 'unsubscribed',
    },
  });
});

const getUnsubscribeReport = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows } = await Unsubscribe.findAndCountAll({
    limit: parseInt(limit, 10),
    offset,
    order: [['unsubscribed_at', 'DESC']],
  });

  res.json({
    success: true,
    data: rows,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / limit),
    },
  });
});

module.exports = {
  unsubscribe,
  getUnsubscribeStatus,
  getUnsubscribeReport,
};

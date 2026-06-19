const { Subscriber, BounceLog, ComplaintLog, SendLog } = require('../models');
const { asyncHandler } = require('../utils/helpers');

function parseSNSNotification(body) {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  if (body.Type === 'SubscriptionConfirmation') {
    return body;
  }

  if (body.Type === 'Notification' && body.Message) {
    return {
      ...body,
      parsedMessage: typeof body.Message === 'string' ? JSON.parse(body.Message) : body.Message,
    };
  }

  return body;
}

const handleSESWebhook = asyncHandler(async (req, res) => {
  const notification = parseSNSNotification(req.body);

  if (notification.Type === 'SubscriptionConfirmation') {
    console.log('SNS Subscription URL:', notification.SubscribeURL);
    return res.json({ success: true, message: 'Subscription confirmation received' });
  }

  const message = notification.parsedMessage || notification;
  const notificationType = message.notificationType || message.eventType;

  if (notificationType === 'Bounce') {
    await handleBounce(message);
  } else if (notificationType === 'Complaint') {
    await handleComplaint(message);
  } else if (notificationType === 'Delivery') {
    await handleDelivery(message);
  }

  res.json({ success: true, message: 'Webhook processed' });
});

async function handleBounce(message) {
  const bounce = message.bounce;
  const mail = message.mail;

  for (const recipient of bounce.bouncedRecipients) {
    const email = recipient.emailAddress;
    const subscriber = await Subscriber.findOne({ where: { email } });

    if (subscriber) {
      await subscriber.update({ status: 'bounced' });
    }

    await BounceLog.create({
      email,
      subscriberId: subscriber?.id,
      bounceType: bounce.bounceType,
      bounceSubType: bounce.bounceSubType,
      diagnosticCode: recipient.diagnosticCode,
      sesMessageId: mail.messageId,
      rawPayload: message,
    });

    await SendLog.update(
      { status: 'bounced' },
      { where: { sesMessageId: mail.messageId } }
    );
  }
}

async function handleComplaint(message) {
  const complaint = message.complaint;
  const mail = message.mail;

  for (const recipient of complaint.complainedRecipients) {
    const email = recipient.emailAddress;
    const subscriber = await Subscriber.findOne({ where: { email } });

    if (subscriber) {
      await subscriber.update({ status: 'complained' });
    }

    await ComplaintLog.create({
      email,
      subscriberId: subscriber?.id,
      complaintType: complaint.complaintFeedbackType,
      sesMessageId: mail.messageId,
      rawPayload: message,
    });

    await SendLog.update(
      { status: 'complained' },
      { where: { sesMessageId: mail.messageId } }
    );
  }
}

async function handleDelivery(message) {
  const mail = message.mail;

  await SendLog.update(
    { status: 'delivered' },
    { where: { sesMessageId: mail.messageId } }
  );
}

module.exports = { handleSESWebhook };

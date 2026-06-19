const { body, param, query } = require('express-validator');

const emailListValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
  ],
  update: [
    param('id').isInt().withMessage('Invalid list ID'),
    body('name').optional().trim().notEmpty(),
    body('status').optional().isIn(['active', 'archived']),
  ],
};

const subscriberValidators = {
  create: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('listId').isInt().withMessage('List ID is required'),
  ],
  update: [
    param('id').isInt(),
    body('email').optional().isEmail(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('status').optional().isIn(['active', 'unsubscribed', 'bounced', 'complained']),
  ],
};

const templateValidators = {
  create: [
    body('name').trim().notEmpty(),
    body('subject').trim().notEmpty(),
    body('htmlBody').notEmpty().withMessage('HTML body is required'),
    body('textBody').optional(),
    body('placeholders').optional().isArray(),
    body('attachments').optional().isArray(),
  ],
  update: [
    param('id').isInt(),
    body('name').optional().trim().notEmpty(),
    body('subject').optional().trim().notEmpty(),
    body('htmlBody').optional().notEmpty(),
  ],
};

const campaignValidators = {
  create: [
    body('name').trim().notEmpty(),
    body('templateId').isInt(),
    body('listIds').optional().isArray(),
    body('segmentIds').optional().isArray(),
    body('scheduleType').optional().isIn(['immediate', 'scheduled']),
    body('scheduledAt').optional().isISO8601(),
  ],
  update: [
    param('id').isInt(),
    body('name').optional().trim().notEmpty(),
    body('templateId').optional().isInt(),
    body('scheduleType').optional().isIn(['immediate', 'scheduled']),
    body('scheduledAt').optional().isISO8601(),
  ],
};

const segmentValidators = {
  create: [
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('filterCriteria').optional().isObject(),
    body('subscriberIds').optional().isArray(),
  ],
};

module.exports = {
  emailListValidators,
  subscriberValidators,
  templateValidators,
  campaignValidators,
  segmentValidators,
};

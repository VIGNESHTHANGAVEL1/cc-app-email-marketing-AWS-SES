const { Op } = require('sequelize');
const { Template } = require('../models');
const { replacePlaceholders } = require('../utils/token');
const { paginate, buildPaginationMeta, asyncHandler } = require('../utils/helpers');

const getAllTemplates = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = { status: req.query.status || 'active' };

  if (req.query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { subject: { [Op.like]: `%${req.query.search}%` } },
    ];
  }

  const { count, rows } = await Template.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  res.json({
    success: true,
    data: rows,
    pagination: buildPaginationMeta(count, page, limit),
  });
});

const getTemplateById = asyncHandler(async (req, res) => {
  const template = await Template.findByPk(req.params.id);
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
  res.json({ success: true, data: template });
});

const createTemplate = asyncHandler(async (req, res) => {
  const template = await Template.create(req.body);
  res.status(201).json({ success: true, data: template });
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findByPk(req.params.id);
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

  await template.update(req.body);
  res.json({ success: true, data: template });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findByPk(req.params.id);
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

  await template.update({ status: 'archived' });
  res.json({ success: true, message: 'Template archived' });
});

const duplicateTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findByPk(req.params.id);
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

  const duplicate = await Template.create({
    name: `${template.name} (Copy)`,
    subject: template.subject,
    htmlBody: template.htmlBody,
    textBody: template.textBody,
    placeholders: template.placeholders,
    attachments: template.attachments,
  });

  res.status(201).json({ success: true, data: duplicate });
});

const previewTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findByPk(req.params.id);
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

  const sampleData = req.body.sampleData || {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    unsubscribeUrl: 'https://example.com/unsubscribe/token',
  };

  const preview = {
    subject: replacePlaceholders(template.subject, sampleData),
    htmlBody: replacePlaceholders(template.htmlBody, sampleData),
    textBody: template.textBody ? replacePlaceholders(template.textBody, sampleData) : null,
  };

  res.json({ success: true, data: preview });
});

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  previewTemplate,
};

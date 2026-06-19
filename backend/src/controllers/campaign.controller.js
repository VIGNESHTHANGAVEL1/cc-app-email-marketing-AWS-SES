const { Op } = require('sequelize');
const {
  Campaign,
  CampaignList,
  CampaignSegment,
  CampaignLog,
  SendLog,
  Template,
  EmailList,
  EmailSegment,
} = require('../models');
const {
  startCampaign,
  resumeCampaign,
  logCampaignAction,
} = require('../services/campaign.service');
const { pauseCampaignJobs } = require('../services/queue.service');
const { paginate, buildPaginationMeta, asyncHandler } = require('../utils/helpers');

const getAllCampaigns = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = {};

  if (req.query.status) where.status = req.query.status;
  if (req.query.search) {
    where.name = { [Op.like]: `%${req.query.search}%` };
  }

  const { count, rows } = await Campaign.findAndCountAll({
    where,
    include: [{ model: Template, attributes: ['id', 'name', 'subject'] }],
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

const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByPk(req.params.id, {
    include: [
      { model: Template },
      { model: EmailList, attributes: ['id', 'name'] },
      { model: EmailSegment, attributes: ['id', 'name'] },
    ],
  });

  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  res.json({ success: true, data: campaign });
});

const createCampaign = asyncHandler(async (req, res) => {
  const { name, templateId, listIds = [], segmentIds = [], scheduleType, scheduledAt } = req.body;

  const template = await Template.findByPk(templateId);
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

  const campaign = await Campaign.create({
    name,
    templateId,
    scheduleType: scheduleType || 'immediate',
    scheduledAt: scheduleType === 'scheduled' ? scheduledAt : null,
    status: scheduleType === 'scheduled' ? 'scheduled' : 'draft',
  });

  for (const listId of listIds) {
    await CampaignList.create({ campaign_id: campaign.id, list_id: listId });
  }

  for (const segmentId of segmentIds) {
    await CampaignSegment.create({ campaign_id: campaign.id, segment_id: segmentId });
  }

  await logCampaignAction(campaign.id, 'created', `Campaign "${name}" created`);

  const fullCampaign = await Campaign.findByPk(campaign.id, {
    include: [
      { model: Template, attributes: ['id', 'name'] },
      { model: EmailList, attributes: ['id', 'name'] },
      { model: EmailSegment, attributes: ['id', 'name'] },
    ],
  });

  res.status(201).json({ success: true, data: fullCampaign });
});

const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByPk(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

  if (!['draft', 'scheduled'].includes(campaign.status)) {
    return res.status(400).json({
      success: false,
      message: 'Only draft or scheduled campaigns can be updated',
    });
  }

  const { listIds, segmentIds, ...updates } = req.body;
  await campaign.update(updates);

  if (listIds) {
    await CampaignList.destroy({ where: { campaign_id: campaign.id } });
    for (const listId of listIds) {
      await CampaignList.create({ campaign_id: campaign.id, list_id: listId });
    }
  }

  if (segmentIds) {
    await CampaignSegment.destroy({ where: { campaign_id: campaign.id } });
    for (const segmentId of segmentIds) {
      await CampaignSegment.create({ campaign_id: campaign.id, segment_id: segmentId });
    }
  }

  res.json({ success: true, data: campaign });
});

const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByPk(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

  if (campaign.status === 'sending') {
    return res.status(400).json({ success: false, message: 'Cannot delete a sending campaign' });
  }

  await campaign.update({ status: 'cancelled' });
  await logCampaignAction(campaign.id, 'cancelled', 'Campaign cancelled');
  res.json({ success: true, message: 'Campaign cancelled' });
});

const sendCampaign = asyncHandler(async (req, res) => {
  const result = await startCampaign(parseInt(req.params.id, 10));
  res.json({ success: true, data: result, message: 'Campaign started' });
});

const pauseCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByPk(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

  await campaign.update({ status: 'paused' });
  await pauseCampaignJobs(campaign.id);
  await logCampaignAction(campaign.id, 'paused', 'Campaign paused');

  res.json({ success: true, message: 'Campaign paused' });
});

const resumeCampaignHandler = asyncHandler(async (req, res) => {
  const result = await resumeCampaign(parseInt(req.params.id, 10));
  res.json({ success: true, data: result, message: 'Campaign resumed' });
});

const getCampaignLogs = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);

  const { count, rows } = await CampaignLog.findAndCountAll({
    where: { campaign_id: req.params.id },
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

const getCampaignSendLogs = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = { campaign_id: req.params.id };

  if (req.query.status) where.status = req.query.status;

  const { count, rows } = await SendLog.findAndCountAll({
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

module.exports = {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  pauseCampaign,
  resumeCampaignHandler,
  getCampaignLogs,
  getCampaignSendLogs,
};

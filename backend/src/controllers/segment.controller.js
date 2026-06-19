const { Op } = require('sequelize');
const { EmailSegment, Subscriber, SegmentSubscriber } = require('../models');
const { paginate, buildPaginationMeta, asyncHandler } = require('../utils/helpers');

const getAllSegments = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = {};

  if (req.query.search) {
    where.name = { [Op.like]: `%${req.query.search}%` };
  }

  const { count, rows } = await EmailSegment.findAndCountAll({
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

const getSegmentById = asyncHandler(async (req, res) => {
  const segment = await EmailSegment.findByPk(req.params.id, {
    include: [{
      model: Subscriber,
      through: { attributes: [] },
      attributes: ['id', 'email', 'firstName', 'lastName', 'status'],
    }],
  });

  if (!segment) return res.status(404).json({ success: false, message: 'Segment not found' });
  res.json({ success: true, data: segment });
});

const createSegment = asyncHandler(async (req, res) => {
  const { name, description, filterCriteria, subscriberIds } = req.body;

  const segment = await EmailSegment.create({ name, description, filterCriteria });

  if (subscriberIds && subscriberIds.length > 0) {
    const subscribers = await Subscriber.findAll({
      where: { id: subscriberIds, status: 'active' },
    });

    for (const sub of subscribers) {
      await SegmentSubscriber.findOrCreate({
        where: { segment_id: segment.id, subscriber_id: sub.id },
      });
    }
  }

  res.status(201).json({ success: true, data: segment });
});

const updateSegment = asyncHandler(async (req, res) => {
  const segment = await EmailSegment.findByPk(req.params.id);
  if (!segment) return res.status(404).json({ success: false, message: 'Segment not found' });

  await segment.update(req.body);

  if (req.body.subscriberIds) {
    await SegmentSubscriber.destroy({ where: { segment_id: segment.id } });
    for (const subId of req.body.subscriberIds) {
      await SegmentSubscriber.findOrCreate({
        where: { segment_id: segment.id, subscriber_id: subId },
      });
    }
  }

  res.json({ success: true, data: segment });
});

const deleteSegment = asyncHandler(async (req, res) => {
  const segment = await EmailSegment.findByPk(req.params.id);
  if (!segment) return res.status(404).json({ success: false, message: 'Segment not found' });

  await SegmentSubscriber.destroy({ where: { segment_id: segment.id } });
  await segment.destroy();
  res.json({ success: true, message: 'Segment deleted' });
});

module.exports = {
  getAllSegments,
  getSegmentById,
  createSegment,
  updateSegment,
  deleteSegment,
};

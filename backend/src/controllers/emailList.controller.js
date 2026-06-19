const { Op } = require('sequelize');
const { EmailList, Subscriber, ListSubscriber, ImportLog } = require('../models');
const { importEmails, searchSubscribers } = require('../services/import.service');
const { isValidEmail, normalizeEmail, paginate, buildPaginationMeta, asyncHandler } = require('../utils/helpers');

const getAllLists = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = {};

  if (req.query.status) where.status = req.query.status;
  if (req.query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { description: { [Op.like]: `%${req.query.search}%` } },
    ];
  }

  const { count, rows } = await EmailList.findAndCountAll({
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

const getListById = asyncHandler(async (req, res) => {
  const list = await EmailList.findByPk(req.params.id, {
    include: [{
      model: Subscriber,
      through: { attributes: [] },
      attributes: ['id', 'email', 'firstName', 'lastName', 'status'],
    }],
  });

  if (!list) return res.status(404).json({ success: false, message: 'List not found' });
  res.json({ success: true, data: list });
});

const createList = asyncHandler(async (req, res) => {
  const list = await EmailList.create(req.body);
  res.status(201).json({ success: true, data: list });
});

const updateList = asyncHandler(async (req, res) => {
  const list = await EmailList.findByPk(req.params.id);
  if (!list) return res.status(404).json({ success: false, message: 'List not found' });

  await list.update(req.body);
  res.json({ success: true, data: list });
});

const deleteList = asyncHandler(async (req, res) => {
  const list = await EmailList.findByPk(req.params.id);
  if (!list) return res.status(404).json({ success: false, message: 'List not found' });

  await list.update({ status: 'archived' });
  res.json({ success: true, message: 'List archived successfully' });
});

const getSubscribers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const { subscribers, total } = await searchSubscribers({
    search: req.query.search,
    status: req.query.status,
    listId: req.query.listId,
    page,
    limit,
    offset,
  });

  res.json({
    success: true,
    data: subscribers,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

const addSubscriber = asyncHandler(async (req, res) => {
  const { email, firstName, lastName, listId } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  const list = await EmailList.findByPk(listId);
  if (!list) return res.status(404).json({ success: false, message: 'List not found' });

  const normalized = normalizeEmail(email);
  const [subscriber, created] = await Subscriber.findOrCreate({
    where: { email: normalized },
    defaults: { firstName, lastName, status: 'active' },
  });

  if (!created && (firstName || lastName)) {
    await subscriber.update({
      firstName: firstName || subscriber.firstName,
      lastName: lastName || subscriber.lastName,
    });
  }

  const [, added] = await ListSubscriber.findOrCreate({
    where: { list_id: listId, subscriber_id: subscriber.id },
  });

  res.status(created || added ? 201 : 200).json({
    success: true,
    data: subscriber,
    message: added ? 'Subscriber added' : 'Subscriber already in list',
  });
});

const updateSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findByPk(req.params.id);
  if (!subscriber) return res.status(404).json({ success: false, message: 'Subscriber not found' });

  if (req.body.email && !isValidEmail(req.body.email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  const updates = { ...req.body };
  if (updates.email) updates.email = normalizeEmail(updates.email);

  await subscriber.update(updates);
  res.json({ success: true, data: subscriber });
});

const deleteSubscriber = asyncHandler(async (req, res) => {
  const { listId } = req.query;
  const subscriber = await Subscriber.findByPk(req.params.id);
  if (!subscriber) return res.status(404).json({ success: false, message: 'Subscriber not found' });

  if (listId) {
    await ListSubscriber.destroy({
      where: { list_id: listId, subscriber_id: subscriber.id },
    });
  } else {
    await subscriber.update({ status: 'unsubscribed' });
  }

  res.json({ success: true, message: 'Subscriber removed' });
});

const importFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File is required' });
  }

  const list = await EmailList.findByPk(req.params.id);
  if (!list) return res.status(404).json({ success: false, message: 'List not found' });

  const importLog = await importEmails(list.id, req.file.path, req.file.originalname);
  res.status(201).json({ success: true, data: importLog });
});

const getImportLogs = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = { list_id: req.params.id };

  const { count, rows } = await ImportLog.findAndCountAll({
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
  getAllLists,
  getListById,
  createList,
  updateList,
  deleteList,
  getSubscribers,
  addSubscriber,
  updateSubscriber,
  deleteSubscriber,
  importFile,
  getImportLogs,
};

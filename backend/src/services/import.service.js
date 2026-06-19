const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Op } = require('sequelize');
const {
  EmailList,
  Subscriber,
  ListSubscriber,
  ImportLog,
} = require('../models');
const { isValidEmail, normalizeEmail } = require('../utils/helpers');

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

function extractEmailFromRow(row) {
  const emailField = Object.keys(row).find(
    (k) => k.toLowerCase() === 'email' || k.toLowerCase() === 'e-mail'
  );
  const firstNameField = Object.keys(row).find(
    (k) => k.toLowerCase().includes('first') && k.toLowerCase().includes('name')
  );
  const lastNameField = Object.keys(row).find(
    (k) => k.toLowerCase().includes('last') && k.toLowerCase().includes('name')
  );

  return {
    email: emailField ? row[emailField] : Object.values(row)[0],
    firstName: firstNameField ? row[firstNameField] : '',
    lastName: lastNameField ? row[lastNameField] : '',
  };
}

async function importEmails(listId, filePath, fileName) {
  const importLog = await ImportLog.create({
    listId,
    fileName,
    status: 'processing',
  });

  try {
    const ext = path.extname(fileName).toLowerCase();
    let rows;

    if (ext === '.csv') {
      rows = await parseCSV(filePath);
    } else if (['.xlsx', '.xls'].includes(ext)) {
      rows = parseExcel(filePath);
    } else {
      throw new Error('Unsupported file format. Use CSV or Excel.');
    }

    let importedCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    for (const row of rows) {
      const { email, firstName, lastName } = extractEmailFromRow(row);

      if (!email || !isValidEmail(email)) {
        invalidCount++;
        continue;
      }

      const normalized = normalizeEmail(email);

      const [subscriber, created] = await Subscriber.findOrCreate({
        where: { email: normalized },
        defaults: {
          firstName: firstName || null,
          lastName: lastName || null,
          status: 'active',
        },
      });

      if (!created) {
        duplicateCount++;
      }

      const [, listAdded] = await ListSubscriber.findOrCreate({
        where: { list_id: listId, subscriber_id: subscriber.id },
      });

      if (listAdded) importedCount++;
    }

    await importLog.update({
      totalRows: rows.length,
      importedCount,
      duplicateCount,
      invalidCount,
      status: 'completed',
    });

    return importLog;
  } catch (error) {
    await importLog.update({
      status: 'failed',
      errorMessage: error.message,
    });
    throw error;
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

async function searchSubscribers({ search, status, listId, page, limit, offset }) {
  const where = {};

  if (search) {
    where[Op.or] = [
      { email: { [Op.like]: `%${search}%` } },
      { firstName: { [Op.like]: `%${search}%` } },
      { lastName: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) where.status = status;

  const include = [];
  if (listId) {
    include.push({
      model: EmailList,
      where: { id: listId },
      attributes: [],
      through: { attributes: [] },
    });
  }

  const { count, rows } = await Subscriber.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { subscribers: rows, total: count };
}

module.exports = {
  importEmails,
  searchSubscribers,
  parseCSV,
  parseExcel,
};

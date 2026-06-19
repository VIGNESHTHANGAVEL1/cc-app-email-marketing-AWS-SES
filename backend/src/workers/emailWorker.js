require('dotenv').config();

const { emailQueue, campaignScheduler } = require('../services/queue.service');
const { processBatch } = require('../services/email.service');
const { startCampaign } = require('../services/campaign.service');
const { sequelize } = require('../models');

console.log('Email worker starting...');

emailQueue.process('send-batch', async (job) => {
  const { campaignId, recipients } = job.data;
  console.log(`Processing batch for campaign ${campaignId}, ${recipients.length} recipients`);

  const result = await processBatch(campaignId, recipients);
  console.log(`Batch complete:`, result);
  return result;
});

campaignScheduler.process('start-campaign', async (job) => {
  const { campaignId } = job.data;
  console.log(`Starting scheduled campaign ${campaignId}`);
  return startCampaign(campaignId);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

emailQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

sequelize.authenticate()
  .then(() => console.log('Worker connected to database'))
  .catch((err) => {
    console.error('Worker database connection failed:', err);
    process.exit(1);
  });

process.on('SIGTERM', async () => {
  await emailQueue.close();
  await campaignScheduler.close();
  process.exit(0);
});

console.log('Email worker ready and listening for jobs');

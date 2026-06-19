const Bull = require('bull');
const config = require('../config');

const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
};

const emailQueue = new Bull('email-campaign-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: config.emailEngine.maxRetries,
    backoff: {
      type: 'exponential',
      delay: config.emailEngine.retryDelayMs,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

const campaignScheduler = new Bull('campaign-scheduler', {
  redis: redisConfig,
});

async function addCampaignBatch(campaignId, batchData) {
  return emailQueue.add(
    'send-batch',
    { campaignId, ...batchData },
    {
      priority: 1,
      delay: 0,
    }
  );
}

async function scheduleCampaign(campaignId, scheduledAt) {
  const delay = new Date(scheduledAt).getTime() - Date.now();
  return campaignScheduler.add(
    'start-campaign',
    { campaignId },
    { delay: Math.max(0, delay) }
  );
}

async function pauseCampaignJobs(campaignId) {
  const jobs = await emailQueue.getJobs(['waiting', 'delayed', 'active']);
  for (const job of jobs) {
    if (job.data.campaignId === campaignId) {
      await job.remove();
    }
  }
}

module.exports = {
  emailQueue,
  campaignScheduler,
  addCampaignBatch,
  scheduleCampaign,
  pauseCampaignJobs,
};

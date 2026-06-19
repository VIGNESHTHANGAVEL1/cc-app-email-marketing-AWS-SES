require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'email_marketing',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    fromEmail: process.env.SES_FROM_EMAIL,
    fromName: process.env.SES_FROM_NAME || 'Email Marketing',
  },

  app: {
    url: process.env.APP_URL || 'http://localhost:5173',
    apiUrl: process.env.API_URL || 'http://localhost:4000',
    unsubscribeSecret: process.env.UNSUBSCRIBE_SECRET || 'dev-secret',
  },

  emailEngine: {
    batchSize: parseInt(process.env.EMAIL_BATCH_SIZE, 10) || 50,
    rateLimitPerSecond: parseInt(process.env.EMAIL_RATE_LIMIT_PER_SECOND, 10) || 14,
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES, 10) || 3,
    retryDelayMs: parseInt(process.env.EMAIL_RETRY_DELAY_MS, 10) || 5000,
  },
};

module.exports = config;

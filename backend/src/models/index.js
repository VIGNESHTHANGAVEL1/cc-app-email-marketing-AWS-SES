const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailList = sequelize.define('EmailList', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('active', 'archived'), defaultValue: 'active' },
}, { tableName: 'email_lists' });

const EmailSegment = sequelize.define('EmailSegment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  filterCriteria: { type: DataTypes.JSON, field: 'filter_criteria' },
}, { tableName: 'email_segments' });

const Subscriber = sequelize.define('Subscriber', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(255), allowNull: false },
  firstName: { type: DataTypes.STRING(100), field: 'first_name' },
  lastName: { type: DataTypes.STRING(100), field: 'last_name' },
  status: {
    type: DataTypes.ENUM('active', 'unsubscribed', 'bounced', 'complained'),
    defaultValue: 'active',
  },
  metadata: { type: DataTypes.JSON },
}, {
  tableName: 'subscribers',
  indexes: [{ unique: true, fields: ['email'] }],
});

const ListSubscriber = sequelize.define('ListSubscriber', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { tableName: 'list_subscribers' });

const SegmentSubscriber = sequelize.define('SegmentSubscriber', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { tableName: 'segment_subscribers' });

const ImportLog = sequelize.define('ImportLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  listId: { type: DataTypes.INTEGER, allowNull: false, field: 'list_id' },
  fileName: { type: DataTypes.STRING(255), field: 'file_name' },
  totalRows: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_rows' },
  importedCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'imported_count' },
  duplicateCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'duplicate_count' },
  invalidCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'invalid_count' },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  errorMessage: { type: DataTypes.TEXT, field: 'error_message' },
}, { tableName: 'import_logs' });

const Template = sequelize.define('Template', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  subject: { type: DataTypes.STRING(500), allowNull: false },
  htmlBody: { type: DataTypes.TEXT('long'), allowNull: false, field: 'html_body' },
  textBody: { type: DataTypes.TEXT('long'), field: 'text_body' },
  placeholders: { type: DataTypes.JSON },
  attachments: { type: DataTypes.JSON },
  status: { type: DataTypes.ENUM('active', 'archived'), defaultValue: 'active' },
}, { tableName: 'templates' });

const Campaign = sequelize.define('Campaign', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  templateId: { type: DataTypes.INTEGER, allowNull: false, field: 'template_id' },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'paused', 'completed', 'failed', 'cancelled'),
    defaultValue: 'draft',
  },
  scheduleType: {
    type: DataTypes.ENUM('immediate', 'scheduled'),
    defaultValue: 'immediate',
    field: 'schedule_type',
  },
  scheduledAt: { type: DataTypes.DATE, field: 'scheduled_at' },
  startedAt: { type: DataTypes.DATE, field: 'started_at' },
  completedAt: { type: DataTypes.DATE, field: 'completed_at' },
  totalRecipients: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_recipients' },
  sentCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sent_count' },
  failedCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'failed_count' },
  lastProcessedId: { type: DataTypes.INTEGER, defaultValue: 0, field: 'last_processed_id' },
}, { tableName: 'campaigns' });

const CampaignList = sequelize.define('CampaignList', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { tableName: 'campaign_lists' });

const CampaignSegment = sequelize.define('CampaignSegment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { tableName: 'campaign_segments' });

const SendLog = sequelize.define('SendLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campaignId: { type: DataTypes.INTEGER, allowNull: false, field: 'campaign_id' },
  subscriberId: { type: DataTypes.INTEGER, allowNull: false, field: 'subscriber_id' },
  email: { type: DataTypes.STRING(255), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'bounced', 'complained', 'failed'),
    defaultValue: 'pending',
  },
  sesMessageId: { type: DataTypes.STRING(255), field: 'ses_message_id' },
  errorMessage: { type: DataTypes.TEXT, field: 'error_message' },
  retryCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'retry_count' },
  sentAt: { type: DataTypes.DATE, field: 'sent_at' },
}, {
  tableName: 'send_logs',
  indexes: [
    { fields: ['campaign_id'] },
    { fields: ['subscriber_id'] },
    { fields: ['status'] },
    { fields: ['ses_message_id'] },
  ],
});

const Unsubscribe = sequelize.define('Unsubscribe', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  subscriberId: { type: DataTypes.INTEGER, allowNull: false, field: 'subscriber_id' },
  email: { type: DataTypes.STRING(255), allowNull: false },
  campaignId: { type: DataTypes.INTEGER, field: 'campaign_id' },
  reason: { type: DataTypes.TEXT },
  token: { type: DataTypes.STRING(255), unique: true },
  unsubscribedAt: { type: DataTypes.DATE, field: 'unsubscribed_at' },
}, { tableName: 'unsubscribes' });

const BounceLog = sequelize.define('BounceLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(255), allowNull: false },
  subscriberId: { type: DataTypes.INTEGER, field: 'subscriber_id' },
  bounceType: { type: DataTypes.STRING(50), field: 'bounce_type' },
  bounceSubType: { type: DataTypes.STRING(50), field: 'bounce_sub_type' },
  diagnosticCode: { type: DataTypes.TEXT, field: 'diagnostic_code' },
  sesMessageId: { type: DataTypes.STRING(255), field: 'ses_message_id' },
  rawPayload: { type: DataTypes.JSON, field: 'raw_payload' },
}, { tableName: 'bounce_logs' });

const ComplaintLog = sequelize.define('ComplaintLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(255), allowNull: false },
  subscriberId: { type: DataTypes.INTEGER, field: 'subscriber_id' },
  complaintType: { type: DataTypes.STRING(50), field: 'complaint_type' },
  sesMessageId: { type: DataTypes.STRING(255), field: 'ses_message_id' },
  rawPayload: { type: DataTypes.JSON, field: 'raw_payload' },
}, { tableName: 'complaint_logs' });

const CampaignLog = sequelize.define('CampaignLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campaignId: { type: DataTypes.INTEGER, allowNull: false, field: 'campaign_id' },
  action: { type: DataTypes.STRING(100), allowNull: false },
  message: { type: DataTypes.TEXT },
  metadata: { type: DataTypes.JSON },
}, { tableName: 'campaign_logs' });

// Associations
EmailList.belongsToMany(Subscriber, { through: ListSubscriber, foreignKey: 'list_id', otherKey: 'subscriber_id' });
Subscriber.belongsToMany(EmailList, { through: ListSubscriber, foreignKey: 'subscriber_id', otherKey: 'list_id' });

EmailSegment.belongsToMany(Subscriber, { through: SegmentSubscriber, foreignKey: 'segment_id', otherKey: 'subscriber_id' });
Subscriber.belongsToMany(EmailSegment, { through: SegmentSubscriber, foreignKey: 'subscriber_id', otherKey: 'segment_id' });

EmailList.hasMany(ListSubscriber, { foreignKey: 'list_id' });
ListSubscriber.belongsTo(EmailList, { foreignKey: 'list_id' });
ListSubscriber.belongsTo(Subscriber, { foreignKey: 'subscriber_id' });

EmailList.hasMany(ImportLog, { foreignKey: 'list_id' });
ImportLog.belongsTo(EmailList, { foreignKey: 'list_id' });

Campaign.belongsTo(Template, { foreignKey: 'template_id' });
Campaign.belongsToMany(EmailList, { through: CampaignList, foreignKey: 'campaign_id', otherKey: 'list_id' });
Campaign.belongsToMany(EmailSegment, { through: CampaignSegment, foreignKey: 'campaign_id', otherKey: 'segment_id' });

Campaign.hasMany(SendLog, { foreignKey: 'campaign_id' });
Campaign.hasMany(CampaignLog, { foreignKey: 'campaign_id' });

Subscriber.hasMany(SendLog, { foreignKey: 'subscriber_id' });
Subscriber.hasMany(Unsubscribe, { foreignKey: 'subscriber_id' });

module.exports = {
  sequelize,
  EmailList,
  EmailSegment,
  Subscriber,
  ListSubscriber,
  SegmentSubscriber,
  ImportLog,
  Template,
  Campaign,
  CampaignList,
  CampaignSegment,
  SendLog,
  Unsubscribe,
  BounceLog,
  ComplaintLog,
  CampaignLog,
};

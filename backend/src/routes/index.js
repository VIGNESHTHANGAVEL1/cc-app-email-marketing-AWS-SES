const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validate } = require('../middleware');
const {
  emailListValidators,
  subscriberValidators,
  templateValidators,
  campaignValidators,
  segmentValidators,
} = require('../middleware/validators');

const emailListCtrl = require('../controllers/emailList.controller');
const segmentCtrl = require('../controllers/segment.controller');
const templateCtrl = require('../controllers/template.controller');
const campaignCtrl = require('../controllers/campaign.controller');
const unsubscribeCtrl = require('../controllers/unsubscribe.controller');
const webhookCtrl = require('../controllers/webhook.controller');
const reportsCtrl = require('../controllers/reports.controller');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Email Marketing API is running' });
});

// Email Lists
router.get('/lists', emailListCtrl.getAllLists);
router.get('/lists/:id', emailListCtrl.getListById);
router.post('/lists', emailListValidators.create, validate, emailListCtrl.createList);
router.put('/lists/:id', emailListValidators.update, validate, emailListCtrl.updateList);
router.delete('/lists/:id', emailListCtrl.deleteList);
router.post('/lists/:id/import', upload.single('file'), emailListCtrl.importFile);
router.get('/lists/:id/import-logs', emailListCtrl.getImportLogs);

// Subscribers
router.get('/subscribers', emailListCtrl.getSubscribers);
router.post('/subscribers', subscriberValidators.create, validate, emailListCtrl.addSubscriber);
router.put('/subscribers/:id', subscriberValidators.update, validate, emailListCtrl.updateSubscriber);
router.delete('/subscribers/:id', emailListCtrl.deleteSubscriber);

// Segments
router.get('/segments', segmentCtrl.getAllSegments);
router.get('/segments/:id', segmentCtrl.getSegmentById);
router.post('/segments', segmentValidators.create, validate, segmentCtrl.createSegment);
router.put('/segments/:id', segmentCtrl.updateSegment);
router.delete('/segments/:id', segmentCtrl.deleteSegment);

// Templates
router.get('/templates', templateCtrl.getAllTemplates);
router.get('/templates/:id', templateCtrl.getTemplateById);
router.post('/templates', templateValidators.create, validate, templateCtrl.createTemplate);
router.put('/templates/:id', templateValidators.update, validate, templateCtrl.updateTemplate);
router.delete('/templates/:id', templateCtrl.deleteTemplate);
router.post('/templates/:id/duplicate', templateCtrl.duplicateTemplate);
router.post('/templates/:id/preview', templateCtrl.previewTemplate);

// Campaigns
router.get('/campaigns', campaignCtrl.getAllCampaigns);
router.get('/campaigns/:id', campaignCtrl.getCampaignById);
router.post('/campaigns', campaignValidators.create, validate, campaignCtrl.createCampaign);
router.put('/campaigns/:id', campaignValidators.update, validate, campaignCtrl.updateCampaign);
router.delete('/campaigns/:id', campaignCtrl.deleteCampaign);
router.post('/campaigns/:id/send', campaignCtrl.sendCampaign);
router.post('/campaigns/:id/pause', campaignCtrl.pauseCampaign);
router.post('/campaigns/:id/resume', campaignCtrl.resumeCampaignHandler);
router.get('/campaigns/:id/logs', campaignCtrl.getCampaignLogs);
router.get('/campaigns/:id/send-logs', campaignCtrl.getCampaignSendLogs);

// Unsubscribe (public)
router.get('/unsubscribe/:token', unsubscribeCtrl.getUnsubscribeStatus);
router.post('/unsubscribe/:token', unsubscribeCtrl.unsubscribe);
router.get('/unsubscribes/report', unsubscribeCtrl.getUnsubscribeReport);

// AWS SES Webhooks
router.post('/webhooks/ses', webhookCtrl.handleSESWebhook);

// Reports & Analytics
router.get('/reports/dashboard', reportsCtrl.getDashboard);
router.get('/reports/campaigns/:id/analytics', reportsCtrl.getCampaignAnalytics);
router.get('/reports/export/send-logs', reportsCtrl.exportSendLogs);
router.get('/reports/export/unsubscribes', reportsCtrl.exportUnsubscribes);

module.exports = router;

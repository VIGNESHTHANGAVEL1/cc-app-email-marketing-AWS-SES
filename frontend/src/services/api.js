import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Email Lists
export const getLists = (params) => api.get('/lists', { params });
export const getList = (id) => api.get(`/lists/${id}`);
export const createList = (data) => api.post('/lists', data);
export const updateList = (id, data) => api.put(`/lists/${id}`, data);
export const deleteList = (id) => api.delete(`/lists/${id}`);
export const importEmails = (listId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/lists/${listId}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getImportLogs = (listId, params) => api.get(`/lists/${listId}/import-logs`, { params });

// Subscribers
export const getSubscribers = (params) => api.get('/subscribers', { params });
export const addSubscriber = (data) => api.post('/subscribers', data);
export const updateSubscriber = (id, data) => api.put(`/subscribers/${id}`, data);
export const deleteSubscriber = (id, params) => api.delete(`/subscribers/${id}`, { params });

// Segments
export const getSegments = (params) => api.get('/segments', { params });
export const getSegment = (id) => api.get(`/segments/${id}`);
export const createSegment = (data) => api.post('/segments', data);
export const updateSegment = (id, data) => api.put(`/segments/${id}`, data);
export const deleteSegment = (id) => api.delete(`/segments/${id}`);

// Templates
export const getTemplates = (params) => api.get('/templates', { params });
export const getTemplate = (id) => api.get(`/templates/${id}`);
export const createTemplate = (data) => api.post('/templates', data);
export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);
export const duplicateTemplate = (id) => api.post(`/templates/${id}/duplicate`);
export const previewTemplate = (id, sampleData) => api.post(`/templates/${id}/preview`, { sampleData });

// Campaigns
export const getCampaigns = (params) => api.get('/campaigns', { params });
export const getCampaign = (id) => api.get(`/campaigns/${id}`);
export const createCampaign = (data) => api.post('/campaigns', data);
export const updateCampaign = (id, data) => api.put(`/campaigns/${id}`, data);
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`);
export const sendCampaign = (id) => api.post(`/campaigns/${id}/send`);
export const pauseCampaign = (id) => api.post(`/campaigns/${id}/pause`);
export const resumeCampaign = (id) => api.post(`/campaigns/${id}/resume`);
export const getCampaignLogs = (id, params) => api.get(`/campaigns/${id}/logs`, { params });
export const getCampaignSendLogs = (id, params) => api.get(`/campaigns/${id}/send-logs`, { params });

// Reports
export const getDashboard = () => api.get('/reports/dashboard');
export const getCampaignAnalytics = (id) => api.get(`/reports/campaigns/${id}/analytics`);
export const exportSendLogs = (params) => api.get('/reports/export/send-logs', { params, responseType: 'blob' });
export const exportUnsubscribes = () => api.get('/reports/export/unsubscribes', { responseType: 'blob' });

// Unsubscribe
export const getUnsubscribeStatus = (token) => api.get(`/unsubscribe/${token}`);
export const unsubscribe = (token, reason) => api.post(`/unsubscribe/${token}`, { reason });
export const getUnsubscribeReport = (params) => api.get('/unsubscribes/report', { params });

export default api;

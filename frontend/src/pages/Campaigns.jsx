import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCampaigns, createCampaign, deleteCampaign,
  sendCampaign, pauseCampaign, resumeCampaign,
  getTemplates, getLists, getSegments,
} from '../services/api';
import { LoadingSpinner, Modal, Pagination, StatusBadge, EmptyState } from '../components/common';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [lists, setLists] = useState([]);
  const [segments, setSegments] = useState([]);
  const [form, setForm] = useState({
    name: '', templateId: '', listIds: [], segmentIds: [],
    scheduleType: 'immediate', scheduledAt: '',
  });

  const fetchCampaigns = () => {
    setLoading(true);
    getCampaigns({ page, status: statusFilter || undefined })
      .then((res) => {
        setCampaigns(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, [page, statusFilter]);

  useEffect(() => {
    Promise.all([
      getTemplates({ limit: 100 }),
      getLists({ limit: 100 }),
      getSegments({ limit: 100 }),
    ]).then(([t, l, s]) => {
      setTemplates(t.data.data);
      setLists(l.data.data);
      setSegments(s.data.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        templateId: parseInt(form.templateId, 10),
        listIds: form.listIds.map(Number),
        segmentIds: form.segmentIds.map(Number),
        scheduledAt: form.scheduleType === 'scheduled' ? form.scheduledAt : null,
      };
      await createCampaign(data);
      setShowModal(false);
      setForm({ name: '', templateId: '', listIds: [], segmentIds: [], scheduleType: 'immediate', scheduledAt: '' });
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating campaign');
    }
  };

  const handleAction = async (action, id) => {
    try {
      if (action === 'send') await sendCampaign(id);
      else if (action === 'pause') await pauseCampaign(id);
      else if (action === 'resume') await resumeCampaign(id);
      else if (action === 'cancel') {
        if (!confirm('Cancel this campaign?')) return;
        await deleteCampaign(id);
      }
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || `Error: ${action}`);
    }
  };

  const toggleArrayItem = (arr, item) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Campaign</button>
      </div>

      <div className="mb-4">
        <select className="input max-w-xs" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {['draft', 'scheduled', 'sending', 'paused', 'completed', 'failed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : campaigns.length === 0 ? (
        <EmptyState title="No campaigns" description="Create your first email campaign." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Template</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Progress</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3">
                    <Link to={`/campaigns/${c.id}`} className="text-primary-600 hover:underline font-medium">{c.name}</Link>
                  </td>
                  <td className="py-3">{c.Template?.name}</td>
                  <td className="py-3"><StatusBadge status={c.status} /></td>
                  <td className="py-3">{c.sentCount}/{c.totalRecipients}</td>
                  <td className="py-3">
                    <div className="flex gap-1 flex-wrap">
                      {['draft', 'scheduled'].includes(c.status) && (
                        <button className="btn-primary btn-sm" onClick={() => handleAction('send', c.id)}>Send</button>
                      )}
                      {c.status === 'sending' && (
                        <button className="btn-secondary btn-sm" onClick={() => handleAction('pause', c.id)}>Pause</button>
                      )}
                      {['paused', 'failed'].includes(c.status) && (
                        <button className="btn-primary btn-sm" onClick={() => handleAction('resume', c.id)}>Resume</button>
                      )}
                      {!['completed', 'cancelled'].includes(c.status) && (
                        <button className="btn-danger btn-sm" onClick={() => handleAction('cancel', c.id)}>Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Campaign">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Campaign Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Template</label>
            <select className="input" required value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })}>
              <option value="">Select template</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Email Lists</label>
            <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
              {lists.map((l) => (
                <label key={l.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.listIds.includes(String(l.id))} onChange={() => setForm({ ...form, listIds: toggleArrayItem(form.listIds, String(l.id)) })} />
                  {l.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Segments</label>
            <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
              {segments.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.segmentIds.includes(String(s.id))} onChange={() => setForm({ ...form, segmentIds: toggleArrayItem(form.segmentIds, String(s.id)) })} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Schedule</label>
            <select className="input" value={form.scheduleType} onChange={(e) => setForm({ ...form, scheduleType: e.target.value })}>
              <option value="immediate">Send Immediately</option>
              <option value="scheduled">Schedule for Later</option>
            </select>
          </div>
          {form.scheduleType === 'scheduled' && (
            <div>
              <label className="label">Scheduled Date & Time</label>
              <input className="input" type="datetime-local" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create Campaign</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

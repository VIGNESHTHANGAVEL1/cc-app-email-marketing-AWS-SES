import { useEffect, useState } from 'react';
import {
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
  duplicateTemplate, previewTemplate,
} from '../services/api';
import { LoadingSpinner, Modal, Pagination, StatusBadge, EmptyState } from '../components/common';

const PLACEHOLDERS = ['{{first_name}}', '{{last_name}}', '{{email}}', '{{full_name}}', '{{unsubscribe_url}}'];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', subject: '', htmlBody: '', textBody: '',
  });

  const fetchTemplates = () => {
    setLoading(true);
    getTemplates({ page, search: search || undefined })
      .then((res) => {
        setTemplates(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, [page, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateTemplate(editing.id, form);
      } else {
        await createTemplate({ ...form, placeholders: PLACEHOLDERS });
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', subject: '', htmlBody: '', textBody: '' });
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving template');
    }
  };

  const handlePreview = async (id) => {
    const res = await previewTemplate(id);
    setPreviewData(res.data.data);
  };

  const handleDuplicate = async (id) => {
    await duplicateTemplate(id);
    fetchTemplates();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm({ name: '', subject: '', htmlBody: '', textBody: '' }); setShowModal(true); }}>
          + New Template
        </button>
      </div>

      <div className="mb-4">
        <input className="input max-w-sm" placeholder="Search templates..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading ? <LoadingSpinner /> : templates.length === 0 ? (
        <EmptyState title="No templates" description="Create your first email template." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{t.name}</td>
                  <td className="py-3">{t.subject}</td>
                  <td className="py-3"><StatusBadge status={t.status} /></td>
                  <td className="py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button className="btn-secondary btn-sm" onClick={() => { setEditing(t); setForm({ name: t.name, subject: t.subject, htmlBody: t.htmlBody, textBody: t.textBody || '' }); setShowModal(true); }}>Edit</button>
                      <button className="btn-secondary btn-sm" onClick={() => handlePreview(t.id)}>Preview</button>
                      <button className="btn-secondary btn-sm" onClick={() => handleDuplicate(t.id)}>Duplicate</button>
                      <button className="btn-danger btn-sm" onClick={async () => { if (confirm('Archive template?')) { await deleteTemplate(t.id); fetchTemplates(); } }}>Archive</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Template' : 'New Template'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="label">HTML Body</label>
            <textarea className="input font-mono text-xs" rows={10} required value={form.htmlBody} onChange={(e) => setForm({ ...form, htmlBody: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">Placeholders: {PLACEHOLDERS.join(', ')}</p>
          </div>
          <div>
            <label className="label">Plain Text Body (optional)</label>
            <textarea className="input font-mono text-xs" rows={4} value={form.textBody} onChange={(e) => setForm({ ...form, textBody: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!previewData} onClose={() => setPreviewData(null)} title="Template Preview">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Subject</p>
            <p className="font-medium">{previewData?.subject}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">HTML Preview</p>
            <div className="border rounded-lg p-4 bg-white" dangerouslySetInnerHTML={{ __html: previewData?.htmlBody }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

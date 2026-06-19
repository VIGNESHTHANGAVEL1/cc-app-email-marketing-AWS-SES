import { useEffect, useState } from 'react';
import { getSegments, createSegment, updateSegment, deleteSegment } from '../services/api';
import { LoadingSpinner, Modal, Pagination, EmptyState } from '../components/common';

export default function Segments() {
  const [segments, setSegments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchSegments = () => {
    setLoading(true);
    getSegments({ page })
      .then((res) => {
        setSegments(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSegments(); }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateSegment(editing.id, form);
      } else {
        await createSegment(form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', description: '' });
      fetchSegments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving segment');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Segments</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); }}>
          + New Segment
        </button>
      </div>

      {loading ? <LoadingSpinner /> : segments.length === 0 ? (
        <EmptyState title="No segments" description="Create segments to group subscribers for targeted campaigns." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Created</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg) => (
                <tr key={seg.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{seg.name}</td>
                  <td className="py-3 text-gray-500">{seg.description || '—'}</td>
                  <td className="py-3">{new Date(seg.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button className="btn-secondary btn-sm" onClick={() => { setEditing(seg); setForm({ name: seg.name, description: seg.description || '' }); setShowModal(true); }}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={async () => { if (confirm('Delete segment?')) { await deleteSegment(seg.id); fetchSegments(); } }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Segment' : 'New Segment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getSubscribers, addSubscriber, updateSubscriber, deleteSubscriber, getLists } from '../services/api';
import { LoadingSpinner, Modal, Pagination, StatusBadge, EmptyState } from '../components/common';

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [lists, setLists] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [listFilter, setListFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', listId: '' });

  useEffect(() => {
    getLists({ limit: 100 }).then((res) => setLists(res.data.data));
  }, []);

  const fetchSubscribers = () => {
    setLoading(true);
    getSubscribers({
      page,
      search: search || undefined,
      status: statusFilter || undefined,
      listId: listFilter || undefined,
    })
      .then((res) => {
        setSubscribers(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubscribers(); }, [page, search, statusFilter, listFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateSubscriber(editing.id, form);
      } else {
        await addSubscriber(form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ email: '', firstName: '', lastName: '', listId: '' });
      fetchSubscribers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving subscriber');
    }
  };

  const handleEdit = (sub) => {
    setEditing(sub);
    setForm({ email: sub.email, firstName: sub.firstName || '', lastName: sub.lastName || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this subscriber?')) return;
    await deleteSubscriber(id, listFilter ? { listId: listFilter } : {});
    fetchSubscribers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Subscribers</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm({ email: '', firstName: '', lastName: '', listId: '' }); setShowModal(true); }}>
          + Add Subscriber
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input className="input max-w-xs" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="input max-w-xs" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
        </select>
        <select className="input max-w-xs" value={listFilter} onChange={(e) => { setListFilter(e.target.value); setPage(1); }}>
          <option value="">All Lists</option>
          {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : subscribers.length === 0 ? (
        <EmptyState title="No subscribers" description="Add subscribers or import from a list." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.id} className="border-b last:border-0">
                  <td className="py-3">{sub.email}</td>
                  <td className="py-3">{[sub.firstName, sub.lastName].filter(Boolean).join(' ') || '—'}</td>
                  <td className="py-3"><StatusBadge status={sub.status} /></td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button className="btn-secondary btn-sm" onClick={() => handleEdit(sub)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(sub.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Subscriber' : 'Add Subscriber'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          {!editing && (
            <div>
              <label className="label">Email List</label>
              <select className="input" required value={form.listId} onChange={(e) => setForm({ ...form, listId: e.target.value })}>
                <option value="">Select a list</option>
                {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getLists, createList, updateList, deleteList, importEmails, getImportLogs } from '../services/api';
import { LoadingSpinner, Modal, Pagination, StatusBadge, EmptyState } from '../components/common';

export default function EmailLists() {
  const [lists, setLists] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [importModal, setImportModal] = useState(null);
  const [importLogs, setImportLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(null);

  const fetchLists = () => {
    setLoading(true);
    getLists({ page, search: search || undefined })
      .then((res) => {
        setLists(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLists(); }, [page, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateList(editing.id, form);
      } else {
        await createList(form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', description: '' });
      fetchLists();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving list');
    }
  };

  const handleEdit = (list) => {
    setEditing(list);
    setForm({ name: list.name, description: list.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Archive this list?')) return;
    await deleteList(id);
    fetchLists();
  };

  const handleImport = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return;
    try {
      await importEmails(importModal.id, file);
      setImportModal(null);
      alert('Import started successfully');
      fetchLists();
    } catch (err) {
      alert(err.response?.data?.message || 'Import failed');
    }
  };

  const viewLogs = async (listId) => {
    const res = await getImportLogs(listId);
    setImportLogs(res.data.data);
    setShowLogs(listId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Email Lists</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); }}>
          + New List
        </button>
      </div>

      <div className="mb-4">
        <input
          className="input max-w-sm"
          placeholder="Search lists..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? <LoadingSpinner /> : lists.length === 0 ? (
        <EmptyState title="No email lists" description="Create your first email list to get started." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Created</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => (
                <tr key={list.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{list.name}</td>
                  <td className="py-3 text-gray-500">{list.description || '—'}</td>
                  <td className="py-3"><StatusBadge status={list.status} /></td>
                  <td className="py-3">{new Date(list.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button className="btn-secondary btn-sm" onClick={() => handleEdit(list)}>Edit</button>
                      <button className="btn-secondary btn-sm" onClick={() => setImportModal(list)}>Import</button>
                      <button className="btn-secondary btn-sm" onClick={() => viewLogs(list.id)}>Logs</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(list.id)}>Archive</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit List' : 'New List'}>
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

      <Modal isOpen={!!importModal} onClose={() => setImportModal(null)} title={`Import to ${importModal?.name}`}>
        <form onSubmit={handleImport}>
          <p className="text-sm text-gray-500 mb-4">Upload a CSV or Excel file with an "email" column. Optional: first_name, last_name.</p>
          <input type="file" name="file" accept=".csv,.xlsx,.xls" className="input" required />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="btn-secondary" onClick={() => setImportModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Import</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showLogs} onClose={() => setShowLogs(null)} title="Import Logs">
        {importLogs.length === 0 ? (
          <p className="text-gray-500">No import logs found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">File</th>
                <th className="pb-2">Imported</th>
                <th className="pb-2">Duplicates</th>
                <th className="pb-2">Invalid</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {importLogs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="py-2">{log.fileName}</td>
                  <td className="py-2">{log.importedCount}</td>
                  <td className="py-2">{log.duplicateCount}</td>
                  <td className="py-2">{log.invalidCount}</td>
                  <td className="py-2"><StatusBadge status={log.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}

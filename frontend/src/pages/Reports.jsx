import { useEffect, useState } from 'react';
import { getDashboard, exportSendLogs, exportUnsubscribes, getUnsubscribeReport } from '../services/api';
import { LoadingSpinner, downloadBlob } from '../components/common';

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [unsubscribes, setUnsubscribes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getUnsubscribeReport({ limit: 50 })])
      .then(([d, u]) => {
        setDashboard(d.data.data);
        setUnsubscribes(u.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExportSendLogs = async () => {
    const res = await exportSendLogs();
    downloadBlob(res.data, 'send_logs.csv');
  };

  const handleExportUnsubscribes = async () => {
    const res = await exportUnsubscribes();
    downloadBlob(res.data, 'unsubscribes.csv');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleExportSendLogs}>Export Send Logs</button>
          <button className="btn-secondary" onClick={handleExportUnsubscribes}>Export Unsubscribes</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Subscriber Overview</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Subscribers', value: dashboard?.subscribers?.total },
              { label: 'Active', value: dashboard?.subscribers?.active },
              { label: 'Unsubscribed', value: dashboard?.subscribers?.unsubscribed },
              { label: 'Bounced', value: dashboard?.subscribers?.bounced },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium">{item.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Email Delivery</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Sent', value: dashboard?.emails?.sent },
              { label: 'Delivered', value: dashboard?.emails?.delivered },
              { label: 'Failed', value: dashboard?.emails?.failed },
              { label: 'Bounces', value: dashboard?.emails?.bounces },
              { label: 'Complaints', value: dashboard?.emails?.complaints },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium">{item.value?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Unsubscribes</h2>
        {unsubscribes.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No unsubscribes recorded</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Campaign</th>
                <th className="pb-3 font-medium">Reason</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {unsubscribes.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">{u.campaignId || '—'}</td>
                  <td className="py-3">{u.reason || '—'}</td>
                  <td className="py-3">{new Date(u.unsubscribedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

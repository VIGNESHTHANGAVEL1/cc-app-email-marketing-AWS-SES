import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/api';
import { LoadingSpinner, StatusBadge } from '../components/common';

function StatCard({ title, value, subtitle, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  };

  return (
    <div className="card">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color]?.split(' ')[1] || 'text-gray-900'}`}>
        {value?.toLocaleString() ?? '—'}
      </p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Subscribers" value={data?.subscribers?.active} color="green" />
        <StatCard title="Total Campaigns" value={data?.campaigns?.total} />
        <StatCard title="Emails Sent" value={data?.emails?.sent} />
        <StatCard title="Delivered" value={data?.emails?.delivered} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Unsubscribed" value={data?.subscribers?.unsubscribed} color="red" />
        <StatCard title="Bounced" value={data?.emails?.bounces} color="red" />
        <StatCard title="Failed" value={data?.emails?.failed} color="yellow" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Campaigns</h2>
          <Link to="/campaigns" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        {data?.recentCampaigns?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Template</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCampaigns.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link to={`/campaigns/${c.id}`} className="text-primary-600 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3">{c.Template?.name}</td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                    <td className="py-3">{c.sentCount}/{c.totalRecipients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No campaigns yet</p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getCampaign, getCampaignAnalytics, getCampaignLogs, getCampaignSendLogs,
  sendCampaign, pauseCampaign, resumeCampaign,
} from '../services/api';
import { LoadingSpinner, Pagination, StatusBadge } from '../components/common';

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [sendLogs, setSendLogs] = useState([]);
  const [sendPagination, setSendPagination] = useState(null);
  const [sendPage, setSendPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      getCampaign(id),
      getCampaignAnalytics(id),
      getCampaignLogs(id, { limit: 20 }),
      getCampaignSendLogs(id, { page: sendPage, limit: 20 }),
    ])
      .then(([c, a, l, s]) => {
        setCampaign(c.data.data);
        setAnalytics(a.data.data);
        setLogs(l.data.data);
        setSendLogs(s.data.data);
        setSendPagination(s.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id, sendPage]);

  const handleAction = async (action) => {
    try {
      if (action === 'send') await sendCampaign(id);
      else if (action === 'pause') await pauseCampaign(id);
      else if (action === 'resume') await resumeCampaign(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || `Error: ${action}`);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!campaign) return <p>Campaign not found</p>;

  const tabs = ['overview', 'send-logs', 'history'];

  return (
    <div>
      <div className="mb-6">
        <Link to="/campaigns" className="text-sm text-primary-600 hover:underline">&larr; Back to Campaigns</Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={campaign.status} />
              <span className="text-sm text-gray-500">Template: {campaign.Template?.name}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {['draft', 'scheduled'].includes(campaign.status) && (
              <button className="btn-primary" onClick={() => handleAction('send')}>Send Now</button>
            )}
            {campaign.status === 'sending' && (
              <button className="btn-secondary" onClick={() => handleAction('pause')}>Pause</button>
            )}
            {['paused', 'failed'].includes(campaign.status) && (
              <button className="btn-primary" onClick={() => handleAction('resume')}>Resume</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`pb-2 text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && analytics && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Recipients', value: analytics.analytics.totalRecipients },
              { label: 'Sent', value: analytics.analytics.sent },
              { label: 'Delivered', value: analytics.analytics.delivered },
              { label: 'Failed', value: analytics.analytics.failed },
              { label: 'Bounced', value: analytics.analytics.bounced },
              { label: 'Complaints', value: analytics.analytics.complained },
              { label: 'Delivery Rate', value: `${analytics.analytics.deliveryRate}%` },
              { label: 'Bounce Rate', value: `${analytics.analytics.bounceRate}%` },
            ].map((stat) => (
              <div key={stat.label} className="card">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Recipient Groups</h3>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-gray-500">Lists</p>
                <p>{campaign.EmailLists?.map((l) => l.name).join(', ') || 'None'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Segments</p>
                <p>{campaign.EmailSegments?.map((s) => s.name).join(', ') || 'None'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'send-logs' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Sent At</th>
                <th className="pb-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {sendLogs.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="py-3">{log.email}</td>
                  <td className="py-3"><StatusBadge status={log.status} /></td>
                  <td className="py-3">{log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}</td>
                  <td className="py-3 text-red-500 text-xs">{log.errorMessage || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination pagination={sendPagination} onPageChange={setSendPage} />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 border-b last:border-0 pb-3">
                <div className="w-2 h-2 rounded-full bg-primary-400 mt-2" />
                <div>
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-sm text-gray-500">{log.message}</p>
                  <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

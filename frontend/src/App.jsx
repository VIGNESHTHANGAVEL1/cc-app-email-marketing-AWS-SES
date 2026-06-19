import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmailLists from './pages/EmailLists';
import Subscribers from './pages/Subscribers';
import Segments from './pages/Segments';
import Templates from './pages/Templates';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Reports from './pages/Reports';
import Unsubscribe from './pages/Unsubscribe';

export default function App() {
  return (
    <Routes>
      <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="lists" element={<EmailLists />} />
        <Route path="subscribers" element={<Subscribers />} />
        <Route path="segments" element={<Segments />} />
        <Route path="templates" element={<Templates />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

import './Dashboard.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardOverview, getMembershipGrowth, getLeaderboard } from '../api/client';
import { useAuthStore } from '../store/authStore';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, grRes, lbRes] = await Promise.all([
          getDashboardOverview(),
          getMembershipGrowth(6),
          getLeaderboard(),
        ]);
        setOverview(ovRes.data.data || ovRes.data);
        setGrowth(grRes.data.data || grRes.data || []);
        setLeaders(lbRes.data.data || lbRes.data || []);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <h1 className="dashboard__title">Dashboard</h1>
        <div className="dashboard__stats"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
      </div>
    );
  }

  const stats = overview || {};

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Dashboard</h1>
        <div className="dashboard__actions">
          <Button size="sm" onClick={() => navigate('/events/create')}>📅 Create Event</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/announcements')}>📢 Announcements</Button>
        </div>
      </div>

      <div className="dashboard__stats">
        <StatCard label="Total Members" value={stats.total_members || 0} icon="👥" />
        <StatCard label="Verified Members" value={stats.verified_members || 0} icon="✅" />
        <StatCard label="Active LGAs" value={stats.active_lgas || 0} icon="📍" />
        <StatCard label="Events This Month" value={stats.events_this_month || 0} icon="📅" />
      </div>

      <div className="dashboard__grid">
        <Card padding="md" className="dashboard__chart-card">
          <h3 className="dashboard__card-title">Membership Growth</h3>
          {growth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1a472a" strokeWidth={2} dot={{ fill: '#1a472a' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="dashboard__empty">No growth data yet</p>
          )}
        </Card>

        <Card padding="md" className="dashboard__leaders-card">
          <h3 className="dashboard__card-title">Leaderboard</h3>
          {leaders.length > 0 ? (
            <ul className="dashboard__leader-list">
              {leaders.slice(0, 8).map((l, i) => (
                <li key={i} className="dashboard__leader-item">
                  <span className="dashboard__leader-rank">#{i + 1}</span>
                  <span className="dashboard__leader-name">{l.name || l.state}</span>
                  <span className="dashboard__leader-count">{l.count || l.members} members</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard__empty">No leaderboard data yet</p>
          )}
        </Card>
      </div>

      {user?.role && ['ADMIN', 'SUPER_ADMIN', 'NATIONAL_OFFICER', 'STATE_DIRECTOR'].includes(user.role) && (
        <div className="dashboard__admin-strip">
          <h3 className="dashboard__card-title">Quick Admin Actions</h3>
          <div className="dashboard__admin-actions">
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/verifications')}>Pending Verifications</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/members')}>Manage Members</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/analytics')}>View Analytics</Button>
          </div>
        </div>
      )}
    </div>
  );
}

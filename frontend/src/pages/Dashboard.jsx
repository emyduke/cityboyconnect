import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardOverview, getMembershipGrowth, getLeaderboard } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { canAddMembers } from '../lib/permissions';
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
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
      </div>
    );
  }

  const stats = overview || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/events/create')}>📅 Create Event</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/announcements')}>📢 Announcements</Button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
        <StatCard label="Total Members" value={stats.total_members || 0} icon="👥" />
        <StatCard label="Verified Members" value={stats.verified_members || 0} icon="✅" />
        <StatCard label="Active LGAs" value={stats.active_lgas || 0} icon="📍" />
        <StatCard label="Events This Month" value={stats.events_this_month || 0} icon="📅" />
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-6 mb-8 max-md:grid-cols-1">
        <Card padding="md">
          <h3 className="text-base font-bold text-gray-900 mb-4">Membership Growth</h3>
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
            <p className="text-gray-400 text-sm text-center py-8">No growth data yet</p>
          )}
        </Card>

        <Card padding="md">
          <h3 className="text-base font-bold text-gray-900 mb-4">Leaderboard</h3>
          {leaders.length > 0 ? (
            <ul className="list-none flex flex-col gap-1">
              {leaders.slice(0, 8).map((l, i) => (
                <li key={i} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-none">
                  <span className="text-xs font-bold text-gold-dark min-w-7">#{i + 1}</span>
                  <span className="flex-1 text-sm font-medium">{l.name || l.state}</span>
                  <span className="text-xs text-gray-500">{l.count || l.members} members</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No leaderboard data yet</p>
          )}
        </Card>
      </div>

      <Card padding="md" className="mb-6 cursor-pointer" onClick={() => navigate('/bubbles')}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4">🫧 City Boys Bubbles</h3>
            <p className="text-gray-500 text-sm">Local support for your community</p>
          </div>
          <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); navigate('/bubbles'); }}>Browse</Button>
        </div>
      </Card>

      <div className="grid grid-cols-[2fr_1fr] gap-6 mb-6 max-md:grid-cols-1">
        <Card padding="md" className="cursor-pointer" onClick={() => navigate('/opportunities')}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">💼</span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Find Talents</h3>
              <p className="text-gray-500 text-sm">Browse professionals, talents & businesses</p>
            </div>
          </div>
        </Card>
        <Card padding="md" className="cursor-pointer" onClick={() => navigate('/jobs')}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Job Board</h3>
              <p className="text-gray-500 text-sm">Find opportunities & post jobs</p>
            </div>
          </div>
        </Card>
        {canAddMembers(user?.role) && (
          <Card padding="md" className="cursor-pointer" onClick={() => navigate('/members/add')}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">➕</span>
              <div>
                <h3 className="text-base font-bold text-gray-900">Add Member</h3>
                <p className="text-gray-500 text-sm">Register members in your scope</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {user?.role && ['ADMIN', 'SUPER_ADMIN', 'NATIONAL_OFFICER', 'STATE_DIRECTOR'].includes(user.role) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Admin Actions</h3>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/verifications')}>Pending Verifications</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/members')}>Manage Members</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/analytics')}>View Analytics</Button>
          </div>
        </div>
      )}
    </div>
  );
}

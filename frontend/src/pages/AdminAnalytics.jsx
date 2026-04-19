import { useState, useEffect } from 'react';
import { getDashboardOverview, getMembershipGrowth, getStructureHealth } from '../api/client';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import DataTable from '../components/DataTable';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [health, setHealth] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, grRes, hlRes] = await Promise.all([
          getDashboardOverview(),
          getMembershipGrowth(12),
          getStructureHealth(),
        ]);
        setOverview(ovRes.data.data || ovRes.data);
        setGrowth(grRes.data.data || grRes.data || []);
        setHealth(hlRes.data.data || hlRes.data || []);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div><h1 className="text-2xl font-extrabold mb-6">Analytics</h1><Skeleton variant="card" /></div>;

  const stats = overview || {};

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">National Analytics</h1>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
        <StatCard label="Total Members" value={stats.total_members || 0} icon="👥" />
        <StatCard label="Verified" value={stats.verified_members || 0} icon="✅" />
        <StatCard label="Active States" value={stats.active_states || 0} icon="🗺️" />
        <StatCard label="Active LGAs" value={stats.active_lgas || 0} icon="📍" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card padding="md">
          <h3 className="text-base font-bold mb-4">Membership Growth (12 months)</h3>
          {growth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1a472a" strokeWidth={2} dot={{ fill: '#1a472a' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No data</p>
          )}
        </Card>

        <Card padding="md">
          <h3 className="text-base font-bold mb-4">Structure Health</h3>
          {health.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={health.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="members" fill="#1a472a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No data</p>
          )}
        </Card>
      </div>

      {health.length > 0 && (
        <Card padding="md">
          <h3 className="text-base font-bold mb-4">Structure Breakdown</h3>
          <DataTable
            columns={[
              { key: 'name', label: 'Area' },
              { key: 'members', label: 'Members' },
              { key: 'events', label: 'Events' },
              { key: 'last_active', label: 'Last Active', render: v => v ? new Date(v).toLocaleDateString('en-NG') : '—' },
            ]}
            data={health}
            searchable
            sortable
          />
        </Card>
      )}
    </div>
  );
}

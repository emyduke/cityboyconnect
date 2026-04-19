import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import Badge from '../../components/Badge';
import { useToastStore } from '../../store/toastStore';
import { cn } from '../../lib/cn';

function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    if (!target) { setDisplay(0); return; }
    let start = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      setDisplay(Math.round(p * target));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [period, setPeriod] = useState('6months');
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const addToast = useToastStore(s => s.addToast);
  const refreshTimer = useRef(null);

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, actRes, growthRes] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getActivityFeed(30),
        adminApi.getMembershipGrowth(period),
      ]);
      setStats(statsRes.data || statsRes);
      setActivity((actRes.data?.results || actRes.results || actRes.data || []).slice(0, 15));
      setGrowth(growthRes.data || growthRes || []);
    } catch {
      addToast({ type: 'error', message: 'Failed to load overview data' });
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh activity feed every 30s
  useEffect(() => {
    refreshTimer.current = setInterval(async () => {
      setFeedLoading(true);
      try {
        const res = await adminApi.getActivityFeed(30);
        setActivity((res.data?.results || res.results || res.data || []).slice(0, 15));
      } catch { /* silent */ }
      setFeedLoading(false);
    }, 30000);
    return () => clearInterval(refreshTimer.current);
  }, []);

  // Reload growth data when period changes
  const handlePeriod = async (p) => {
    setPeriod(p);
  };

  if (loading) return (
    <div>
      <h1 className="text-2xl font-extrabold mb-4">Platform Overview</h1>
      <div className="grid grid-cols-3 max-md:grid-cols-2 gap-4 mb-6">
        {[...Array(6)].map((_, i) => <Skeleton key={i} variant="card" />)}
      </div>
      <div className="grid grid-cols-[2fr_1fr] max-md:grid-cols-1 gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );

  const statCards = [
    { label: 'Total Members', value: stats?.members?.total, icon: '👥', trend: stats?.members?.verification_rate },
    { label: 'Verified', value: stats?.members?.verified, icon: '✅' },
    { label: 'Pending Verification', value: stats?.members?.pending_verification, icon: '⏳' },
    { label: 'Active States', value: stats?.structure?.active_states, icon: '🏛' },
    { label: 'Events This Month', value: stats?.events?.this_month, icon: '📅' },
    { label: 'Reports Submitted', value: stats?.reports?.total_submitted, icon: '📋' },
  ];

  const maxGrowth = Math.max(...(growth.map?.(g => g.count) || [1]), 1);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-4">Platform Overview</h1>

      <div className="grid grid-cols-3 max-md:grid-cols-2 gap-4 mb-6">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-soft flex flex-col items-center text-center relative transition-all hover:-translate-y-0.5 hover:shadow-elevated cursor-default">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl max-md:text-xl font-extrabold text-gray-900 font-display"><AnimatedNumber value={s.value ?? 0} /></div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            {s.trend != null && (
              <div className={cn('text-[0.7rem] font-semibold mt-1', s.trend >= 0 ? 'text-success' : 'text-danger')}>
                {s.trend >= 0 ? '↑' : '↓'} {Math.abs(s.trend)}%
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[2fr_1fr] max-md:grid-cols-1 gap-4">
        <Card padding="md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base mb-0">Membership Growth</h3>
            <div className="flex gap-0.5 bg-gray-100 rounded p-0.5">
              {['3months', '6months', '12months'].map(p => (
                <button key={p} className={cn(
                  'bg-transparent border-none px-2 py-1 text-[0.7rem] font-semibold rounded cursor-pointer text-gray-500 transition-all',
                  period === p && 'bg-white text-forest shadow-soft'
                )} onClick={() => handlePeriod(p)}>
                  {p.replace('months', 'M')}
                </button>
              ))}
            </div>
          </div>
          {growth.length > 0 ? (
            <div className="flex items-end gap-2 h-[180px] pt-4">
              {growth.map((pt, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full max-w-[40px] bg-gradient-to-t from-forest to-forest-light rounded-t transition-all min-h-1 relative" style={{ height: `${Math.min(100, (pt.count / maxGrowth) * 100)}%` }}>
                    <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[0.6rem] font-bold text-gray-700 whitespace-nowrap">{pt.count}</span>
                  </div>
                  <span className="text-[0.65rem] text-gray-400">{pt.label || pt.month}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No growth data yet</p>
          )}
        </Card>

        <Card padding="md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base mb-0">Activity Feed</h3>
            {feedLoading && <span className="animate-spin inline-block text-sm text-gray-400">⟳</span>}
          </div>
          {activity.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No recent activity</p>
          ) : (
            <div className="flex flex-col max-h-[360px] overflow-y-auto">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-100 text-sm">
                  <div className="w-2 h-2 rounded-full bg-forest-light mt-[5px] shrink-0" />
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-gray-700">
                      {item.performed_by_name && <strong className="text-gray-900">{item.performed_by_name}</strong>} {item.action}
                    </span>
                    <span className="text-gray-400 text-[0.7rem]">{timeAgo(item.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

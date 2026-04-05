import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import Badge from '../../components/Badge';
import { useToastStore } from '../../store/toastStore';
import './Overview.css';

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
    <div className="admin-overview">
      <h1>Platform Overview</h1>
      <div className="admin-overview__stats">
        {[...Array(6)].map((_, i) => <Skeleton key={i} variant="card" />)}
      </div>
      <div className="admin-overview__cols">
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
    <div className="admin-overview">
      <h1>Platform Overview</h1>

      <div className="admin-overview__stats">
        {statCards.map((s, i) => (
          <div key={i} className="admin-overview__stat-card">
            <div className="admin-overview__stat-icon">{s.icon}</div>
            <div className="admin-overview__stat-value"><AnimatedNumber value={s.value ?? 0} /></div>
            <div className="admin-overview__stat-label">{s.label}</div>
            {s.trend != null && (
              <div className={`admin-overview__stat-trend ${s.trend >= 0 ? 'positive' : 'negative'}`}>
                {s.trend >= 0 ? '↑' : '↓'} {Math.abs(s.trend)}%
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="admin-overview__cols">
        <Card padding="md" className="admin-overview__growth">
          <div className="admin-overview__growth-header">
            <h3>Membership Growth</h3>
            <div className="admin-overview__period-selector">
              {['3months', '6months', '12months'].map(p => (
                <button key={p} className={`admin-overview__period-btn ${period === p ? 'active' : ''}`} onClick={() => handlePeriod(p)}>
                  {p.replace('months', 'M')}
                </button>
              ))}
            </div>
          </div>
          {growth.length > 0 ? (
            <div className="admin-overview__chart">
              {growth.map((pt, i) => (
                <div key={i} className="admin-overview__bar-group">
                  <div className="admin-overview__bar" style={{ height: `${Math.min(100, (pt.count / maxGrowth) * 100)}%` }}>
                    <span className="admin-overview__bar-count">{pt.count}</span>
                  </div>
                  <span className="admin-overview__bar-label">{pt.label || pt.month}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-overview__empty-text">No growth data yet</p>
          )}
        </Card>

        <Card padding="md" className="admin-overview__feed">
          <div className="admin-overview__feed-header">
            <h3>Activity Feed</h3>
            {feedLoading && <span className="admin-overview__feed-spinner">⟳</span>}
          </div>
          {activity.length === 0 ? (
            <p className="admin-overview__empty-text">No recent activity</p>
          ) : (
            <div className="admin-overview__feed-list">
              {activity.map((item, i) => (
                <div key={i} className="admin-overview__feed-item">
                  <div className="admin-overview__feed-dot" />
                  <div className="admin-overview__feed-body">
                    <span className="admin-overview__feed-action">
                      {item.performed_by_name && <strong>{item.performed_by_name}</strong>} {item.action}
                    </span>
                    <span className="admin-overview__feed-time">{timeAgo(item.created_at)}</span>
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

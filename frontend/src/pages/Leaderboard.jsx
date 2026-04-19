import { cn } from '../lib/cn';
import { useState, useEffect } from 'react';
import { getLeaderboardScores, getMyRank } from '../api/client';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const TABS = [
  { key: 'national', label: 'National' },
  { key: 'state', label: 'My State' },
  { key: 'lga', label: 'My LGA' },
  { key: 'my-score', label: 'My Score' },
];

function CircularProgress({ value, max = 100, size = 64 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="block">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-gray-200)" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-forest)" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

function ScoreDimension({ label, score, weight, detail, tip, color }) {
  const colors = { forest: 'var(--color-forest)', gold: 'var(--color-gold)', blue: 'var(--color-info)', amber: 'var(--color-warning)' };
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <span className="text-[0.85rem] font-semibold">{label}</span>
        <span className="text-[0.7rem] text-gray-400">{weight}% weight</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-[5px] overflow-hidden">
        <div className="h-full rounded-[5px] transition-[width] duration-500 ease-out min-w-[2px]" style={{ width: `${score}%`, background: colors[color] || colors.forest }} />
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-gray-500">{detail}</span>
        <span className="text-xs font-semibold">{score?.toFixed(0)}/100</span>
      </div>
      {tip && <p className="text-[0.7rem] text-forest-light italic -mt-0.5">{tip}</p>}
    </div>
  );
}

function BadgeCard({ badge, earned }) {
  return (
    <div className={cn('flex flex-col items-center gap-1 p-4 border border-gray-200 rounded-lg text-center transition-all', earned ? 'bg-forest/5 border-forest-light' : 'opacity-45 grayscale')}>
      <span className="text-2xl">{badge.icon}</span>
      <span className="text-xs font-bold">{badge.label}</span>
      <span className="text-[0.65rem] text-gray-400">{badge.description}</span>
    </div>
  );
}

export default function Leaderboard() {
  const [scope, setScope] = useState('national');
  const [entries, setEntries] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [lbRes, rankRes] = await Promise.all([
          getLeaderboardScores({ scope: scope === 'my-score' ? 'national' : scope }),
          getMyRank(),
        ]);
        const lbData = lbRes.data.data || lbRes.data;
        setEntries(lbData.results || lbData || []);
        setMyRank(rankRes.data.data || rankRes.data);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, [scope]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Leaderboard</h1>

      {myRank && (
        <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-6 py-4 mb-6 sticky top-[68px] z-10 max-sm:flex-wrap">
          <Avatar name={user?.full_name || ''} size="md" />
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold font-display text-forest-dark">#{myRank.national_rank || '—'}</span>
            <span className="text-xs text-gray-400">Your national rank</span>
          </div>
          <div className="relative flex items-center justify-center ml-auto">
            <CircularProgress value={myRank.total_score || 0} />
            <span className="absolute text-[0.85rem] font-bold text-forest">{(myRank.total_score || 0).toFixed(1)}</span>
          </div>
          <button className="bg-transparent border-none text-forest text-[0.8rem] cursor-pointer font-medium whitespace-nowrap" onClick={() => setScope('my-score')}>See breakdown →</button>
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-[3px]">
        {TABS.map(t => (
          <button key={t.key} className={cn(
            'flex-1 py-2 border-none bg-transparent rounded text-[0.8rem] font-medium cursor-pointer text-gray-500 transition-all',
            scope === t.key && 'bg-white shadow-sm text-forest font-semibold'
          )} onClick={() => setScope(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Skeleton variant="table" /> : scope === 'my-score' && myRank ? (
        <div className="flex flex-col gap-6">
          <h3 className="text-lg mb-2">Your Score Breakdown</h3>
          <ScoreDimension label="Members Onboarded" score={myRank.score_onboarding} weight={40}
            detail={`${myRank.members_onboarded_direct || 0} direct · ${myRank.members_onboarded_network || 0} total network`}
            tip="Share your QR code at events to grow your network" color="forest" />
          <ScoreDimension label="Event Attendance" score={myRank.score_attendance} weight={25}
            detail={`${myRank.events_attended || 0} events attended`}
            tip="Attend more events in your area" color="gold" />
          <ScoreDimension label="Platform Engagement" score={myRank.score_engagement} weight={20}
            detail={`${myRank.reports_submitted || 0} reports · ${myRank.announcements_read || 0} announcements read`}
            tip="Submit reports on time and read all announcements" color="blue" />
          <ScoreDimension label="Network Depth" score={myRank.score_network_depth} weight={15}
            detail={`Your tree goes ${myRank.referral_chain_depth || 0} levels deep`}
            tip="Encourage your recruits to also recruit" color="amber" />

          {myRank.badges_detail && (
            <div className="mt-4">
              <h4 className="text-base mb-4">Your Badges</h4>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 max-sm:grid-cols-2">
                {myRank.badges_detail.filter(b => b.earned).map(b => <BadgeCard key={b.key} badge={b} earned />)}
                {myRank.badges_detail.filter(b => !b.earned).map(b => <BadgeCard key={b.key} badge={b} earned={false} />)}
              </div>
            </div>
          )}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState title="No leaderboard data" description="Data will appear as members participate" icon="🏆" />
      ) : (
        <div className="flex flex-col">
          {entries.map((entry, i) => (
            <div key={entry.member_id || i} className={cn(
              'flex items-center gap-4 py-4 border-b border-gray-100 last:border-none',
              i < 3 && 'font-semibold',
              entry.member_id === user?.profile_id && 'bg-forest/5 rounded px-2'
            )}>
              <span className="text-base min-w-[32px] text-center">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank || i + 1}`}
              </span>
              <Avatar name={entry.member_name || entry.full_name || ''} size="sm" />
              <div className="flex-[0_0_120px]">
                <span className="block text-[0.85rem] font-semibold">{entry.member_name || entry.full_name}</span>
                <span className="block text-[0.7rem] text-gray-400">{entry.state_name || ''}</span>
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                <div className="h-full bg-forest rounded transition-[width] duration-500 ease-out" style={{ width: `${Math.min(100, (entry.total_score / Math.max(entries[0]?.total_score || 1, 1)) * 100)}%` }} />
              </div>
              <span className="text-[0.85rem] font-bold text-forest min-w-[48px] text-right">{(entry.total_score || 0).toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

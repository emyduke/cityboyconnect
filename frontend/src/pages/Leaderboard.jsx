import './Leaderboard.css';
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
    <svg width={size} height={size} className="circular-progress">
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
    <div className="score-dimension">
      <div className="score-dimension__header">
        <span className="score-dimension__label">{label}</span>
        <span className="score-dimension__weight">{weight}% weight</span>
      </div>
      <div className="score-dimension__bar-track">
        <div className="score-dimension__bar-fill" style={{ width: `${score}%`, background: colors[color] || colors.forest }} />
      </div>
      <div className="score-dimension__footer">
        <span className="score-dimension__detail">{detail}</span>
        <span className="score-dimension__score">{score?.toFixed(0)}/100</span>
      </div>
      {tip && <p className="score-dimension__tip">{tip}</p>}
    </div>
  );
}

function BadgeCard({ badge, earned }) {
  return (
    <div className={`badge-card ${earned ? 'badge-card--earned' : 'badge-card--locked'}`}>
      <span className="badge-card__icon">{badge.icon}</span>
      <span className="badge-card__label">{badge.label}</span>
      <span className="badge-card__desc">{badge.description}</span>
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
    <div className="leaderboard-page">
      <h1>Leaderboard</h1>

      {myRank && (
        <div className="my-rank-card">
          <Avatar name={user?.full_name || ''} size="md" />
          <div className="my-rank-card__info">
            <span className="my-rank-card__rank">#{myRank.national_rank || '—'}</span>
            <span className="my-rank-card__label">Your national rank</span>
          </div>
          <div className="my-rank-card__score">
            <CircularProgress value={myRank.total_score || 0} />
            <span className="my-rank-card__score-num">{(myRank.total_score || 0).toFixed(1)}</span>
          </div>
          <button className="my-rank-card__details" onClick={() => setScope('my-score')}>See breakdown →</button>
        </div>
      )}

      <div className="leaderboard-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`leaderboard-tab ${scope === t.key ? 'leaderboard-tab--active' : ''}`} onClick={() => setScope(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Skeleton variant="table" /> : scope === 'my-score' && myRank ? (
        <div className="score-breakdown">
          <h3>Your Score Breakdown</h3>
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
            <div className="badges-section">
              <h4>Your Badges</h4>
              <div className="badges-grid">
                {myRank.badges_detail.filter(b => b.earned).map(b => <BadgeCard key={b.key} badge={b} earned />)}
                {myRank.badges_detail.filter(b => !b.earned).map(b => <BadgeCard key={b.key} badge={b} earned={false} />)}
              </div>
            </div>
          )}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState title="No leaderboard data" description="Data will appear as members participate" icon="🏆" />
      ) : (
        <div className="leaderboard-list">
          {entries.map((entry, i) => (
            <div key={entry.member_id || i} className={`leaderboard-item ${i < 3 ? 'leaderboard-item--top' : ''} ${entry.member_id === user?.profile_id ? 'leaderboard-item--me' : ''}`}>
              <span className="leaderboard-item__rank">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank || i + 1}`}
              </span>
              <Avatar name={entry.member_name || entry.full_name || ''} size="sm" />
              <div className="leaderboard-item__info">
                <span className="leaderboard-item__name">{entry.member_name || entry.full_name}</span>
                <span className="leaderboard-item__state">{entry.state_name || ''}</span>
              </div>
              <div className="leaderboard-item__bar-wrap">
                <div className="leaderboard-item__bar" style={{ width: `${Math.min(100, (entry.total_score / Math.max(entries[0]?.total_score || 1, 1)) * 100)}%` }} />
              </div>
              <span className="leaderboard-item__count">{(entry.total_score || 0).toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import './Bubbles.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBubbles } from '../api/client';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useAuthStore } from '../store/authStore';
import { ROLE_HIERARCHY } from '../lib/permissions';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'TOOLS', label: 'Tools' },
  { value: 'OPPORTUNITIES', label: 'Opportunities' },
  { value: 'SERVICES', label: 'Services' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'OTHER', label: 'Other' },
];

export default function Bubbles() {
  const [bubbles, setBubbles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const canCreate = (ROLE_HIERARCHY[user?.role] ?? 0) >= ROLE_HIERARCHY.WARD_COORDINATOR;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category) params.category = category;
        const res = await getBubbles(params);
        setBubbles(res.data?.data?.results || res.data?.results || res.data?.data || []);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, [category]);

  return (
    <div className="bubbles-page">
      <div className="bubbles-page__header">
        <div>
          <h1>City Boys Bubbles</h1>
          <p className="bubbles-page__subtitle">Local support for our communities</p>
        </div>
        {canCreate && <Button size="sm" onClick={() => navigate('/bubbles/create')}>+ Create Bubble</Button>}
      </div>
      <div className="bubbles-page__filters">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            className={`bubbles-filter ${category === c.value ? 'bubbles-filter--active' : ''}`}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="bubbles-page__grid"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : bubbles.length === 0 ? (
        <EmptyState
          title="No bubbles yet"
          description="No bubbles in your area at this time"
          icon="🫧"
          action={canCreate ? <Button size="sm" onClick={() => navigate('/bubbles/create')}>Create Bubble</Button> : null}
        />
      ) : (
        <div className="bubbles-page__grid">
          {bubbles.map(b => (
            <div key={b.id} className="bubble-card" onClick={() => navigate(`/bubbles/${b.id}`)}>
              <div className="bubble-card__top">
                <span className={`badge--category badge--cat-${b.category}`}>{b.category_display}</span>
                <span className={`badge--status badge--st-${b.status}`}>{b.status_display}</span>
              </div>
              <div className="bubble-card__title">{b.title}</div>
              <div className="bubble-card__desc">{b.description || ''}</div>
              <div className="bubble-card__meta">
                <span className="bubble-card__location">📍 {[b.ward_name, b.lga_name].filter(Boolean).join(', ') || 'N/A'}</span>
                <span>{b.created_by_name} · {new Date(b.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import './MyBubbles.css';
import './Bubbles.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBubbles } from '../api/client';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const STATUS_ORDER = ['PENDING', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS', 'DELIVERED'];

function StatusStepper({ status }) {
  const idx = STATUS_ORDER.indexOf(status);
  return (
    <div className="my-bubbles__stepper">
      {STATUS_ORDER.map((s, i) => (
        <div key={s} className={`my-bubbles__step ${i < idx ? 'my-bubbles__step--done' : ''} ${i === idx ? 'my-bubbles__step--active' : ''}`} title={s.replace('_', ' ')} />
      ))}
    </div>
  );
}

export default function MyBubbles() {
  const [bubbles, setBubbles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyBubbles();
        setBubbles(res.data?.data?.results || res.data?.results || res.data?.data || []);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="bubbles-page">
      <div className="my-bubbles__header">
        <h1>My Bubbles</h1>
        <Button size="sm" onClick={() => navigate('/bubbles/create')}>+ Create Bubble</Button>
      </div>
      {loading ? (
        <div className="bubbles-page__grid"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : bubbles.length === 0 ? (
        <EmptyState
          title="No bubbles yet"
          description="You haven't created any bubbles yet. Leaders can create bubbles to request local support."
          icon="🫧"
          action={<Button size="sm" onClick={() => navigate('/bubbles/create')}>Create Bubble</Button>}
        />
      ) : (
        <div className="bubbles-page__grid">
          {bubbles.map(b => (
            <div key={b.id} className="bubble-card" onClick={() => navigate(`/bubbles/${b.id}`)}>
              {!['REJECTED', 'CANCELLED'].includes(b.status) && <StatusStepper status={b.status} />}
              <div className="bubble-card__top">
                <span className={`badge--category badge--cat-${b.category}`}>{b.category_display}</span>
                <span className={`badge--status badge--st-${b.status}`}>{b.status_display}</span>
              </div>
              <div className="bubble-card__title">{b.title}</div>
              <div className="bubble-card__meta">
                <span>{new Date(b.created_at).toLocaleDateString()}</span>
                <span>{b.images_count} photo{b.images_count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { cn } from '../lib/cn';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBubbles } from '../api/client';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const STATUS_ORDER = ['PENDING', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS', 'DELIVERED'];

const CATEGORY_COLORS = {
  TOOLS: 'bg-[#1a472a]',
  OPPORTUNITIES: 'bg-[#2563eb]',
  SERVICES: 'bg-[#ea580c]',
  SUPPORT: 'bg-[#7c3aed]',
  OTHER: 'bg-[#6b7280]',
};

const STATUS_COLORS = {
  PENDING: 'bg-[#fef3c7] text-[#854d0e]',
  IN_REVIEW: 'bg-[#3b82f6] text-white',
  APPROVED: 'bg-[#22c55e] text-white',
  IN_PROGRESS: 'bg-[#f97316] text-white',
  DELIVERED: 'bg-[#10b981] text-white',
  REJECTED: 'bg-[#ef4444] text-white',
  CANCELLED: 'bg-[#6b7280] text-white',
};

function StatusStepper({ status }) {
  const idx = STATUS_ORDER.indexOf(status);
  return (
    <div className="flex gap-1 mb-2">
      {STATUS_ORDER.map((s, i) => (
        <div key={s} className={cn('h-1 flex-1 rounded-sm bg-gray-200', i < idx && 'bg-forest', i === idx && 'bg-gold')} title={s.replace('_', ' ')} />
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">My Bubbles</h1>
        <Button size="sm" onClick={() => navigate('/bubbles/create')}>+ Create Bubble</Button>
      </div>
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : bubbles.length === 0 ? (
        <EmptyState
          title="No bubbles yet"
          description="You haven't created any bubbles yet. Leaders can create bubbles to request local support."
          icon="🫧"
          action={<Button size="sm" onClick={() => navigate('/bubbles/create')}>Create Bubble</Button>}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {bubbles.map(b => (
            <div key={b.id} className="bg-white rounded-2xl shadow-soft p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-elevated" onClick={() => navigate(`/bubbles/${b.id}`)}>
              {!['REJECTED', 'CANCELLED'].includes(b.status) && <StatusStepper status={b.status} />}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold text-white', CATEGORY_COLORS[b.category])}>{b.category_display}</span>
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', STATUS_COLORS[b.status])}>{b.status_display}</span>
              </div>
              <div className="text-[1.05rem] font-bold mb-1">{b.title}</div>
              <div className="flex items-center justify-between text-xs text-gray-400">
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

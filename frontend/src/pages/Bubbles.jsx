import { cn } from '../lib/cn';
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">City Boys Bubbles</h1>
          <p className="text-gray-500 text-sm mt-0.5">Local support for our communities</p>
        </div>
        {canCreate && <Button size="sm" onClick={() => navigate('/bubbles/create')}>+ Create Bubble</Button>}
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            className={cn('px-4 py-1.5 border-[1.5px] border-gray-200 rounded-full bg-white text-sm font-medium text-gray-500 cursor-pointer transition-all', category === c.value && 'border-forest bg-forest text-white')}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : bubbles.length === 0 ? (
        <EmptyState
          title="No bubbles yet"
          description="No bubbles in your area at this time"
          icon="🫧"
          action={canCreate ? <Button size="sm" onClick={() => navigate('/bubbles/create')}>Create Bubble</Button> : null}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {bubbles.map(b => (
            <div key={b.id} className="bg-white rounded-2xl shadow-soft p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-elevated" onClick={() => navigate(`/bubbles/${b.id}`)}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold text-white', CATEGORY_COLORS[b.category])}>{b.category_display}</span>
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', STATUS_COLORS[b.status])}>{b.status_display}</span>
              </div>
              <div className="text-[1.05rem] font-bold mb-1">{b.title}</div>
              <div className="text-gray-500 text-sm line-clamp-2 mb-2">{b.description || ''}</div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">📍 {[b.ward_name, b.lga_name].filter(Boolean).join(', ') || 'N/A'}</span>
                <span>{b.created_by_name} · {new Date(b.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

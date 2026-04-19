import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../lib/cn';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getAdminBubbles, getAdminBubble,
  updateBubbleStatus, deliverBubble,
} from '../../api/client';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';

const STAT_COLORS = {
  pending: '#eab308', in_review: '#3b82f6', approved: '#22c55e',
  in_progress: '#f97316', delivered: '#10b981',
};

const CAT_BG = { TOOLS: 'bg-[#1a472a]', OPPORTUNITIES: 'bg-[#2563eb]', SERVICES: 'bg-[#ea580c]', SUPPORT: 'bg-[#7c3aed]', OTHER: 'bg-gray-500' };
const STATUS_BG = {
  PENDING: 'bg-amber-100 text-amber-800', IN_REVIEW: 'bg-blue-500 text-white', APPROVED: 'bg-green-500 text-white',
  IN_PROGRESS: 'bg-orange-500 text-white', DELIVERED: 'bg-emerald-500 text-white', REJECTED: 'bg-red-500 text-white', CANCELLED: 'bg-gray-500 text-white',
};

function AdminBubblesList() {
  const [data, setData] = useState({ stats: {}, results: [] });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;
      const res = await getAdminBubbles(params);
      setData(res.data?.data || res.data || { stats: {}, results: [] });
    } catch { addToast({ type: 'error', message: 'Failed to load bubbles' }); }
    setLoading(false);
  }, [statusFilter, categoryFilter]);

  useEffect(() => { load(); }, [load]);

  const stats = data.stats || {};

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Bubbles Management</h1>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 mb-4">
        {[
          { label: 'Pending', value: stats.pending_count, color: STAT_COLORS.pending },
          { label: 'In Review', value: stats.in_review_count, color: STAT_COLORS.in_review },
          { label: 'Approved', value: stats.approved_count, color: STAT_COLORS.approved },
          { label: 'In Progress', value: stats.in_progress_count, color: STAT_COLORS.in_progress },
          { label: 'Delivered', value: stats.delivered_count, color: STAT_COLORS.delivered },
        ].map(s => (
          <div className="bg-white rounded-xl p-4 text-center shadow-soft" key={s.label}>
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value ?? 0}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select className="px-2 py-1 border-[1.5px] border-gray-200 rounded-lg text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="APPROVED">Approved</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DELIVERED">Delivered</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select className="px-2 py-1 border-[1.5px] border-gray-200 rounded-lg text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="TOOLS">Tools</option>
          <option value="OPPORTUNITIES">Opportunities</option>
          <option value="SERVICES">Services</option>
          <option value="SUPPORT">Support</option>
          <option value="OTHER">Other</option>
        </select>
        <input
          className="px-2 py-1 border-[1.5px] border-gray-200 rounded-lg text-sm"
          type="text" placeholder="Search..." value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
        />
        <Button size="sm" variant="secondary" onClick={load}>Search</Button>
      </div>

      {loading ? <Skeleton variant="card" /> : (
        <table className="w-full border-separate border-spacing-0 bg-white rounded-xl shadow-soft overflow-hidden">
          <thead>
            <tr>
              <th className="text-left p-3 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100 bg-gray-50">Title</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100 bg-gray-50">Category</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100 bg-gray-50">Creator</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100 bg-gray-50">Location</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100 bg-gray-50">Status</th>
              <th className="text-left p-3 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100 bg-gray-50">Date</th>
            </tr>
          </thead>
          <tbody>
            {(data.results || []).map(b => (
              <tr key={b.id} className="cursor-pointer transition-colors hover:bg-gray-50" onClick={() => navigate(`/admin/bubbles/${b.id}`)}>
                <td className="p-3 text-sm border-b border-gray-100">{b.title}</td>
                <td className="p-3 text-sm border-b border-gray-100"><span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold text-white', CAT_BG[b.category] || 'bg-gray-500')}>{b.category_display}</span></td>
                <td className="p-3 text-sm border-b border-gray-100">{b.created_by_name}</td>
                <td className="p-3 text-sm border-b border-gray-100">{[b.ward_name, b.lga_name].filter(Boolean).join(', ') || '—'}</td>
                <td className="p-3 text-sm border-b border-gray-100"><span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', STATUS_BG[b.status] || '')}>{b.status_display}</span></td>
                <td className="p-3 text-sm border-b border-gray-100">{new Date(b.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(data.results || []).length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No bubbles found</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdminBubbleDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bubble, setBubble] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryImages, setDeliveryImages] = useState([]);
  const [showDelivery, setShowDelivery] = useState(false);
  const addToast = useToastStore(s => s.addToast);

  const load = async () => {
    try {
      const res = await getAdminBubble(id);
      const b = res.data?.data || res.data;
      setBubble(b);
      setNotes(b.admin_notes || '');
    } catch { addToast({ type: 'error', message: 'Failed to load bubble' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async (newStatus) => {
    try {
      await updateBubbleStatus(id, { status: newStatus, admin_notes: notes });
      addToast({ type: 'success', message: `Status updated to ${newStatus.replace('_', ' ')}` });
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error?.message || 'Failed to update status' });
    }
  };

  const handleDeliver = async () => {
    if (!deliveryNotes.trim()) return addToast({ type: 'error', message: 'Delivery notes are required' });
    try {
      const fd = new FormData();
      fd.append('delivery_notes', deliveryNotes);
      deliveryImages.forEach(f => fd.append('delivery_images', f));
      await deliverBubble(id, fd);
      addToast({ type: 'success', message: 'Bubble marked as delivered' });
      setShowDelivery(false);
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error?.message || 'Failed to deliver' });
    }
  };

  if (loading) return <Skeleton variant="card" />;
  if (!bubble) return <p>Bubble not found.</p>;

  const STATUS_ACTIONS = {
    PENDING: [{ label: 'Start Review', status: 'IN_REVIEW' }, { label: 'Reject', status: 'REJECTED', variant: 'danger' }],
    IN_REVIEW: [{ label: 'Approve', status: 'APPROVED' }, { label: 'Reject', status: 'REJECTED', variant: 'danger' }],
    APPROVED: [{ label: 'Mark In Progress', status: 'IN_PROGRESS' }],
    IN_PROGRESS: [{ label: 'Mark Delivered', action: () => setShowDelivery(true) }],
  };

  const actions = STATUS_ACTIONS[bubble.status] || [];
  const requestImages = (bubble.images || []).filter(i => i.image_type === 'REQUEST');
  const deliveryImgs = (bubble.images || []).filter(i => i.image_type === 'DELIVERY');

  return (
    <div className="max-w-[800px]">
      <button className="bg-transparent border-none text-forest text-sm font-semibold cursor-pointer mb-4 hover:underline" onClick={() => navigate('/admin/bubbles')}>← Back to Bubbles</button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{bubble.title}</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold text-white', CAT_BG[bubble.category] || 'bg-gray-500')}>{bubble.category_display}</span>
        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', STATUS_BG[bubble.status] || '')}>{bubble.status_display}</span>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {actions.map((a, i) => (
          <Button key={i} size="sm" variant={a.variant || 'primary'} onClick={() => a.action ? a.action() : changeStatus(a.status)}>
            {a.label}
          </Button>
        ))}
      </div>

      {showDelivery && (
        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <h4>Delivery Details</h4>
          <textarea className="w-full min-h-[60px] p-2 border-[1.5px] border-gray-200 rounded-lg text-sm resize-y mb-2" placeholder="Delivery notes..." value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} />
          <input type="file" accept="image/*" multiple onChange={e => setDeliveryImages([...e.target.files])} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button size="sm" onClick={handleDeliver}>Confirm Delivery</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowDelivery(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mt-4">
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-1">Description</h3>
          <p className="text-sm text-gray-700">{bubble.description}</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-1">Creator</h3>
          <p className="text-sm">{bubble.created_by_name}</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-1">Location</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {bubble.state_name && <span>🏛 {bubble.state_name}</span>}
            {bubble.lga_name && <span>📍 {bubble.lga_name}</span>}
            {bubble.ward_name && <span>🏘 {bubble.ward_name}</span>}
          </div>
        </div>

        {(bubble.contact_phone || bubble.contact_whatsapp) && (
          <div>
            <h3 className="text-sm font-bold text-gray-600 mb-1">Contact</h3>
            <div className="flex gap-3 text-sm">
              {bubble.contact_phone && <a href={`tel:${bubble.contact_phone}`} className="text-forest hover:underline">📞 {bubble.contact_phone}</a>}
              {bubble.contact_whatsapp && <a href={`https://wa.me/${bubble.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">💬 WhatsApp</a>}
            </div>
          </div>
        )}

        {requestImages.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-600 mb-1">Request Photos</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
              {requestImages.map(img => <img key={img.id} className="w-full h-[120px] object-cover rounded-lg" src={img.image} alt={img.caption || ''} />)}
            </div>
          </div>
        )}

        {deliveryImgs.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-600 mb-1">Delivery Photos</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
              {deliveryImgs.map(img => <img key={img.id} className="w-full h-[120px] object-cover rounded-lg" src={img.image} alt={img.caption || ''} />)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 mb-4">
        <h3 className="text-sm font-bold text-gray-600 mb-1">Admin Notes</h3>
        <textarea className="w-full min-h-[80px] p-2 border-[1.5px] border-gray-200 rounded-lg text-sm resize-y" value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => notes !== bubble.admin_notes && updateBubbleStatus(id, { status: bubble.status, admin_notes: notes }).catch(() => {})} placeholder="Internal notes..." />
        {bubble.reviewed_by_name && (
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
            Reviewed by {bubble.reviewed_by_name} {bubble.reviewed_at && `on ${new Date(bubble.reviewed_at).toLocaleDateString()}`}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminBubbles() {
  const { id } = useParams();
  return id ? <AdminBubbleDetailView /> : <AdminBubblesList />;
}

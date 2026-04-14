import './AdminBubbles.css';
import '../../pages/Bubbles.css';
import { useState, useEffect, useCallback } from 'react';
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

      <div className="admin-bubbles__stats">
        {[
          { label: 'Pending', value: stats.pending_count, color: STAT_COLORS.pending },
          { label: 'In Review', value: stats.in_review_count, color: STAT_COLORS.in_review },
          { label: 'Approved', value: stats.approved_count, color: STAT_COLORS.approved },
          { label: 'In Progress', value: stats.in_progress_count, color: STAT_COLORS.in_progress },
          { label: 'Delivered', value: stats.delivered_count, color: STAT_COLORS.delivered },
        ].map(s => (
          <div className="admin-bubbles__stat" key={s.label}>
            <div className="admin-bubbles__stat-value" style={{ color: s.color }}>{s.value ?? 0}</div>
            <div className="admin-bubbles__stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-bubbles__filters">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="APPROVED">Approved</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DELIVERED">Delivered</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="TOOLS">Tools</option>
          <option value="OPPORTUNITIES">Opportunities</option>
          <option value="SERVICES">Services</option>
          <option value="SUPPORT">Support</option>
          <option value="OTHER">Other</option>
        </select>
        <input
          type="text" placeholder="Search..." value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
        />
        <Button size="sm" variant="secondary" onClick={load}>Search</Button>
      </div>

      {loading ? <Skeleton variant="card" /> : (
        <table className="admin-bubbles__table">
          <thead>
            <tr>
              <th>Title</th><th>Category</th><th>Creator</th><th>Location</th><th>Status</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(data.results || []).map(b => (
              <tr key={b.id} onClick={() => navigate(`/admin/bubbles/${b.id}`)}>
                <td>{b.title}</td>
                <td><span className={`badge--category badge--cat-${b.category}`}>{b.category_display}</span></td>
                <td>{b.created_by_name}</td>
                <td>{[b.ward_name, b.lga_name].filter(Boolean).join(', ') || '—'}</td>
                <td><span className={`badge--status badge--st-${b.status}`}>{b.status_display}</span></td>
                <td>{new Date(b.created_at).toLocaleDateString()}</td>
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
    <div className="admin-bubble-detail">
      <button className="bubble-detail__back" onClick={() => navigate('/admin/bubbles')}>← Back to Bubbles</button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{bubble.title}</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        <span className={`badge--category badge--cat-${bubble.category}`}>{bubble.category_display}</span>
        <span className={`badge--status badge--st-${bubble.status}`}>{bubble.status_display}</span>
      </div>

      <div className="admin-bubble-detail__actions">
        {actions.map((a, i) => (
          <Button key={i} size="sm" variant={a.variant || 'primary'} onClick={() => a.action ? a.action() : changeStatus(a.status)}>
            {a.label}
          </Button>
        ))}
      </div>

      {showDelivery && (
        <div className="admin-bubble-detail__delivery-form">
          <h4>Delivery Details</h4>
          <textarea placeholder="Delivery notes..." value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} />
          <input type="file" accept="image/*" multiple onChange={e => setDeliveryImages([...e.target.files])} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button size="sm" onClick={handleDeliver}>Confirm Delivery</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowDelivery(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bubble-detail__body">
        <div className="bubble-detail__section">
          <h3 className="bubble-detail__section-title">Description</h3>
          <p className="bubble-detail__desc">{bubble.description}</p>
        </div>

        <div className="bubble-detail__section">
          <h3 className="bubble-detail__section-title">Creator</h3>
          <p>{bubble.created_by_name}</p>
        </div>

        <div className="bubble-detail__section">
          <h3 className="bubble-detail__section-title">Location</h3>
          <div className="bubble-detail__location">
            {bubble.state_name && <span>🏛 {bubble.state_name}</span>}
            {bubble.lga_name && <span>📍 {bubble.lga_name}</span>}
            {bubble.ward_name && <span>🏘 {bubble.ward_name}</span>}
          </div>
        </div>

        {(bubble.contact_phone || bubble.contact_whatsapp) && (
          <div className="bubble-detail__section">
            <h3 className="bubble-detail__section-title">Contact</h3>
            <div className="bubble-detail__contact">
              {bubble.contact_phone && <a href={`tel:${bubble.contact_phone}`} className="phone-link">📞 {bubble.contact_phone}</a>}
              {bubble.contact_whatsapp && <a href={`https://wa.me/${bubble.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="whatsapp-link">💬 WhatsApp</a>}
            </div>
          </div>
        )}

        {requestImages.length > 0 && (
          <div className="bubble-detail__section">
            <h3 className="bubble-detail__section-title">Request Photos</h3>
            <div className="bubble-detail__images">
              {requestImages.map(img => <img key={img.id} src={img.image} alt={img.caption || ''} />)}
            </div>
          </div>
        )}

        {deliveryImgs.length > 0 && (
          <div className="bubble-detail__section">
            <h3 className="bubble-detail__section-title">Delivery Photos</h3>
            <div className="bubble-detail__images">
              {deliveryImgs.map(img => <img key={img.id} src={img.image} alt={img.caption || ''} />)}
            </div>
          </div>
        )}
      </div>

      <div className="admin-bubble-detail__notes">
        <h3 className="bubble-detail__section-title">Admin Notes</h3>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => notes !== bubble.admin_notes && updateBubbleStatus(id, { status: bubble.status, admin_notes: notes }).catch(() => {})} placeholder="Internal notes..." />
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

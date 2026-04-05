import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';
import './VerificationsQueue.css';

const REJECT_REASONS = [
  { value: 'CARD_UNREADABLE', label: 'Card Unreadable' },
  { value: 'CARD_DOES_NOT_MATCH', label: 'Card Does Not Match' },
  { value: 'DUPLICATE_SUBMISSION', label: 'Duplicate Submission' },
  { value: 'SUSPECTED_FRAUD', label: 'Suspected Fraud' },
  { value: 'INVALID_VIN', label: 'Invalid VIN' },
  { value: 'OTHER', label: 'Other' },
];

export default function VerificationsQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved_today: 0, rejected_today: 0 });
  const [voterCardUrl, setVoterCardUrl] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const addToast = useToastStore(s => s.addToast);

  const load = async () => {
    setLoading(true);
    try {
      const [queueRes, statsRes] = await Promise.all([
        adminApi.getVerificationQueue({ status: statusFilter, page_size: 200 }),
        adminApi.getVerificationStats().catch(() => ({ data: {} })),
      ]);
      const data = queueRes.data || queueRes;
      setQueue(data.results || data || []);
      const s = statsRes.data || statsRes;
      setStats({ pending: s.total_pending || s.pending || data.count || 0, approved_today: s.approved_today || 0, rejected_today: s.rejected_today || 0 });
    } catch { addToast({ type: 'error', message: 'Failed to load verification queue' }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const selectMember = async (m) => {
    setSelected(m);
    setVoterCardUrl(null);
    if (m?.pk) {
      try {
        const res = await adminApi.getVoterCardUrl(m.pk);
        setVoterCardUrl(res.data?.url || res.url || null);
      } catch { /* no card */ }
    }
  };

  const autoAdvance = () => {
    const idx = queue.findIndex(m => m.pk === selected?.pk);
    const remaining = queue.filter((_, i) => i !== idx);
    setQueue(remaining);
    if (remaining.length > 0) {
      const nextIdx = Math.min(idx, remaining.length - 1);
      selectMember(remaining[nextIdx]);
    } else { setSelected(null); }
    setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1) }));
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading('approve');
    try {
      await adminApi.verifyMember(selected.pk);
      setStats(s => ({ ...s, approved_today: s.approved_today + 1 }));
      addToast({ type: 'success', message: `${selected.full_name || 'Member'} verified` });
      autoAdvance();
    } catch { addToast({ type: 'error', message: 'Verification failed' }); }
    setActionLoading('');
  };

  const openRejectModal = () => {
    if (!selected) return;
    setRejectReason('');
    setRejectModal(true);
  };

  const handleReject = async () => {
    if (!selected || !rejectReason) return;
    setActionLoading('reject');
    setRejectModal(false);
    try {
      await adminApi.rejectMember(selected.pk, rejectReason);
      setStats(s => ({ ...s, rejected_today: s.rejected_today + 1 }));
      addToast({ type: 'info', message: `${selected.full_name || 'Member'} rejected` });
      autoAdvance();
    } catch { addToast({ type: 'error', message: 'Rejection failed' }); }
    setActionLoading('');
  };

  const handleSkip = () => {
    const idx = queue.findIndex(m => m.pk === selected?.pk);
    if (idx < queue.length - 1) selectMember(queue[idx + 1]);
  };

  // Keyboard shortcuts: A=Approve, R=Reject, S=Skip
  useEffect(() => {
    const handler = (e) => {
      if (!selected || rejectModal || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'a' || e.key === 'A') handleApprove();
      else if (e.key === 'r' || e.key === 'R') openRejectModal();
      else if (e.key === 's' || e.key === 'S') handleSkip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, queue, rejectModal]);

  const statusVariant = (s) => {
    if (s === 'VERIFIED') return 'success';
    if (s === 'REJECTED') return 'danger';
    return 'warning';
  };

  return (
    <div className="admin-verifications">
      <h1>Verifications Queue</h1>
      <div className="admin-verifications__stats-bar">
        <div className="admin-verifications__stat">
          <span className="admin-verifications__stat-val">{stats.pending}</span> pending
        </div>
        <div className="admin-verifications__stat admin-verifications__stat--success">
          <span className="admin-verifications__stat-val">{stats.approved_today}</span> approved today
        </div>
        <div className="admin-verifications__stat admin-verifications__stat--danger">
          <span className="admin-verifications__stat-val">{stats.rejected_today}</span> rejected today
        </div>
        <span className="admin-verifications__hint">Shortcuts: A=Approve, R=Reject, S=Skip</span>
      </div>

      <div className="admin-verifications__filter-bar">
        {['PENDING', 'VERIFIED', 'REJECTED'].map(s => (
          <button
            key={s}
            className={`admin-verifications__filter-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => { setStatusFilter(s); setSelected(null); }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="admin-verifications__split">
        <div className="admin-verifications__list">
          {loading ? <Skeleton variant="table" /> : queue.length === 0 ? (
            <div className="admin-verifications__empty">
              <span className="admin-verifications__empty-icon">{statusFilter === 'PENDING' ? '✅' : '📋'}</span>
              <p>{statusFilter === 'PENDING' ? 'All verifications processed!' : `No ${statusFilter.toLowerCase()} records`}</p>
              <p className="admin-verifications__empty-sub">{statusFilter === 'PENDING' ? 'No pending verifications in queue' : 'Nothing to show yet'}</p>
            </div>
          ) : queue.map(m => (
            <div
              key={m.pk}
              className={`admin-verifications__item ${selected?.pk === m.pk ? 'admin-verifications__item--selected' : ''}`}
              onClick={() => selectMember(m)}
            >
              <Avatar name={m.full_name || m.name || ''} size="sm" />
              <div className="admin-verifications__item-info">
                <span className="admin-verifications__item-name">{m.full_name || m.name}</span>
                <span className="admin-verifications__item-meta">{m.state_name || m.state || ''} · {m.joined_at ? `${Math.floor((Date.now() - new Date(m.joined_at)) / 86400000)}d ago` : ''}</span>
              </div>
              <Badge variant={statusVariant(m.voter_verification_status)}>{m.voter_verification_status || 'PENDING'}</Badge>
            </div>
          ))}
        </div>

        <div className="admin-verifications__review">
          {!selected ? (
            <div className="admin-verifications__placeholder">
              <span className="admin-verifications__placeholder-icon">👈</span>
              <p>Select a member to review</p>
            </div>
          ) : (
            <div className="admin-verifications__review-content">
              <div className="admin-verifications__review-header">
                <Avatar name={selected.full_name || ''} size="lg" />
                <h3>{selected.full_name || selected.name}</h3>
                <p>{selected.state_name || ''} · {selected.lga_name || ''}</p>
              </div>

              {voterCardUrl ? (
                <div className="admin-verifications__voter-card">
                  <img src={voterCardUrl} alt="Voter card" />
                </div>
              ) : selected.voter_card_image ? (
                <div className="admin-verifications__voter-card">
                  <img src={selected.voter_card_image} alt="Voter card" />
                </div>
              ) : (
                <div className="admin-verifications__no-card">No voter card image uploaded</div>
              )}

              {selected.voter_card_number && (
                <div className="admin-verifications__vin">
                  <strong>VIN:</strong> {selected.voter_card_number}
                </div>
              )}

              {statusFilter === 'PENDING' && (
                <div className="admin-verifications__actions">
                  <Button onClick={handleApprove} loading={actionLoading === 'approve'} size="lg" style={{ flex: 1 }}>
                    ✓ Approve (A)
                  </Button>
                  <Button variant="danger" onClick={openRejectModal} loading={actionLoading === 'reject'} size="lg" style={{ flex: 1 }}>
                    ✗ Reject (R)
                  </Button>
                </div>
              )}
              {statusFilter === 'PENDING' && (
                <button className="admin-verifications__skip" onClick={handleSkip}>→ Skip for now (S)</button>
              )}
            </div>
          )}
        </div>
      </div>

      {rejectModal && (
        <div className="admin-verifications__modal-overlay" onClick={() => setRejectModal(false)}>
          <div className="admin-verifications__modal" onClick={e => e.stopPropagation()}>
            <h3>Reject Verification</h3>
            <p className="admin-verifications__modal-sub">Select a reason for rejecting <strong>{selected?.full_name}</strong>'s voter card</p>
            <div className="admin-verifications__reason-list">
              {REJECT_REASONS.map(r => (
                <label key={r.value} className={`admin-verifications__reason-option ${rejectReason === r.value ? 'active' : ''}`}>
                  <input type="radio" name="reject_reason" value={r.value} checked={rejectReason === r.value} onChange={() => setRejectReason(r.value)} />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
            <div className="admin-verifications__modal-actions">
              <Button variant="ghost" onClick={() => setRejectModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleReject} disabled={!rejectReason}>Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

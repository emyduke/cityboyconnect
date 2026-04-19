import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';
import { cn } from '../../lib/cn';

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
    <div>
      <h1 className="text-2xl font-extrabold mb-4">Verifications Queue</h1>
      <div className="flex gap-4 text-sm text-gray-500 mb-4 pb-3 border-b border-gray-200 flex-wrap items-center">
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-lg text-gray-900">{stats.pending}</span> pending
        </div>
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-lg text-success">{stats.approved_today}</span> approved today
        </div>
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-lg text-danger">{stats.rejected_today}</span> rejected today
        </div>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Shortcuts: A=Approve, R=Reject, S=Skip</span>
      </div>

      <div className="flex gap-1 mb-4">
        {['PENDING', 'VERIFIED', 'REJECTED'].map(s => (
          <button
            key={s}
            className={cn(
              'px-3 py-1 rounded-full border border-gray-200 bg-white cursor-pointer text-xs font-semibold text-gray-500 transition-all hover:bg-gray-50',
              statusFilter === s && 'bg-forest text-white border-forest'
            )}
            onClick={() => { setStatusFilter(s); setSelected(null); }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-4 min-h-[500px] max-md:flex-col">
        <div className="w-[340px] min-w-[280px] max-md:w-full border border-gray-200 rounded-xl bg-white overflow-y-auto max-h-[calc(100vh-200px)] max-md:max-h-[300px]">
          {loading ? <Skeleton variant="table" /> : queue.length === 0 ? (
            <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
              <span className="text-4xl">{statusFilter === 'PENDING' ? '✅' : '📋'}</span>
              <p>{statusFilter === 'PENDING' ? 'All verifications processed!' : `No ${statusFilter.toLowerCase()} records`}</p>
              <p className="text-xs">{statusFilter === 'PENDING' ? 'No pending verifications in queue' : 'Nothing to show yet'}</p>
            </div>
          ) : queue.map(m => (
            <div
              key={m.pk}
              className={cn(
                'flex items-center gap-2 p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50',
                selected?.pk === m.pk && 'bg-off-white border-l-[3px] border-l-forest'
              )}
              onClick={() => selectMember(m)}
            >
              <Avatar name={m.full_name || m.name || ''} size="sm" />
              <div className="flex-1">
                <span className="block text-sm font-semibold">{m.full_name || m.name}</span>
                <span className="block text-[0.7rem] text-gray-400">{m.state_name || m.state || ''} · {m.joined_at ? `${Math.floor((Date.now() - new Date(m.joined_at)) / 86400000)}d ago` : ''}</span>
              </div>
              <Badge variant={statusVariant(m.voter_verification_status)}>{m.voter_verification_status || 'PENDING'}</Badge>
            </div>
          ))}
        </div>

        <div className="flex-1 border border-gray-200 rounded-xl bg-white p-4">
          {!selected ? (
            <div className="text-center text-gray-400 py-16 flex flex-col items-center gap-2">
              <span className="text-3xl">👈</span>
              <p>Select a member to review</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="text-center flex flex-col items-center gap-1">
                <Avatar name={selected.full_name || ''} size="lg" />
                <h3>{selected.full_name || selected.name}</h3>
                <p>{selected.state_name || ''} · {selected.lga_name || ''}</p>
              </div>

              {voterCardUrl ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img className="w-full max-h-[300px] object-contain" src={voterCardUrl} alt="Voter card" />
                </div>
              ) : selected.voter_card_image ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img className="w-full max-h-[300px] object-contain" src={selected.voter_card_image} alt="Voter card" />
                </div>
              ) : (
                <div className="text-center p-4 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg text-sm">No voter card image uploaded</div>
              )}

              {selected.voter_card_number && (
                <div className="text-sm py-2">
                  <strong>VIN:</strong> {selected.voter_card_number}
                </div>
              )}

              {statusFilter === 'PENDING' && (
                <div className="flex gap-4">
                  <Button onClick={handleApprove} loading={actionLoading === 'approve'} size="lg" style={{ flex: 1 }}>
                    ✓ Approve (A)
                  </Button>
                  <Button variant="danger" onClick={openRejectModal} loading={actionLoading === 'reject'} size="lg" style={{ flex: 1 }}>
                    ✗ Reject (R)
                  </Button>
                </div>
              )}
              {statusFilter === 'PENDING' && (
                <button className="bg-transparent border-none text-gray-400 text-sm cursor-pointer text-center hover:text-gray-600" onClick={handleSkip}>→ Skip for now (S)</button>
              )}
            </div>
          )}
        </div>
      </div>

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setRejectModal(false)}>
          <div className="bg-white rounded-xl p-5 w-[90%] max-w-[440px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-1">Reject Verification</h3>
            <p className="text-sm text-gray-500 mb-4">Select a reason for rejecting <strong>{selected?.full_name}</strong>'s voter card</p>
            <div className="flex flex-col gap-1 mb-4">
              {REJECT_REASONS.map(r => (
                <label key={r.value} className={cn(
                  'flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer text-sm transition-all hover:bg-gray-50',
                  rejectReason === r.value && 'border-danger bg-red-50/50'
                )}>
                  <input type="radio" name="reject_reason" value={r.value} checked={rejectReason === r.value} onChange={() => setRejectReason(r.value)} className="accent-danger" />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setRejectModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleReject} disabled={!rejectReason}>Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

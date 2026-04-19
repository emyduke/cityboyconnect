import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../../lib/cn';

const STATUS_COLORS = { VERIFIED: 'success', PENDING: 'warning', REJECTED: 'danger', SUSPENDED: 'default' };
const ROLES = ['MEMBER', 'WARD_COORDINATOR', 'LGA_COORDINATOR', 'STATE_DIRECTOR', 'NATIONAL_OFFICER', 'SUPER_ADMIN'];

const REJECT_REASONS = [
  { value: 'CARD_UNREADABLE', label: 'Card Unreadable' },
  { value: 'CARD_DOES_NOT_MATCH', label: 'Card Does Not Match' },
  { value: 'DUPLICATE_SUBMISSION', label: 'Duplicate Submission' },
  { value: 'SUSPECTED_FRAUD', label: 'Suspected Fraud' },
  { value: 'INVALID_VIN', label: 'Invalid VIN' },
  { value: 'OTHER', label: 'Other' },
];

export default function MembersManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [panelData, setPanelData] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [actionModal, setActionModal] = useState(null); // 'reject' | 'suspend' | null
  const [actionTarget, setActionTarget] = useState(null);
  const [modalReason, setModalReason] = useState('');
  const addToast = useToastStore(s => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (search) params.search = search;
      if (statusFilter) params.verification_status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      const res = await adminApi.getMembers(params);
      const data = res.data || res;
      setMembers(data.results || data || []);
      setTotal(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 20) || 1);
    } catch {
      addToast({ type: 'error', message: 'Failed to load members' });
    }
    setLoading(false);
  }, [page, statusFilter, roleFilter]);

  useEffect(() => { load(); }, [load]);

  // Sync URL params
  useEffect(() => {
    const p = {};
    if (search) p.search = search;
    if (statusFilter) p.status = statusFilter;
    if (roleFilter) p.role = roleFilter;
    if (page > 1) p.page = String(page);
    setSearchParams(p, { replace: true });
  }, [search, statusFilter, roleFilter, page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const openPanel = async (pk) => {
    setSelected(pk); setPanelLoading(true);
    try {
      const res = await adminApi.getMemberDetail(pk);
      setPanelData(res.data || res);
    } catch { setPanelData(null); }
    setPanelLoading(false);
  };

  const handleAction = async (action, pk, extra) => {
    if (action === 'reject') { setActionModal('reject'); setActionTarget(pk); setModalReason(''); return; }
    if (action === 'suspend') { setActionModal('suspend'); setActionTarget(pk); setModalReason(''); return; }
    await executeAction(action, pk, extra);
  };

  const executeAction = async (action, pk, extra) => {
    setActionLoading(action);
    try {
      if (action === 'verify') { await adminApi.verifyMember(pk); addToast({ type: 'success', message: 'Member verified' }); }
      else if (action === 'reject') { await adminApi.rejectMember(pk, extra); addToast({ type: 'success', message: 'Member rejected' }); }
      else if (action === 'suspend') { await adminApi.suspendMember(pk, extra); addToast({ type: 'success', message: 'Member suspended' }); }
      else if (action === 'unsuspend') { await adminApi.unsuspendMember(pk); addToast({ type: 'success', message: 'Member unsuspended' }); }
      else if (action === 'role') { await adminApi.changeMemberRole(pk, extra); addToast({ type: 'success', message: `Role changed to ${extra}` }); }
      else if (action === 'delete') { if (!window.confirm('Permanently delete this member? This cannot be undone.')) { setActionLoading(''); return; } await adminApi.deleteMember(pk); addToast({ type: 'success', message: 'Member deleted' }); setSelected(null); setPanelData(null); }
      load();
      if (selected === pk && action !== 'delete') openPanel(pk);
    } catch { addToast({ type: 'error', message: `Action "${action}" failed` }); }
    setActionLoading('');
  };

  const handleModalSubmit = () => {
    if (!modalReason.trim()) return;
    setActionModal(null);
    if (actionModal === 'reject') executeAction('reject', actionTarget, modalReason.trim());
    else if (actionModal === 'suspend') executeAction('suspend', actionTarget, modalReason.trim());
  };

  const handleBulkAction = async (action) => {
    if (bulkSelected.size === 0) return;
    const ids = [...bulkSelected];
    if (!window.confirm(`${action} ${ids.length} member(s)?`)) return;
    try {
      await adminApi.bulkAction(action, ids);
      addToast({ type: 'success', message: `Bulk ${action} completed for ${ids.length} member(s)` });
      setBulkSelected(new Set());
      setBulkMode(false);
      load();
    } catch { addToast({ type: 'error', message: `Bulk ${action} failed` }); }
  };

  const toggleBulk = (id) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (bulkSelected.size === members.length) setBulkSelected(new Set());
    else setBulkSelected(new Set(members.map(m => m.pk)));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold">Members Management</h1>
        <div className="flex gap-2">
          <Button variant={bulkMode ? 'primary' : 'ghost'} size="sm" onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}>
            {bulkMode ? 'Cancel Bulk' : 'Bulk Select'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => adminApi.exportMembers({ status: statusFilter, role: roleFilter, search })}>
            Export CSV
          </Button>
        </div>
      </div>

      {bulkMode && bulkSelected.size > 0 && (
        <div className="flex items-center gap-4 px-3 py-2 bg-forest text-white rounded-lg mb-4 text-sm font-semibold">
          <span>{bulkSelected.size} selected</span>
          <Button size="sm" variant="secondary" onClick={() => handleBulkAction('verify')}>Verify All</Button>
          <Button size="sm" variant="secondary" onClick={() => handleBulkAction('suspend')}>Suspend All</Button>
          <Button size="sm" variant="danger" onClick={() => handleBulkAction('delete')}>Delete All</Button>
        </div>
      )}

      <div className="flex gap-4 mb-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
          <Button type="submit" size="sm">Search</Button>
        </form>
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="flex gap-4 max-[900px]:flex-col">
        <div className="flex-1 overflow-x-auto">
          {loading ? <Skeleton variant="table" /> : members.length === 0 ? (
            <div className="text-center text-gray-400 py-12 flex flex-col items-center gap-2">
              <span className="text-4xl">👥</span>
              <p>No members found</p>
              <p className="text-xs">Try adjusting your filters or search</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {bulkMode && <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase"><input type="checkbox" checked={bulkSelected.size === members.length} onChange={toggleAll} /></th>}
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Member</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Phone</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">State</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Role</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Score</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Joined</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const mpk = m.pk;
                  return (
                    <tr key={mpk} className={selected === mpk ? 'bg-gray-50' : ''}>
                      {bulkMode && <td className="px-3 py-2 border-b border-gray-100"><input type="checkbox" checked={bulkSelected.has(mpk)} onChange={() => toggleBulk(mpk)} /></td>}
                      <td className="px-3 py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.full_name || m.name || ''} size="sm" />
                          <span>{m.full_name || m.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">{m.masked_phone || m.phone || '—'}</td>
                      <td className="px-3 py-2 border-b border-gray-100">{m.state_name || m.state || '—'}</td>
                      <td className="px-3 py-2 border-b border-gray-100"><span className="text-[0.7rem] font-semibold text-gray-500 uppercase">{(m.role || 'MEMBER').replace(/_/g, ' ')}</span></td>
                      <td className="px-3 py-2 border-b border-gray-100"><Badge variant={STATUS_COLORS[m.voter_verification_status || m.status] || 'default'}>{m.voter_verification_status || m.status || '—'}</Badge></td>
                      <td className="px-3 py-2 border-b border-gray-100">{m.score != null ? m.score : '—'}</td>
                      <td className="px-3 py-2 border-b border-gray-100">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <button className="bg-transparent border-none text-forest text-xs cursor-pointer font-medium hover:underline" onClick={() => openPanel(mpk)}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {total > 20 && (
            <div className="flex justify-center items-center gap-4 p-4 text-sm">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span>Page {page} of {totalPages} ({total} total)</span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>

        {selected && (
          <div className="w-[360px] min-w-[320px] max-[900px]:w-full max-[900px]:static bg-white border border-gray-200 rounded-xl p-4 sticky top-[72px] max-h-[calc(100vh-100px)] overflow-y-auto relative">
            <button className="absolute top-2 right-2 bg-transparent border-none text-xl cursor-pointer text-gray-400" onClick={() => { setSelected(null); setPanelData(null); }}>✕</button>
            {panelLoading ? <Skeleton variant="card" /> : panelData ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Avatar name={panelData.full_name || ''} size="lg" />
                  <h3>{panelData.full_name}</h3>
                  <Badge variant={STATUS_COLORS[panelData.voter_verification_status] || 'default'}>{panelData.voter_verification_status}</Badge>
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <div><strong>Phone:</strong> {panelData.masked_phone || panelData.phone || '—'}</div>
                  <div><strong>Email:</strong> {panelData.email || '—'}</div>
                  <div><strong>Occupation:</strong> {panelData.occupation || '—'}</div>
                  <div><strong>Gender:</strong> {panelData.gender || '—'}</div>
                  <div><strong>Date of Birth:</strong> {panelData.date_of_birth ? new Date(panelData.date_of_birth).toLocaleDateString() : '—'}</div>
                  <div><strong>State:</strong> {panelData.state_name || '—'}</div>
                  <div><strong>LGA:</strong> {panelData.lga_name || '—'}</div>
                  <div><strong>Ward:</strong> {panelData.ward_name || '—'}</div>
                  <div><strong>Address:</strong> {panelData.residential_address || '—'}</div>
                  <div><strong>Membership ID:</strong> {panelData.membership_id || '—'}</div>
                  <div><strong>Role:</strong> {(panelData.role || '—').replace(/_/g, ' ')}</div>
                  <div><strong>Referred by:</strong> {panelData.referred_by_name || '—'}</div>
                  <div><strong>Joined:</strong> {panelData.joined_at ? new Date(panelData.joined_at).toLocaleDateString() : '—'}</div>
                </div>
                {panelData.score && (
                  <div className="text-sm py-2 border-t border-gray-100">
                    <strong>Score:</strong> {typeof panelData.score === 'object' ? panelData.score.total_score?.toFixed(1) : panelData.score}/100
                    {panelData.onboarded_count != null && <> · <strong>Onboarded:</strong> {panelData.onboarded_count}</>}
                    {panelData.events_attended_count != null && <> · <strong>Events:</strong> {panelData.events_attended_count}</>}
                    {panelData.reports_count != null && <> · <strong>Reports:</strong> {panelData.reports_count}</>}
                  </div>
                )}
                {panelData.voter_card_image && (
                  <div className="text-center">
                    <strong>Voter Card:</strong>
                    <img className="max-w-full rounded-lg mt-2 border border-gray-200" src={panelData.voter_card_image} alt="Voter card" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {panelData.voter_verification_status === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={() => handleAction('verify', panelData.pk)} loading={actionLoading === 'verify'}>Verify</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleAction('reject', panelData.pk)} loading={actionLoading === 'reject'}>Reject</Button>
                    </>
                  )}
                  {panelData.is_active !== false ? (
                    <Button size="sm" variant="secondary" onClick={() => handleAction('suspend', panelData.pk)} loading={actionLoading === 'suspend'}>Suspend</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => handleAction('unsuspend', panelData.pk)} loading={actionLoading === 'unsuspend'}>Unsuspend</Button>
                  )}
                  <select className="px-2 py-1 border border-gray-200 rounded text-xs" onChange={e => { if (e.target.value) handleAction('role', panelData.pk, e.target.value); }} defaultValue="">
                    <option value="" disabled>Change Role</option>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                  <Button size="sm" variant="danger" onClick={() => handleAction('delete', panelData.pk)} loading={actionLoading === 'delete'}>Delete</Button>
                </div>
              </div>
            ) : <p>Failed to load details</p>}
          </div>
        )}
      </div>

      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setActionModal(null)}>
          <div className="bg-white rounded-xl p-4 w-[90%] max-w-[420px] shadow-[0_8px_32px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-bold">{actionModal === 'reject' ? 'Reject Member' : 'Suspend Member'}</h3>
            <p className="mb-4 text-sm text-gray-600">{actionModal === 'reject' ? 'Select a reason for rejection:' : 'Provide a reason for suspension:'}</p>
            {actionModal === 'reject' ? (
              <div className="flex flex-col gap-2 mb-4">
                {REJECT_REASONS.map(r => (
                  <label key={r.value} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer text-sm transition-colors hover:bg-gray-50">
                    <input type="radio" name="reject-reason" value={r.value} checked={modalReason === r.value} onChange={() => setModalReason(r.value)} className="accent-forest" />
                    {r.label}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y mb-4 font-[inherit]"
                placeholder="Enter suspension reason..."
                value={modalReason}
                onChange={e => setModalReason(e.target.value)}
                rows={3}
              />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button variant={actionModal === 'reject' ? 'secondary' : 'danger'} size="sm" disabled={!modalReason.trim()} onClick={handleModalSubmit}>
                {actionModal === 'reject' ? 'Reject' : 'Suspend'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

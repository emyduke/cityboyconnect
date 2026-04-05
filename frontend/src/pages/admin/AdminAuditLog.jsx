import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';
import './AdminAuditLog.css';

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const addToast = useToastStore(s => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 30 };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      const res = await adminApi.getAuditLog(params);
      const data = res.data || res;
      setLogs(data.results || data || []);
      setTotal(data.count || 0);
    } catch { addToast({ type: 'error', message: 'Failed to load audit log' }); }
    setLoading(false);
  }, [page, actionFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (idx) => setExpanded(prev => prev === idx ? null : idx);

  return (
    <div className="admin-audit-log">
      <h1>Audit Log</h1>

      <div className="admin-audit-log__filters">
        <form onSubmit={e => { e.preventDefault(); setPage(1); load(); }} className="admin-audit-log__search">
          <input placeholder="Search by admin, action, or target..." value={search} onChange={e => setSearch(e.target.value)} />
          <Button type="submit" size="sm">Search</Button>
        </form>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="verify_member">Verify Member</option>
          <option value="reject_member">Reject Member</option>
          <option value="suspend_member">Suspend Member</option>
          <option value="unsuspend_member">Unsuspend Member</option>
          <option value="change_role">Change Role</option>
          <option value="delete_member">Delete Member</option>
          <option value="appoint_leader">Appoint Leader</option>
          <option value="remove_leader">Remove Leader</option>
          <option value="update_settings">Update Settings</option>
          <option value="cancel_event">Cancel Event</option>
          <option value="delete_event">Delete Event</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-audit-log__skeleton">
          {[...Array(8)].map((_, i) => <Skeleton key={i} variant="text" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="admin-audit-log__empty">
          <span>📜</span>
          <p>No audit entries found</p>
        </div>
      ) : (
        <div className="admin-audit-log__table-wrap">
          <table className="admin-audit-log__table">
            <thead>
              <tr>
                <th></th>
                <th>Timestamp</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <>
                  <tr key={log.id || i} className={`admin-audit-log__row ${expanded === i ? 'admin-audit-log__row--expanded' : ''}`} onClick={() => toggleExpand(i)}>
                    <td className="admin-audit-log__expand-btn">{expanded === i ? '▼' : '▶'}</td>
                    <td className="admin-audit-log__timestamp">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                    <td>{log.performed_by_name || log.user_name || '—'}</td>
                    <td><span className="admin-audit-log__action-badge">{log.action}</span></td>
                    <td>{log.target_type ? `${log.target_type} #${log.target_id}` : '—'}</td>
                    <td className="admin-audit-log__ip">{log.ip_address || '—'}</td>
                  </tr>
                  {expanded === i && (
                    <tr key={`detail-${i}`} className="admin-audit-log__detail-row">
                      <td colSpan={6}>
                        <div className="admin-audit-log__detail">
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <pre className="admin-audit-log__json">{JSON.stringify(log.details, null, 2)}</pre>
                          ) : (
                            <p className="admin-audit-log__no-details">No additional details</p>
                          )}
                          {log.notes && <p className="admin-audit-log__notes"><strong>Notes:</strong> {log.notes}</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 30 && (
        <div className="admin-audit-log__pagination">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span>Page {page} of {Math.ceil(total / 30)}</span>
          <Button variant="secondary" size="sm" disabled={logs.length < 30} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';
import { cn } from '../../lib/cn';

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
    <div>
      <h1 className="text-2xl font-extrabold mb-4">Audit Log</h1>

      <div className="flex gap-4 mb-4 flex-wrap">
        <form onSubmit={e => { e.preventDefault(); setPage(1); load(); }} className="flex gap-2 flex-1 min-w-[200px] max-w-[500px]">
          <input className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search by admin, action, or target..." value={search} onChange={e => setSearch(e.target.value)} />
          <Button type="submit" size="sm">Search</Button>
        </form>
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
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
        <div className="flex flex-col gap-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} variant="text" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center text-gray-400 py-12 flex flex-col items-center gap-2 text-3xl">
          <span>📜</span>
          <p className="text-sm">No audit entries found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase"></th>
                <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Timestamp</th>
                <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Admin</th>
                <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Action</th>
                <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Target</th>
                <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <>
                  <tr key={log.id || i} className={cn('cursor-pointer transition-colors hover:bg-gray-50', expanded === i && 'bg-off-white')} onClick={() => toggleExpand(i)}>
                    <td className="w-6 text-gray-400 text-[0.7rem] px-3 py-2 border-b border-gray-100">{expanded === i ? '▼' : '▶'}</td>
                    <td className="text-xs text-gray-500 whitespace-nowrap px-3 py-2 border-b border-gray-100">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100">{log.performed_by_name || log.user_name || '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100"><span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold font-mono text-gray-700">{log.action}</span></td>
                    <td className="px-3 py-2 border-b border-gray-100">{log.target_type ? `${log.target_type} #${log.target_id}` : '—'}</td>
                    <td className="font-mono text-xs text-gray-400 px-3 py-2 border-b border-gray-100">{log.ip_address || '—'}</td>
                  </tr>
                  {expanded === i && (
                    <tr key={`detail-${i}`}>
                      <td colSpan={6} className="p-0">
                        <div className="px-4 py-3 bg-gray-50 border-l-[3px] border-l-forest">
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <pre className="font-mono text-xs text-gray-700 bg-white p-3 rounded overflow-x-auto whitespace-pre-wrap border border-gray-200">{JSON.stringify(log.details, null, 2)}</pre>
                          ) : (
                            <p className="text-xs text-gray-400">No additional details</p>
                          )}
                          {log.notes && <p className="text-xs mt-2"><strong>Notes:</strong> {log.notes}</p>}
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
        <div className="flex justify-center items-center gap-4 p-4 text-sm">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span>Page {page} of {Math.ceil(total / 30)}</span>
          <Button variant="secondary" size="sm" disabled={logs.length < 30} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

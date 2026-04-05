import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';
import './AdminReports.css';

const STATUS_COLORS = { pending: 'warning', acknowledged: 'info', reviewed: 'success' };

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const addToast = useToastStore(s => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getReports(params);
      const data = res.data || res;
      setReports(data.results || data || []);
      setTotal(data.count || 0);
    } catch { addToast({ type: 'error', message: 'Failed to load reports' }); }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try {
      const res = await adminApi.getReportDetail(id);
      setSelected(res.data || res);
    } catch { setSelected(null); }
  };

  const handleAcknowledge = async (id) => {
    try {
      await adminApi.acknowledgeReport(id);
      addToast({ type: 'success', message: 'Report acknowledged' });
      load(); setSelected(null);
    } catch { addToast({ type: 'error', message: 'Failed to acknowledge' }); }
  };

  const handleReview = async (id) => {
    try {
      await adminApi.reviewReport(id);
      addToast({ type: 'success', message: 'Report marked as reviewed' });
      load(); setSelected(null);
    } catch { addToast({ type: 'error', message: 'Failed to review' }); }
  };

  return (
    <div className="admin-reports">
      <h1>Reports Management</h1>

      <div className="admin-reports__filters">
        <form onSubmit={e => { e.preventDefault(); setPage(1); load(); }} className="admin-reports__search">
          <input placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} />
          <Button type="submit" size="sm">Search</Button>
        </form>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      <div className="admin-reports__body">
        <div className="admin-reports__list">
          {loading ? <Skeleton variant="table" /> : reports.length === 0 ? (
            <div className="admin-reports__empty">
              <span>📋</span>
              <p>No reports found</p>
            </div>
          ) : (
            <table className="admin-reports__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Submitted By</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id || r.pk}>
                    <td><strong>{r.title}</strong></td>
                    <td>{r.submitted_by_name || r.author_name || '—'}</td>
                    <td>{r.report_type || r.category || '—'}</td>
                    <td><Badge variant={STATUS_COLORS[r.status] || 'default'}>{r.status || '—'}</Badge></td>
                    <td>{r.state_name || r.location || '—'}</td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <button className="admin-reports__action-btn" onClick={() => openDetail(r.id || r.pk)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {total > 20 && (
            <div className="admin-reports__pagination">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span>Page {page}</span>
              <Button variant="secondary" size="sm" disabled={reports.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>

        {selected && (
          <div className="admin-reports__detail-panel">
            <button className="admin-reports__panel-close" onClick={() => setSelected(null)}>✕</button>
            <h3>{selected.title}</h3>
            <div className="admin-reports__detail-meta">
              <div><strong>By:</strong> {selected.submitted_by_name || selected.author_name || '—'}</div>
              <div><strong>Type:</strong> {selected.report_type || selected.category || '—'}</div>
              <div><strong>Status:</strong> <Badge variant={STATUS_COLORS[selected.status] || 'default'}>{selected.status}</Badge></div>
              <div><strong>Location:</strong> {selected.state_name || '—'} {selected.lga_name ? `· ${selected.lga_name}` : ''}</div>
              <div><strong>Date:</strong> {selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</div>
            </div>
            <div className="admin-reports__detail-body">{selected.body || selected.content || selected.description || 'No content'}</div>
            {selected.images && selected.images.length > 0 && (
              <div className="admin-reports__detail-images">
                {selected.images.map((img, i) => <img key={i} src={img.url || img} alt={`Report image ${i + 1}`} />)}
              </div>
            )}
            <div className="admin-reports__detail-actions">
              {selected.status === 'pending' && <Button size="sm" onClick={() => handleAcknowledge(selected.id || selected.pk)}>Acknowledge</Button>}
              {(selected.status === 'pending' || selected.status === 'acknowledged') && (
                <Button size="sm" variant="secondary" onClick={() => handleReview(selected.id || selected.pk)}>Mark Reviewed</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';

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
    <div>
      <h1 className="text-2xl font-extrabold mb-4">Reports Management</h1>

      <div className="flex gap-4 mb-4 flex-wrap">
        <form onSubmit={e => { e.preventDefault(); setPage(1); load(); }} className="flex gap-2 flex-1 min-w-[200px] max-w-[400px]">
          <input className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} />
          <Button type="submit" size="sm">Search</Button>
        </form>
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      <div className="flex gap-4 max-[900px]:flex-col">
        <div className="flex-1 overflow-x-auto">
          {loading ? <Skeleton variant="table" /> : reports.length === 0 ? (
            <div className="text-center text-gray-400 py-12 flex flex-col items-center gap-2 text-3xl">
              <span>📋</span>
              <p className="text-sm">No reports found</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Title</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Submitted By</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Type</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Location</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Date</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id || r.pk}>
                    <td className="px-3 py-2 border-b border-gray-100"><strong>{r.title}</strong></td>
                    <td className="px-3 py-2 border-b border-gray-100">{r.submitted_by_name || r.author_name || '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100">{r.report_type || r.category || '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100"><Badge variant={STATUS_COLORS[r.status] || 'default'}>{r.status || '—'}</Badge></td>
                    <td className="px-3 py-2 border-b border-gray-100">{r.state_name || r.location || '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100">
                      <button className="bg-transparent border-none text-forest text-xs cursor-pointer font-medium hover:underline" onClick={() => openDetail(r.id || r.pk)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {total > 20 && (
            <div className="flex justify-center items-center gap-4 p-4 text-sm">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span>Page {page}</span>
              <Button variant="secondary" size="sm" disabled={reports.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>

        {selected && (
          <div className="w-[380px] min-w-[320px] max-[900px]:w-full max-[900px]:static bg-white border border-gray-200 rounded-xl p-4 sticky top-[72px] max-h-[calc(100vh-100px)] overflow-y-auto relative">
            <button className="absolute top-2 right-2 bg-transparent border-none text-xl cursor-pointer text-gray-400" onClick={() => setSelected(null)}>✕</button>
            <h3 className="text-lg font-bold mb-4">{selected.title}</h3>
            <div className="flex flex-col gap-1 text-sm mb-4">
              <div><strong>By:</strong> {selected.submitted_by_name || selected.author_name || '—'}</div>
              <div><strong>Type:</strong> {selected.report_type || selected.category || '—'}</div>
              <div><strong>Status:</strong> <Badge variant={STATUS_COLORS[selected.status] || 'default'}>{selected.status}</Badge></div>
              <div><strong>Location:</strong> {selected.state_name || '—'} {selected.lga_name ? `· ${selected.lga_name}` : ''}</div>
              <div><strong>Date:</strong> {selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</div>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed py-4 border-t border-gray-100">{selected.body || selected.content || selected.description || 'No content'}</div>
            {selected.images && selected.images.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4">
                {selected.images.map((img, i) => <img key={i} className="w-[100px] h-[100px] object-cover rounded-lg border border-gray-200" src={img.url || img} alt={`Report image ${i + 1}`} />)}
              </div>
            )}
            <div className="flex gap-2 mt-4">
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

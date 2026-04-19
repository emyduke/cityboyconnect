import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';

const STATUS_COLORS = { published: 'success', draft: 'warning', unpublished: 'default' };

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const addToast = useToastStore(s => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (search) params.search = search;
      const res = await adminApi.getAnnouncements(params);
      const data = res.data || res;
      setItems(data.results || data || []);
      setTotal(data.count || 0);
    } catch { addToast({ type: 'error', message: 'Failed to load announcements' }); }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try {
      const res = await adminApi.getAnnouncementDetail(id);
      setSelected(res.data || res);
    } catch { setSelected(null); }
  };

  const handlePublish = async (id) => {
    try {
      await adminApi.publishAnnouncement(id);
      addToast({ type: 'success', message: 'Announcement published' });
      load(); setSelected(null);
    } catch { addToast({ type: 'error', message: 'Failed to publish' }); }
  };

  const handleUnpublish = async (id) => {
    try {
      await adminApi.unpublishAnnouncement(id);
      addToast({ type: 'success', message: 'Announcement unpublished' });
      load(); setSelected(null);
    } catch { addToast({ type: 'error', message: 'Failed to unpublish' }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await adminApi.deleteAnnouncement(id);
      addToast({ type: 'success', message: 'Announcement deleted' });
      load(); setSelected(null);
    } catch { addToast({ type: 'error', message: 'Failed to delete' }); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 className="text-2xl font-extrabold">Announcements Management</h1>
        <Button size="sm" onClick={() => navigate('/announcements/create')}>📢 Create Announcement</Button>
      </div>

      <div className="flex gap-4 mb-4">
        <form onSubmit={e => { e.preventDefault(); setPage(1); load(); }} className="flex gap-2 flex-1 min-w-[200px] max-w-[400px]">
          <input className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)} />
          <Button type="submit" size="sm">Search</Button>
        </form>
      </div>

      <div className="flex gap-4 max-[900px]:flex-col">
        <div className="flex-1 overflow-x-auto">
          {loading ? <Skeleton variant="table" /> : items.length === 0 ? (
            <div className="text-center text-gray-400 py-12 flex flex-col items-center gap-2 text-3xl">
              <span>📢</span>
              <p className="text-sm">No announcements found</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Title</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Author</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Scope</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Created</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(a => (
                  <tr key={a.id || a.pk}>
                    <td className="px-3 py-2 border-b border-gray-100"><strong>{a.title}</strong></td>
                    <td className="px-3 py-2 border-b border-gray-100">{a.author_name || a.created_by_name || '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100"><Badge variant={STATUS_COLORS[a.status] || (a.is_published ? 'success' : 'warning')}>{a.status || (a.is_published ? 'published' : 'draft')}</Badge></td>
                    <td className="px-3 py-2 border-b border-gray-100">{a.scope || a.target_scope || '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100">
                      <button className="bg-transparent border-none text-forest text-xs cursor-pointer font-medium hover:underline" onClick={() => openDetail(a.id || a.pk)}>View</button>
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
              <Button variant="secondary" size="sm" disabled={items.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>

        {selected && (
          <div className="w-[380px] min-w-[320px] max-[900px]:w-full max-[900px]:static bg-white border border-gray-200 rounded-xl p-4 sticky top-[72px] max-h-[calc(100vh-100px)] overflow-y-auto relative">
            <button className="absolute top-2 right-2 bg-transparent border-none text-xl cursor-pointer text-gray-400" onClick={() => setSelected(null)}>✕</button>
            <h3 className="text-lg font-bold mb-4">{selected.title}</h3>
            <div className="flex flex-col gap-1 text-sm mb-4">
              <div><strong>Author:</strong> {selected.author_name || selected.created_by_name || '—'}</div>
              <div><strong>Status:</strong> <Badge variant={STATUS_COLORS[selected.status] || (selected.is_published ? 'success' : 'warning')}>{selected.status || (selected.is_published ? 'published' : 'draft')}</Badge></div>
              <div><strong>Created:</strong> {selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</div>
              <div><strong>Scope:</strong> {selected.scope || selected.target_scope || 'National'}</div>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed py-4 border-t border-gray-100">{selected.body || selected.content || 'No content'}</div>
            <div className="flex gap-2 mt-4">
              {(!selected.is_published && selected.status !== 'published') ? (
                <Button size="sm" onClick={() => handlePublish(selected.id || selected.pk)}>Publish</Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => handleUnpublish(selected.id || selected.pk)}>Unpublish</Button>
              )}
              <Button size="sm" variant="danger" onClick={() => handleDelete(selected.id || selected.pk)}>Delete</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

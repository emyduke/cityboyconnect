import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';
import './AdminAnnouncements.css';

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
    <div className="admin-announcements">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>Announcements Management</h1>
        <Button size="sm" onClick={() => navigate('/announcements/create')}>📢 Create Announcement</Button>
      </div>

      <div className="admin-announcements__filters">
        <form onSubmit={e => { e.preventDefault(); setPage(1); load(); }} className="admin-announcements__search">
          <input placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)} />
          <Button type="submit" size="sm">Search</Button>
        </form>
      </div>

      <div className="admin-announcements__body">
        <div className="admin-announcements__list">
          {loading ? <Skeleton variant="table" /> : items.length === 0 ? (
            <div className="admin-announcements__empty">
              <span>📢</span>
              <p>No announcements found</p>
            </div>
          ) : (
            <table className="admin-announcements__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Scope</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(a => (
                  <tr key={a.id || a.pk}>
                    <td><strong>{a.title}</strong></td>
                    <td>{a.author_name || a.created_by_name || '—'}</td>
                    <td><Badge variant={STATUS_COLORS[a.status] || (a.is_published ? 'success' : 'warning')}>{a.status || (a.is_published ? 'published' : 'draft')}</Badge></td>
                    <td>{a.scope || a.target_scope || '—'}</td>
                    <td>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <button className="admin-announcements__action-btn" onClick={() => openDetail(a.id || a.pk)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {total > 20 && (
            <div className="admin-announcements__pagination">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span>Page {page}</span>
              <Button variant="secondary" size="sm" disabled={items.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>

        {selected && (
          <div className="admin-announcements__detail-panel">
            <button className="admin-announcements__panel-close" onClick={() => setSelected(null)}>✕</button>
            <h3>{selected.title}</h3>
            <div className="admin-announcements__detail-meta">
              <div><strong>Author:</strong> {selected.author_name || selected.created_by_name || '—'}</div>
              <div><strong>Status:</strong> <Badge variant={STATUS_COLORS[selected.status] || (selected.is_published ? 'success' : 'warning')}>{selected.status || (selected.is_published ? 'published' : 'draft')}</Badge></div>
              <div><strong>Created:</strong> {selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</div>
              <div><strong>Scope:</strong> {selected.scope || selected.target_scope || 'National'}</div>
            </div>
            <div className="admin-announcements__detail-body">{selected.body || selected.content || 'No content'}</div>
            <div className="admin-announcements__detail-actions">
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

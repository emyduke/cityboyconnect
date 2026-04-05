import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
import Card from '../../components/Card';
import { useToastStore } from '../../store/toastStore';
import './AdminEvents.css';

const STATUS_COLORS = { upcoming: 'info', ongoing: 'success', completed: 'default', cancelled: 'danger' };

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const addToast = useToastStore(s => s.addToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getEvents(params);
      const data = res.data || res;
      setEvents(data.results || data || []);
      setTotal(data.count || 0);
    } catch { addToast({ type: 'error', message: 'Failed to load events' }); }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const [detailRes, attendRes] = await Promise.all([
        adminApi.getEventDetail(id),
        adminApi.getEventAttendance(id).catch(() => ({ data: [] })),
      ]);
      setSelected(detailRes.data || detailRes);
      setAttendance((attendRes.data || attendRes)?.results || attendRes.data || []);
    } catch { setSelected(null); }
    setDetailLoading(false);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this event?')) return;
    try {
      await adminApi.cancelEvent(id);
      addToast({ type: 'success', message: 'Event cancelled' });
      load();
      setSelected(null);
    } catch { addToast({ type: 'error', message: 'Failed to cancel event' }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this event?')) return;
    try {
      await adminApi.deleteEvent(id);
      addToast({ type: 'success', message: 'Event deleted' });
      load();
      setSelected(null);
    } catch { addToast({ type: 'error', message: 'Failed to delete event' }); }
  };

  return (
    <div className="admin-events">
      <h1>Events Management</h1>

      <div className="admin-events__filters">
        <form onSubmit={e => { e.preventDefault(); setPage(1); load(); }} className="admin-events__search">
          <input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
          <Button type="submit" size="sm">Search</Button>
        </form>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="admin-events__body">
        <div className="admin-events__list">
          {loading ? <Skeleton variant="table" /> : events.length === 0 ? (
            <div className="admin-events__empty">
              <span>📅</span>
              <p>No events found</p>
            </div>
          ) : (
            <table className="admin-events__table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Attendees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id || ev.pk}>
                    <td className="admin-events__title-cell">
                      <strong>{ev.title}</strong>
                      <span className="admin-events__organizer">{ev.created_by_name || ''}</span>
                    </td>
                    <td>{ev.date ? new Date(ev.date).toLocaleDateString() : ev.start_date ? new Date(ev.start_date).toLocaleDateString() : '—'}</td>
                    <td>{ev.location || ev.venue || '—'}</td>
                    <td><Badge variant={STATUS_COLORS[ev.status] || 'default'}>{ev.status || '—'}</Badge></td>
                    <td>{ev.attendance_count ?? ev.attendees_count ?? '—'}</td>
                    <td>
                      <button className="admin-events__action-btn" onClick={() => openDetail(ev.id || ev.pk)}>View</button>
                      {ev.status !== 'cancelled' && (
                        <button className="admin-events__action-btn admin-events__action-btn--danger" onClick={() => handleCancel(ev.id || ev.pk)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {total > 20 && (
            <div className="admin-events__pagination">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span>Page {page}</span>
              <Button variant="secondary" size="sm" disabled={events.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>

        {selected && (
          <div className="admin-events__detail-panel">
            <button className="admin-events__panel-close" onClick={() => setSelected(null)}>✕</button>
            {detailLoading ? <Skeleton variant="card" /> : (
              <>
                <h3>{selected.title}</h3>
                <div className="admin-events__detail-meta">
                  <div><strong>Date:</strong> {selected.date || selected.start_date || '—'}</div>
                  <div><strong>Location:</strong> {selected.location || selected.venue || '—'}</div>
                  <div><strong>Created by:</strong> {selected.created_by_name || '—'}</div>
                  <div><strong>Status:</strong> <Badge variant={STATUS_COLORS[selected.status] || 'default'}>{selected.status}</Badge></div>
                </div>
                {selected.description && <p className="admin-events__detail-desc">{selected.description}</p>}
                <h4>Attendance ({attendance.length})</h4>
                {attendance.length === 0 ? <p className="admin-events__no-data">No attendance recorded</p> : (
                  <div className="admin-events__attendance-list">
                    {attendance.map((a, i) => (
                      <div key={i} className="admin-events__attendance-item">
                        <span>{a.member_name || a.full_name || '—'}</span>
                        <span className="admin-events__attendance-time">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="admin-events__detail-actions">
                  {selected.status !== 'cancelled' && <Button size="sm" variant="secondary" onClick={() => handleCancel(selected.id || selected.pk)}>Cancel Event</Button>}
                  <Button size="sm" variant="danger" onClick={() => handleDelete(selected.id || selected.pk)}>Delete Event</Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

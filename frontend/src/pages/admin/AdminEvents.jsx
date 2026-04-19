import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
import Card from '../../components/Card';
import { useToastStore } from '../../store/toastStore';

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
    <div>
      <h1 className="text-2xl font-extrabold mb-4">Events Management</h1>

      <div className="flex gap-4 mb-4 flex-wrap">
        <form onSubmit={e => { e.preventDefault(); setPage(1); load(); }} className="flex gap-2 flex-1 min-w-[200px]">
          <input className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
          <Button type="submit" size="sm">Search</Button>
        </form>
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="flex gap-4 max-[900px]:flex-col">
        <div className="flex-1 overflow-x-auto">
          {loading ? <Skeleton variant="table" /> : events.length === 0 ? (
            <div className="text-center text-gray-400 py-12 flex flex-col items-center gap-2 text-3xl">
              <span>📅</span>
              <p className="text-sm">No events found</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Event</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Date</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Location</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Attendees</th>
                  <th className="text-left px-3 py-2 border-b-2 border-gray-200 font-semibold text-gray-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id || ev.pk}>
                    <td className="px-3 py-2 border-b border-gray-100 flex flex-col">
                      <strong className="text-sm">{ev.title}</strong>
                      <span className="text-[0.7rem] text-gray-400">{ev.created_by_name || ''}</span>
                    </td>
                    <td className="px-3 py-2 border-b border-gray-100">{ev.date ? new Date(ev.date).toLocaleDateString() : ev.start_date ? new Date(ev.start_date).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100">{ev.location || ev.venue || '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100"><Badge variant={STATUS_COLORS[ev.status] || 'default'}>{ev.status || '—'}</Badge></td>
                    <td className="px-3 py-2 border-b border-gray-100">{ev.attendance_count ?? ev.attendees_count ?? '—'}</td>
                    <td className="px-3 py-2 border-b border-gray-100">
                      <button className="bg-transparent border-none text-forest text-xs cursor-pointer font-medium mr-2 hover:underline" onClick={() => openDetail(ev.id || ev.pk)}>View</button>
                      {ev.status !== 'cancelled' && (
                        <button className="bg-transparent border-none text-danger text-xs cursor-pointer font-medium hover:underline" onClick={() => handleCancel(ev.id || ev.pk)}>Cancel</button>
                      )}
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
              <Button variant="secondary" size="sm" disabled={events.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>

        {selected && (
          <div className="w-[380px] min-w-[320px] max-[900px]:w-full max-[900px]:static bg-white border border-gray-200 rounded-xl p-4 sticky top-[72px] max-h-[calc(100vh-100px)] overflow-y-auto relative">
            <button className="absolute top-2 right-2 bg-transparent border-none text-xl cursor-pointer text-gray-400" onClick={() => setSelected(null)}>✕</button>
            {detailLoading ? <Skeleton variant="card" /> : (
              <>
                <h3 className="text-lg font-bold mb-4">{selected.title}</h3>
                <div className="flex flex-col gap-1 text-sm">
                  <div><strong>Date:</strong> {selected.date || selected.start_date || '—'}</div>
                  <div><strong>Location:</strong> {selected.location || selected.venue || '—'}</div>
                  <div><strong>Created by:</strong> {selected.created_by_name || '—'}</div>
                  <div><strong>Status:</strong> <Badge variant={STATUS_COLORS[selected.status] || 'default'}>{selected.status}</Badge></div>
                </div>
                {selected.description && <p className="text-sm text-gray-600 mt-4">{selected.description}</p>}
                <h4 className="text-sm font-bold mt-4 mb-2">Attendance ({attendance.length})</h4>
                {attendance.length === 0 ? <p className="text-xs text-gray-400">No attendance recorded</p> : (
                  <div className="max-h-[200px] overflow-y-auto">
                    {attendance.map((a, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-gray-100 text-xs">
                        <span>{a.member_name || a.full_name || '—'}</span>
                        <span className="text-gray-400 text-[0.7rem]">{a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
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

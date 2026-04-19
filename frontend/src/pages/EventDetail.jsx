import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, attendEvent, getEventAttendance } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { isAdminLevel } from '../lib/permissions';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import DataTable from '../components/DataTable';
import { useToastStore } from '../store/toastStore';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const user = useAuthStore(s => s.user);
  const [event, setEvent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, atRes] = await Promise.all([getEvent(id), getEventAttendance(id).catch(() => ({ data: { data: [] } }))]);
        setEvent(evRes.data.data || evRes.data);
        setAttendance(atRes.data.data || atRes.data.results || atRes.data || []);
      } catch { navigate('/events'); }
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const handleAttend = async () => {
    setAttending(true);
    try {
      await attendEvent(id);
      addToast({ type: 'success', message: 'You are now attending this event!' });
      const atRes = await getEventAttendance(id);
      setAttendance(atRes.data.data || atRes.data.results || atRes.data || []);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error?.message || 'Failed to RSVP' });
    }
    setAttending(false);
  };

  if (loading) return <div className="flex flex-col gap-6"><Skeleton variant="card" /></div>;
  if (!event) return null;

  const typeColors = { RALLY: 'danger', TRAINING: 'info', MEETING: 'default', TOWN_HALL: 'warning', OUTREACH: 'success' };

  return (
    <div className="flex flex-col gap-6">
      <button className="bg-transparent border-none text-forest text-sm cursor-pointer font-medium self-start hover:underline" onClick={() => navigate('/events')}>← Back to Events</button>
      <Card padding="lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant={typeColors[event.event_type] || 'default'}>{event.event_type?.replace('_', ' ')}</Badge>
            <h1 className="text-2xl font-extrabold mt-2">{event.title}</h1>
          </div>
          <Button loading={attending} onClick={handleAttend}>Check In</Button>
          {(user?.id === (event.created_by?.id || event.created_by) || isAdminLevel(user?.role)) && (
            <Button variant="secondary" onClick={() => navigate(`/events/${id}/edit`)}>Edit</Button>
          )}
        </div>
        <div className="flex flex-wrap gap-6 my-4 text-sm text-gray-500">
          <span>📍 {event.venue_name}</span>
          <span>📅 {new Date(event.start_datetime).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>🕐 {new Date(event.start_datetime).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="text-[0.95rem] text-gray-700 leading-[1.7]">{event.description}</p>
      </Card>

      <Card padding="md" className="mt-0">
        <h3 className="text-base font-bold mb-4">Attendance ({attendance.length})</h3>
        <DataTable
          columns={[
            { key: 'member_name', label: 'Name' },
            { key: 'checked_in_at', label: 'Checked In', render: (v) => v ? new Date(v).toLocaleTimeString('en-NG') : '—' },
            { key: 'check_in_method', label: 'Method' },
          ]}
          data={attendance}
          searchable
        />
      </Card>
    </div>
  );
}

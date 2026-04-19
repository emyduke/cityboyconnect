import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../api/client';
import EventCard from '../components/EventCard';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useAuthStore } from '../store/authStore';
import { canCreateEvents } from '../lib/permissions';
import { cn } from '../lib/cn';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const showCreate = canCreateEvents(user?.role);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getEvents({ status: filter === 'upcoming' ? 'UPCOMING' : 'COMPLETED' });
        setEvents(res.data.data || res.data.results || res.data || []);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Events</h1>
        {showCreate && <Button size="sm" onClick={() => navigate('/events/create')}>+ Create Event</Button>}
      </div>
      <div className="flex gap-2 mb-6">
        <button className={cn("py-2 px-4 border-[1.5px] border-gray-200 rounded-full bg-white text-[0.85rem] font-medium text-gray-500 cursor-pointer transition-all", filter === 'upcoming' && "border-forest bg-forest text-white")} onClick={() => setFilter('upcoming')}>Upcoming</button>
        <button className={cn("py-2 px-4 border-[1.5px] border-gray-200 rounded-full bg-white text-[0.85rem] font-medium text-gray-500 cursor-pointer transition-all", filter === 'past' && "border-forest bg-forest text-white")} onClick={() => setFilter('past')}>Past</button>
      </div>
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : events.length === 0 ? (
        <EmptyState title="No events found" description={`No ${filter} events at this time`} icon="📅" action={showCreate ? <Button size="sm" onClick={() => navigate('/events/create')}>Create Event</Button> : null} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {events.map(e => <EventCard key={e.id} event={e} onClick={() => navigate(`/events/${e.id}`)} />)}
        </div>
      )}
    </div>
  );
}

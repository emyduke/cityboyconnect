import './Events.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../api/client';
import EventCard from '../components/EventCard';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const navigate = useNavigate();

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
    <div className="events-page">
      <div className="events-page__header">
        <h1>Events</h1>
        <Button size="sm" onClick={() => navigate('/events/create')}>+ Create Event</Button>
      </div>
      <div className="events-page__filters">
        <button className={`events-tab ${filter === 'upcoming' ? 'events-tab--active' : ''}`} onClick={() => setFilter('upcoming')}>Upcoming</button>
        <button className={`events-tab ${filter === 'past' ? 'events-tab--active' : ''}`} onClick={() => setFilter('past')}>Past</button>
      </div>
      {loading ? (
        <div className="events-page__grid"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : events.length === 0 ? (
        <EmptyState title="No events found" description={`No ${filter} events at this time`} icon="📅" action={<Button size="sm" onClick={() => navigate('/events/create')}>Create Event</Button>} />
      ) : (
        <div className="events-page__grid">
          {events.map(e => <EventCard key={e.id} event={e} onClick={() => navigate(`/events/${e.id}`)} />)}
        </div>
      )}
    </div>
  );
}

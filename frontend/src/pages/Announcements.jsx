import './Announcements.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnnouncements } from '../api/client';
import AnnouncementCard from '../components/AnnouncementCard';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAnnouncements();
        setAnnouncements(res.data.data || res.data.results || res.data || []);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="announcements-page">
      <h1>Announcements</h1>
      {loading ? (
        <div className="announcements-grid"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : announcements.length === 0 ? (
        <EmptyState title="No announcements" description="No announcements for your area yet" icon="📢" />
      ) : (
        <div className="announcements-grid">
          {announcements.map(a => (
            <AnnouncementCard key={a.id} announcement={a} onClick={() => navigate(`/announcements/${a.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

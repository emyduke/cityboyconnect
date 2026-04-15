import './Announcements.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnnouncements } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { canCreateAnnouncements } from '../lib/permissions';
import AnnouncementCard from '../components/AnnouncementCard';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <h1>Announcements</h1>
        {canCreateAnnouncements(user?.role) && (
          <Button size="sm" onClick={() => navigate('/announcements/create')}>📢 Create Announcement</Button>
        )}
      </div>
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

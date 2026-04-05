import './AnnouncementDetail.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnnouncement, markAnnouncementRead } from '../api/client';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ann, setAnn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAnnouncement(id);
        setAnn(res.data.data || res.data);
        markAnnouncementRead(id).catch(() => {});
      } catch { navigate('/announcements'); }
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  if (loading) return <div><Skeleton variant="card" /></div>;
  if (!ann) return null;

  const priorityVariant = { NORMAL: 'default', IMPORTANT: 'warning', URGENT: 'danger' };

  return (
    <div className="ann-detail">
      <button className="ann-detail__back" onClick={() => navigate('/announcements')}>← Back</button>
      <Card padding="lg">
        <div className="ann-detail__header">
          <Badge variant={priorityVariant[ann.priority] || 'default'}>{ann.priority}</Badge>
          <span className="ann-detail__date">
            {ann.published_at ? new Date(ann.published_at).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </span>
        </div>
        <h1 className="ann-detail__title">{ann.title}</h1>
        <p className="ann-detail__scope">Scope: {ann.target_scope_display || ann.target_scope}</p>
        <div className="ann-detail__body">{ann.body}</div>
        {ann.author_name && <p className="ann-detail__author">— {ann.author_name}</p>}
      </Card>
    </div>
  );
}

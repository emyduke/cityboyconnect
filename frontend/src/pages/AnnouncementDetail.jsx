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
    <div className="flex flex-col gap-6">
      <button className="bg-transparent border-none text-forest text-sm cursor-pointer font-medium self-start hover:underline" onClick={() => navigate('/announcements')}>← Back</button>
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <Badge variant={priorityVariant[ann.priority] || 'default'}>{ann.priority}</Badge>
          <span className="text-[0.85rem] text-gray-400">
            {ann.published_at ? new Date(ann.published_at).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold mb-1">{ann.title}</h1>
        <p className="text-[0.8rem] text-gray-400 uppercase tracking-wider mb-6">Scope: {ann.target_scope_display || ann.target_scope}</p>
        <div className="text-[0.95rem] text-gray-700 leading-[1.8] whitespace-pre-wrap">{ann.body}</div>
        {ann.author_name && <p className="text-sm text-forest font-semibold mt-6">— {ann.author_name}</p>}
      </Card>
    </div>
  );
}

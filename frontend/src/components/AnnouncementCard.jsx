import './AnnouncementCard.css';
import Badge from './Badge';

const priorityVariant = { NORMAL: 'default', IMPORTANT: 'warning', URGENT: 'danger' };

export default function AnnouncementCard({ announcement, onClick }) {
  const date = new Date(announcement.published_at || announcement.created_at);

  return (
    <div className={`announcement-card ${announcement.is_read ? '' : 'announcement-card--unread'}`} onClick={onClick}>
      <div className="announcement-card__header">
        <Badge variant={priorityVariant[announcement.priority] || 'default'}>{announcement.priority}</Badge>
        <span className="announcement-card__date">{date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>
      </div>
      <h4 className="announcement-card__title">{announcement.title}</h4>
      <p className="announcement-card__body">{announcement.body?.slice(0, 120)}{announcement.body?.length > 120 ? '...' : ''}</p>
      <span className="announcement-card__scope">{announcement.target_scope_display || announcement.target_scope}</span>
    </div>
  );
}

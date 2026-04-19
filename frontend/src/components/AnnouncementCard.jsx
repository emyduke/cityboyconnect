import { cn } from '../lib/cn';
import Badge from './Badge';

const priorityVariant = { NORMAL: 'default', IMPORTANT: 'warning', URGENT: 'danger' };

export default function AnnouncementCard({ announcement, onClick }) {
  const date = new Date(announcement.published_at || announcement.created_at);

  return (
    <div className={cn(
      'p-4 bg-white border border-gray-200 rounded-[10px] cursor-pointer transition-shadow flex flex-col gap-1 hover:shadow-elevated',
      !announcement.is_read && 'border-l-[3px] border-l-forest',
    )} onClick={onClick}>
      <div className="flex items-center justify-between">
        <Badge variant={priorityVariant[announcement.priority] || 'default'}>{announcement.priority}</Badge>
        <span className="text-xs text-gray-400">{date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>
      </div>
      <h4 className="text-[0.95rem] font-semibold text-gray-900">{announcement.title}</h4>
      <p className="text-[0.85rem] text-gray-500 leading-relaxed">{announcement.body?.slice(0, 120)}{announcement.body?.length > 120 ? '...' : ''}</p>
      <span className="text-[0.7rem] text-gray-400 uppercase tracking-wider">{announcement.target_scope_display || announcement.target_scope}</span>
    </div>
  );
}

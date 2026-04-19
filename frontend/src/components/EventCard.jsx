import Badge from './Badge';

const typeColors = { RALLY: 'danger', TRAINING: 'info', MEETING: 'default', TOWN_HALL: 'warning', OUTREACH: 'success', OTHER: 'default' };

export default function EventCard({ event, onClick }) {
  const date = new Date(event.start_datetime);
  const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
  const day = date.getDate();

  return (
    <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-[10px] cursor-pointer transition-shadow hover:shadow-elevated" onClick={onClick}>
      <div className="flex flex-col items-center justify-center w-14 h-14 bg-forest text-white rounded-[10px] shrink-0">
        <span className="text-[0.6rem] font-semibold tracking-wider opacity-80">{month}</span>
        <span className="text-xl font-bold font-display leading-none">{day}</span>
      </div>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <h4 className="text-[0.95rem] font-semibold text-gray-900 truncate">{event.title}</h4>
        <span className="text-[0.8rem] text-gray-500">{event.venue_name}</span>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={typeColors[event.event_type] || 'default'}>{event.event_type?.replace('_', ' ')}</Badge>
          {event.attendance_count != null && <span className="text-xs text-gray-400">{event.attendance_count} attending</span>}
        </div>
      </div>
    </div>
  );
}

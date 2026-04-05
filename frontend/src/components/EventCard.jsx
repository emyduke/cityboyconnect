import './EventCard.css';
import Badge from './Badge';

const typeColors = { RALLY: 'danger', TRAINING: 'info', MEETING: 'default', TOWN_HALL: 'warning', OUTREACH: 'success', OTHER: 'default' };

export default function EventCard({ event, onClick }) {
  const date = new Date(event.start_datetime);
  const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
  const day = date.getDate();

  return (
    <div className="event-card" onClick={onClick}>
      <div className="event-card__date">
        <span className="event-card__month">{month}</span>
        <span className="event-card__day">{day}</span>
      </div>
      <div className="event-card__info">
        <h4 className="event-card__title">{event.title}</h4>
        <span className="event-card__venue">{event.venue_name}</span>
        <div className="event-card__footer">
          <Badge variant={typeColors[event.event_type] || 'default'}>{event.event_type?.replace('_', ' ')}</Badge>
          {event.attendance_count != null && <span className="event-card__count">{event.attendance_count} attending</span>}
        </div>
      </div>
    </div>
  );
}

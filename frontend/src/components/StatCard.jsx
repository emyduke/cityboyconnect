import './StatCard.css';

export default function StatCard({ label, value, icon, trend }) {
  return (
    <div className="stat-card">
      {icon && <div className="stat-card__icon">{icon}</div>}
      <div className="stat-card__content">
        <span className="stat-card__value">{value?.toLocaleString?.() ?? value}</span>
        <span className="stat-card__label">{label}</span>
        {trend && (
          <span className={`stat-card__trend stat-card__trend--${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

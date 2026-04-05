import './ProgressBar.css';

export default function ProgressBar({ value = 0, max = 100, label }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      {label && <span className="progress-bar__label">{label}</span>}
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-bar__value">{Math.round(pct)}%</span>
    </div>
  );
}

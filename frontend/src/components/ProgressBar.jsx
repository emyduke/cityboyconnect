export default function ProgressBar({ value = 0, max = 100, label }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      {label && <span className="text-[0.8rem] text-gray-500 whitespace-nowrap">{label}</span>}
      <div className="flex-1 h-2 bg-gray-200 rounded-sm overflow-hidden">
        <div className="h-full bg-forest rounded-sm transition-all duration-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[0.8rem] font-semibold text-forest min-w-9 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

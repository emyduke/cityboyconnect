import { cn } from '../lib/cn';

export default function StatCard({ label, value, icon, trend }) {
  return (
    <div className="flex items-start gap-4 p-6 bg-white rounded-[10px] shadow-card border border-gray-200 transition-shadow hover:shadow-elevated">
      {icon && <div className="w-12 h-12 flex items-center justify-center bg-forest text-gold rounded-[10px] text-xl shrink-0">{icon}</div>}
      <div className="flex flex-col gap-0.5">
        <span className="font-display text-[1.75rem] font-bold text-gray-900 leading-none">{value?.toLocaleString?.() ?? value}</span>
        <span className="text-sm text-gray-500">{label}</span>
        {trend && (
          <span className={cn('text-xs font-semibold mt-0.5', trend > 0 ? 'text-success' : 'text-danger')}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

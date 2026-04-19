import { cn } from '../lib/cn';

export default function StepIndicator({ steps = [], current = 0 }) {
  return (
    <div className="flex items-center justify-between gap-1" role="navigation" aria-label="Progress">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                i < current && 'bg-forest border-forest text-white',
                i === current && 'border-gold bg-gold/10 text-forest font-bold',
                i > current && 'border-gray-300 bg-white text-gray-400',
              )}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span className={cn('text-xs text-center', i <= current ? 'text-forest font-semibold' : 'text-gray-400')}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('flex-1 h-0.5 mx-2 mt-[-1rem]', i < current ? 'bg-forest' : 'bg-gray-200')} />
          )}
        </div>
      ))}
    </div>
  );
}

import { cn } from '../lib/cn';

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export default function Avatar({ src, name = '', size = 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={cn(
      'inline-flex items-center justify-center rounded-full bg-forest text-gold-light font-display font-bold overflow-hidden shrink-0',
      sizeClasses[size] || sizeClasses.md,
    )}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="select-none">{initials || '?'}</span>
      )}
    </div>
  );
}

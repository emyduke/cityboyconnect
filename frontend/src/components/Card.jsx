import { cn } from '../lib/cn';

const paddingClasses = { sm: 'p-2', md: 'p-6', lg: 'p-12' };

export default function Card({ children, padding = 'md', className = '', onClick }) {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-[10px] shadow-card transition-shadow',
        paddingClasses[padding] || paddingClasses.md,
        onClick && 'cursor-pointer hover:shadow-elevated',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

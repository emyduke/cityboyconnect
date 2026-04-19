import { cn } from '../lib/cn';

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export default function Badge({ children, variant = 'default' }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full leading-normal',
      variantClasses[variant] || variantClasses.default,
    )}>
      {children}
    </span>
  );
}

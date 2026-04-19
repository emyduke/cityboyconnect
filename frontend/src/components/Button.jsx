import { cn } from '../lib/cn';

const variantClasses = {
  primary: 'bg-forest text-white border-forest hover:bg-forest-light',
  secondary: 'bg-gold text-forest-dark border-gold hover:bg-gold-light',
  ghost: 'bg-transparent text-forest border-forest hover:bg-forest hover:text-white',
  danger: 'bg-danger text-white border-danger hover:bg-red-700',
};
const sizeClasses = {
  sm: 'px-3.5 py-1.5 text-[0.8125rem]',
  md: 'px-5 py-2.5 text-[0.9375rem]',
  lg: 'px-8 py-3.5 text-[1.0625rem]',
};

export default function Button({
  children, variant = 'primary', size = 'md', loading = false,
  disabled = false, type = 'button', onClick, className = '', ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 border-2 rounded-[10px] font-semibold transition-all relative whitespace-nowrap',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        loading && 'pointer-events-none',
        className,
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="absolute w-[18px] h-[18px] border-2 border-white/30 border-t-current rounded-full animate-spin" aria-hidden="true" />}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
}

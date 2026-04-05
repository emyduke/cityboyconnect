import './Button.css';

export default function Button({
  children, variant = 'primary', size = 'md', loading = false,
  disabled = false, type = 'button', onClick, className = '', ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className={loading ? 'btn__text--hidden' : ''}>{children}</span>
    </button>
  );
}

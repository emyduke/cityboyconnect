import { cn } from '../lib/cn';

export default function Input({
  label, placeholder, error, hint, type = 'text',
  value, onChange, id, name, disabled = false, ...props
}) {
  const inputId = id || name || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">{label}</label>}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-[10px] text-[0.9375rem] text-gray-900 bg-white transition-colors outline-none',
          'placeholder:text-gray-400',
          'focus:border-forest focus:shadow-[0_0_0_3px_rgba(26,71,42,0.1)]',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error && 'border-danger focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]',
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && <span id={`${inputId}-error`} className="text-[0.8125rem] text-danger" role="alert">{error}</span>}
      {hint && !error && <span id={`${inputId}-hint`} className="text-[0.8125rem] text-gray-500">{hint}</span>}
    </div>
  );
}

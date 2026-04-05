import './Input.css';

export default function Input({
  label, placeholder, error, hint, type = 'text',
  value, onChange, id, name, disabled = false, ...props
}) {
  const inputId = id || name || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className={`input-group ${error ? 'input-group--error' : ''}`}>
      {label && <label htmlFor={inputId} className="input-group__label">{label}</label>}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="input-group__input"
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && <span id={`${inputId}-error`} className="input-group__error" role="alert">{error}</span>}
      {hint && !error && <span id={`${inputId}-hint`} className="input-group__hint">{hint}</span>}
    </div>
  );
}

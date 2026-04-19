import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/cn';

export default function OTPInput({ digits = 6, onComplete, error }) {
  const [values, setValues] = useState(Array(digits).fill(''));
  const refs = useRef([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (!/^\d?$/.test(val)) return;

    const newValues = [...values];
    newValues[index] = val;
    setValues(newValues);

    if (val && index < digits - 1) {
      refs.current[index + 1]?.focus();
    }

    if (val && index === digits - 1) {
      const code = newValues.join('');
      if (code.length === digits) onComplete?.(code);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digits);
    const newValues = [...values];
    pasted.split('').forEach((char, i) => { newValues[i] = char; });
    setValues(newValues);
    if (pasted.length === digits) {
      onComplete?.(pasted);
    } else {
      refs.current[pasted.length]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {values.map((val, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={val}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={cn(
              'w-12 h-14 text-center text-2xl font-bold font-mono border-2 border-gray-300 rounded-[10px] outline-none transition-colors',
              'focus:border-forest focus:shadow-[0_0_0_3px_rgba(26,71,42,0.1)]',
              error && 'border-danger animate-shake',
              'max-[400px]:w-10 max-[400px]:h-12 max-[400px]:text-xl',
            )}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
      {error && <span className="text-[0.8125rem] text-danger" role="alert">{error}</span>}
    </div>
  );
}

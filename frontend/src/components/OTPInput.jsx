import { useState, useRef, useEffect } from 'react';
import './OTPInput.css';

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
    <div className={`otp-input ${error ? 'otp-input--error' : ''}`}>
      <div className="otp-input__boxes">
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
            className="otp-input__box"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
      {error && <span className="otp-input__error" role="alert">{error}</span>}
    </div>
  );
}

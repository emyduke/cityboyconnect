import { useState, forwardRef } from 'react';
import { cn } from '../lib/cn';

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('234')) return '+' + digits.slice(0, 13);
  if (digits.startsWith('0')) return digits.slice(0, 11);
  return digits.slice(0, 11);
};

const getCarrier = (phone) => {
  const clean = phone.replace(/\D/g, '');
  const prefix = clean.startsWith('234') ? clean.slice(3, 7) : clean.slice(0, 4);
  if (/^(0803|0806|0813|0816|0810|0814|0903|0906|0913|0916)/.test('0' + prefix.slice(-3))) return 'MTN';
  if (/^(0802|0808|0812|0701|0708|0902|0907|0901|0912)/.test('0' + prefix.slice(-3))) return 'Airtel';
  if (/^(0805|0807|0811|0815|0905|0915)/.test('0' + prefix.slice(-3))) return 'Glo';
  if (/^(0809|0817|0818|0908|0909)/.test('0' + prefix.slice(-3))) return '9mobile';
  const p = clean.startsWith('234') ? '0' + clean.slice(3, 7) : clean.slice(0, 4);
  if (/^070[1368]|^080[2368]|^081[2]|^090[127]|^091[2]/.test(p)) return 'Airtel';
  if (/^080[356]|^081[01345]|^090[36]|^091[36]/.test(p)) return 'MTN';
  if (/^080[57]|^081[15]|^090[5]|^091[5]/.test(p)) return 'Glo';
  if (/^080[9]|^081[78]|^090[89]/.test(p)) return '9mobile';
  return null;
};

const PhoneInput = forwardRef(function PhoneInput({ value = '', onChange, error, label, ...props }, ref) {
  const [focused, setFocused] = useState(false);
  const carrier = getCarrier(value);

  const handleChange = (e) => {
    const formatted = formatPhone(e.target.value);
    onChange?.(formatted);
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className={cn(
        'flex items-center gap-2 border-[1.5px] border-gray-300 rounded-[10px] px-4 h-12 bg-white transition-colors',
        focused && 'border-forest shadow-[0_0_0_3px_rgba(26,71,42,0.1)]',
        error && 'border-danger',
      )}>
        <span className="text-xl shrink-0">🇳🇬</span>
        <input
          ref={ref}
          type="tel"
          className="flex-1 border-none outline-none text-base font-body bg-transparent tracking-wide"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="08012345678"
          inputMode="numeric"
          aria-label={label || 'Phone number'}
          aria-invalid={!!error}
          {...props}
        />
        {carrier && <span className="text-[0.7rem] font-semibold text-forest bg-gray-100 px-2 py-0.5 rounded-full shrink-0">{carrier}</span>}
      </div>
      {error && <span className="text-[0.8rem] text-danger">{error}</span>}
    </div>
  );
});

export default PhoneInput;

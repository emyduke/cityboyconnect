import './Toast.css';
import { useToastStore } from '../store/toastStore';

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type || 'info'}`} role="alert">
          <span className="toast__icon">{ICONS[t.type] || ICONS.info}</span>
          <span className="toast__message">{t.message}</span>
          <button className="toast__close" onClick={() => removeToast(t.id)} aria-label="Close">×</button>
        </div>
      ))}
    </div>
  );
}

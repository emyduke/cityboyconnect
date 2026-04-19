import { cn } from '../lib/cn';
import { useToastStore } from '../store/toastStore';

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const typeClasses = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-info',
  warning: 'bg-warning',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-6 right-6 z-[10000] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-[10px] text-white text-sm font-medium shadow-heavy animate-fade-in min-w-[280px] max-w-[420px]',
          typeClasses[t.type] || typeClasses.info,
        )} role="alert">
          <span className="text-base shrink-0">{ICONS[t.type] || ICONS.info}</span>
          <span className="flex-1">{t.message}</span>
          <button className="bg-transparent border-none text-inherit text-xl cursor-pointer opacity-70 p-0 leading-none hover:opacity-100" onClick={() => removeToast(t.id)} aria-label="Close">×</button>
        </div>
      ))}
    </div>
  );
}

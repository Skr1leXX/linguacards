import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// ─── Типы ─────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Иконки и стили ───────────────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, { icon: React.ElementType; classes: string; bar: string }> = {
  success: {
    icon: CheckCircle,
    classes: 'bg-white border-green-400 text-gray-800',
    bar: 'bg-green-400',
  },
  error: {
    icon: XCircle,
    classes: 'bg-white border-red-400 text-gray-800',
    bar: 'bg-red-400',
  },
  warning: {
    icon: AlertCircle,
    classes: 'bg-white border-yellow-400 text-gray-800',
    bar: 'bg-yellow-400',
  },
  info: {
    icon: Info,
    classes: 'bg-white border-blue-400 text-gray-800',
    bar: 'bg-blue-400',
  },
};

// ─── Один тост ────────────────────────────────────────────────────────────────
const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) => {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;
  const duration = toast.duration ?? 3500;

  return (
    <div
      className={`relative flex items-start gap-3 w-full max-w-sm px-4 py-3 rounded-xl
        border-l-4 shadow-lg overflow-hidden
        animate-[slideIn_0.25s_ease-out]
        ${config.classes}`}
      style={{ animation: 'slideIn 0.25s ease-out' }}
    >
      <Icon className="h-5 w-5 mt-0.5 shrink-0 text-current opacity-80" />
      <p className="text-sm font-medium flex-1 pr-2">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      {/* Прогресс-бар */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${config.bar}`}
        style={{
          animation: `shrink ${duration}ms linear forwards`,
        }}
      />

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string, duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const value: ToastContextValue = {
    toasts,
    success: (msg, dur) => add('success', msg, dur),
    error:   (msg, dur) => add('error',   msg, dur),
    warning: (msg, dur) => add('warning', msg, dur),
    info:    (msg, dur) => add('info',    msg, dur),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Контейнер тостов — правый нижний угол */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ─── Хук ──────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
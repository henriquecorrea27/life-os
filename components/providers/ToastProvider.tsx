'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, TriangleAlert, Undo2, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { nextId } from '@/lib/utils';

type ToastTone = 'default' | 'success' | 'error';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  description?: string;
  tone: ToastTone;
  action?: ToastAction;
  duration: number;
}

interface ToastInput {
  message: string;
  description?: string;
  tone?: ToastTone;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<ToastTone, typeof Info> = {
  default: Info,
  success: Check,
  error: TriangleAlert,
};

const TONE_COLOR: Record<ToastTone, string> = {
  default: 'var(--text-secondary)',
  success: '#34D399',
  error: '#F87171',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId('toast');
      const duration = input.duration ?? (input.action ? 6000 : 3200);
      setToasts((current) => [
        ...current.slice(-3),
        {
          id,
          message: input.message,
          description: input.description,
          tone: input.tone ?? 'default',
          action: input.action,
          duration,
        },
      ]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:items-end md:p-6">
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const Icon = TONE_ICON[item.tone];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-float"
              >
                <Icon size={16} style={{ color: TONE_COLOR[item.tone] }} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-meta font-medium text-content-primary">
                    {item.message}
                  </p>
                  {item.description ? (
                    <p className="truncate text-micro text-content-secondary">{item.description}</p>
                  ) : null}
                </div>
                {item.action ? (
                  <button
                    type="button"
                    onClick={() => {
                      item.action?.onClick();
                      dismiss(item.id);
                    }}
                    className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-meta font-medium text-accent transition-colors hover:bg-accent-soft"
                  >
                    <Undo2 size={13} />
                    {item.action.label}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Fechar aviso"
                  className="shrink-0 rounded-lg p-1 text-content-tertiary transition-colors hover:bg-surface-secondary hover:text-content-primary"
                >
                  <X size={13} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast precisa estar dentro de ToastProvider');
  return context;
}

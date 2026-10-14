import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { cx } from '../../utils/cx';
import { Button } from '../Button/Button';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './Toast.module.css';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastInput {
  tone: ToastTone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;

  durationMs?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

export interface ToastApi {
  push: (toast: ToastInput) => number;
  dismiss: (id: number) => void;

  announce: (message: string) => void;
}

const DEFAULT_DURATION_MS = 6000;
const ToastContext = createContext<ToastApi | null>(null);

export const useToasts = (): ToastApi => {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToasts must be used within ToastProvider');
  return api;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ReadonlyArray<ToastItem>>([]);
  const [announcement, setAnnouncement] = useState('');
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);
  const push = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setToasts((all) => [...all.slice(-3), { ...toast, id }]);
    const duration = toast.durationMs ?? (toast.tone === 'danger' ? 0 : DEFAULT_DURATION_MS);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((all) => all.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);
  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);
  const api = useMemo(() => ({ push, dismiss, announce }), [push, dismiss, announce]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" role="status">
        <VisuallyHidden>{announcement}</VisuallyHidden>
      </div>
      <div className={styles.viewport} role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastView = ({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) => {
  return (
    <div
      className={cx(styles.toast, styles[toast.tone])}
      role={toast.tone === 'danger' ? 'alert' : 'status'}
    >
      <span className={styles.title}>{toast.title}</span>
      {toast.description && <span className={styles.description}>{toast.description}</span>}
      <div className={styles.actions}>
        {toast.actionLabel && (
          <Button
            size="sm"
            onClick={() => {
              toast.onAction?.();
              onDismiss(toast.id);
            }}
          >
            {toast.actionLabel}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            onDismiss(toast.id);
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
};

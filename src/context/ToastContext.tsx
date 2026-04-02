import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

// ── Toast Container UI ────────────────────────────────────────────────────────

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colorMap: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534', icon: '#22c55e' },
  error:   { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: '#f59e0b' },
  info:    { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: '#3b82f6' },
};

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 300,
        maxWidth: 420,
      }}
    >
      {toasts.map((toast) => {
        const c = colorMap[toast.type];
        return (
          <div
            key={toast.id}
            style={{
              background: c.bg,
              border: `1.5px solid ${c.border}`,
              color: c.text,
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              animation: 'toast-in 0.25s ease',
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: c.icon,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {iconMap[toast.type]}
            </span>
            <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: c.text,
                opacity: 0.5,
                fontSize: 16,
                padding: 0,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`@keyframes toast-in { from { opacity:0; transform:translateY(12px);} to {opacity:1; transform:translateY(0);}}`}</style>
    </div>
  );
}

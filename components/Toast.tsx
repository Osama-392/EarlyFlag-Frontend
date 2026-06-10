'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback: no-op if used outside provider (safe for SSR)
    return { showToast: () => {} };
  }
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Start exit animation after 3s, then remove after animation completes
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container — fixed bottom-right */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto"
              style={{
                animation: toast.exiting
                  ? 'toast-slide-out 0.3s ease-in forwards'
                  : 'toast-slide-in 0.3s ease-out forwards',
              }}
            >
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-sm min-w-[280px]"
                style={{
                  background:
                    toast.type === 'success'
                      ? 'rgba(5, 46, 22, 0.92)'
                      : toast.type === 'warning'
                      ? 'rgba(66, 32, 6, 0.92)'
                      : 'rgba(69, 10, 10, 0.92)',
                  borderColor:
                    toast.type === 'success'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : toast.type === 'warning'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)',
                }}
              >
                {toast.type === 'success' ? (
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : toast.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <span className="text-white text-sm font-medium">{toast.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes toast-slide-out {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100px);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

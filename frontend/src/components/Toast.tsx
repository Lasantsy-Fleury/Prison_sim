import { createContext, useContext, useState, ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  error?: boolean;
}

interface ToastContextValue {
  notify: (message: string, error?: boolean) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = (message: string, error?: boolean) => {
    const id = ++counter;
    setToasts((t) => [...t, { id, message, error }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div>
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.error ? 'error' : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider');
  return ctx;
}

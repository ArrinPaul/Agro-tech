import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ addToast: (message: string, type: ToastType) => void }>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons: Record<ToastType, typeof Info> = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };

const toastStyles: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: {
    bg: "rgba(5, 150, 105, 0.08)",
    border: "rgba(5, 150, 105, 0.25)",
    text: "var(--text-primary)",
    icon: "#059669",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.25)",
    text: "var(--text-primary)",
    icon: "#ef4444",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.25)",
    text: "var(--text-primary)",
    icon: "#f59e0b",
  },
  info: {
    bg: "rgba(99, 102, 241, 0.08)",
    border: "rgba(99, 102, 241, 0.25)",
    text: "var(--text-primary)",
    icon: "#6366f1",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const toastId = Date.now();
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          const s = toastStyles[t.type];
          return (
            <div
              key={t.id}
              className="animate-slide-in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-lg)",
                border: `1px solid ${s.border}`,
                background: s.bg,
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                boxShadow: "var(--shadow-lg)",
                color: s.text,
                fontSize: "0.875rem",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                minWidth: "280px",
                maxWidth: "420px",
              }}
            >
              <Icon size={18} style={{ color: s.icon, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                style={{
                  color: "var(--text-muted)",
                  padding: "0.125rem",
                  borderRadius: "var(--radius-sm)",
                  transition: "color var(--duration-fast) var(--ease-out)",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

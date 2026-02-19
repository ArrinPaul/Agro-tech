import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0"
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      />
      {/* Dialog panel */}
      <div
        className="relative w-full max-w-sm mx-4 animate-scale-in"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "1.75rem",
        }}
      >
        {/* Top danger accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #ef4444, #f97316, transparent)" }} />
        
        {/* Warning icon with pulse ring */}
        <div className="relative" style={{ width: "3.5rem", height: "3.5rem", marginBottom: "1.25rem" }}>
          <div className="absolute inset-0 rounded-2xl bg-rose-500/10 animate-pulse" />
          <div
            className="relative flex items-center justify-center w-full h-full"
            style={{
              borderRadius: "0.875rem",
              background: "rgba(239, 68, 68, 0.1)",
            }}
          >
            <AlertTriangle size={22} style={{ color: "#ef4444" }} />
          </div>
        </div>

        <h3
          id="confirm-title"
          className="font-display"
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </h3>
        <p
          id="confirm-message"
          style={{
            fontSize: "0.875rem",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            marginBottom: "1.75rem",
          }}
        >
          {message}
        </p>

        <div className="flex justify-end" style={{ gap: "0.75rem" }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

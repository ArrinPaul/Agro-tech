import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0"
        style={{
          background: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />
      {/* Dialog panel */}
      <div
        className="relative w-full max-w-sm mx-4 animate-scale-in"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
          padding: "1.75rem",
        }}
      >
        {/* Warning icon */}
        <div
          className="flex items-center justify-center"
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "var(--radius-lg)",
            background: "rgba(239, 68, 68, 0.08)",
            marginBottom: "1rem",
          }}
        >
          <AlertTriangle size={22} style={{ color: "#ef4444" }} />
        </div>

        <h3
          className="font-display"
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            marginBottom: "1.5rem",
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

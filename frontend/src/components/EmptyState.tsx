import { type ReactNode } from "react";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="card animate-fade-in" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
            <div
                className="animate-float"
                style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "1.25rem",
                    color: "var(--text-muted)",
                }}
            >
                {icon}
            </div>
            <h3
                className="font-display"
                style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    marginBottom: "0.375rem",
                }}
            >
                {title}
            </h3>
            {description && (
                <p
                    style={{
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        color: "var(--text-muted)",
                        maxWidth: "24rem",
                        margin: "0 auto 1.5rem",
                    }}
                >
                    {description}
                </p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
}

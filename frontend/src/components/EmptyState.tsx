import { type ReactNode } from "react";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="card animate-fade-in relative overflow-hidden" style={{ padding: "5rem 2rem", textAlign: "center" }}>
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(5, 150, 105, 0.06) 0%, transparent 60%)" }} />
            
            <div className="relative z-10">
                <div
                    className="animate-float mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(16, 185, 129, 0.04))",
                        border: "1px solid rgba(5, 150, 105, 0.08)",
                        color: "var(--brand-600)",
                    }}
                >
                    {icon}
                </div>
                <h3
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
                {description && (
                    <p
                        style={{
                            fontSize: "0.875rem",
                            lineHeight: 1.7,
                            color: "var(--text-muted)",
                            maxWidth: "22rem",
                            margin: "0 auto 1.75rem",
                        }}
                    >
                        {description}
                    </p>
                )}
                {action && <div>{action}</div>}
            </div>
        </div>
    );
}

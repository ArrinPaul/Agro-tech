interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="card relative overflow-hidden" style={{ padding: "1.25rem" }}>
            <div className="flex items-center" style={{ gap: "1rem" }}>
                <Skeleton className="w-12 h-12" style={{ borderRadius: "0.875rem" }} />
                <div className="flex-1" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <Skeleton className="h-5 w-24" style={{ borderRadius: "0.5rem" }} />
                    <Skeleton className="h-3 w-36" style={{ borderRadius: "0.375rem" }} />
                </div>
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="card" style={{ overflow: "hidden" }}>
            {/* Header */}
            <div
                className="flex"
                style={{
                    padding: "0.75rem 1.25rem",
                    gap: "1.5rem",
                    background: "var(--surface-hover)",
                    borderBottom: "1px solid var(--border)",
                }}
            >
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-24" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div
                    key={r}
                    className="flex"
                    style={{
                        padding: "0.875rem 1.25rem",
                        gap: "1.5rem",
                        borderBottom: "1px solid var(--border-light)",
                    }}
                >
                    {Array.from({ length: cols }).map((_, c) => (
                        <Skeleton key={c} className={`h-4 ${c === 0 ? "w-32" : "w-20"}`} />
                    ))}
                </div>
            ))}
        </div>
    );
}

const CHART_HEIGHTS = [65, 42, 88, 53, 76, 35];

export function SkeletonChart() {
    return (
        <div className="card" style={{ padding: "1.25rem" }}>
            <Skeleton className="h-5 w-40" style={{ marginBottom: "1rem" }} />
            <div className="flex items-end" style={{ gap: "0.75rem", height: "160px" }}>
                {CHART_HEIGHTS.map((h, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1"
                        style={{
                            height: `${h}%`,
                            borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

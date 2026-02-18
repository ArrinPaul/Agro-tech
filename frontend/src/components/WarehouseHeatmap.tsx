import { useMemo } from "react";
import { useData } from "../contexts/DataContext";

/**
 * Warehouse heatmap visualization component
 * Displays warehouses as a visual grid with color-coded utilization
 */

const UTILIZATION_COLORS = {
  empty: { bg: "bg-[var(--surface-hover)]", border: "border-[var(--border)]", text: "text-[var(--text-muted)]", label: "Empty" },
  low: { bg: "bg-green-50 dark:bg-green-900/30", border: "border-green-200 dark:border-green-700", text: "text-green-700 dark:text-green-400", label: "Low" },
  moderate: { bg: "bg-blue-50 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-700", text: "text-blue-700 dark:text-blue-400", label: "Moderate" },
  high: { bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-700", text: "text-amber-700 dark:text-amber-400", label: "High" },
  critical: { bg: "bg-red-50 dark:bg-red-900/30", border: "border-red-200 dark:border-red-700", text: "text-red-700 dark:text-red-400", label: "Critical" },
  full: { bg: "bg-red-100 dark:bg-red-900/50", border: "border-red-400 dark:border-red-600", text: "text-red-800 dark:text-red-300", label: "Full" },
};

function getUtilizationLevel(pct: number) {
  if (pct === 0) return UTILIZATION_COLORS.empty;
  if (pct < 30) return UTILIZATION_COLORS.low;
  if (pct < 60) return UTILIZATION_COLORS.moderate;
  if (pct < 85) return UTILIZATION_COLORS.high;
  if (pct < 100) return UTILIZATION_COLORS.critical;
  return UTILIZATION_COLORS.full;
}

function getGradientColor(pct: number): string {
  // HSL-based gradient: green -> yellow -> orange -> red
  const hue = ((100 - pct) / 100) * 120; // 120 (green) to 0 (red)
  return `hsl(${hue}, 70%, 50%)`;
}

interface WarehouseHeatmapProps {
  onWarehouseClick?: (warehouseId: string) => void;
  compact?: boolean;
}

export default function WarehouseHeatmap({ onWarehouseClick, compact = false }: WarehouseHeatmapProps) {
  const { warehouses, allocations } = useData();

  const warehouseData = useMemo(() => {
    if (!warehouses) return [];

    return warehouses.map((wh) => {
      const pct = wh.totalCapacity > 0
        ? Math.round((wh.usedCapacity / wh.totalCapacity) * 100)
        : 0;
      const whAllocations = allocations?.filter(a => a.warehouseId === wh._id) || [];
      const level = getUtilizationLevel(pct);

      return {
        ...wh,
        utilization: pct,
        allocationCount: whAllocations.length,
        remaining: wh.totalCapacity - wh.usedCapacity,
        level,
        color: getGradientColor(pct),
      };
    }).sort((a, b) => b.utilization - a.utilization);
  }, [warehouses, allocations]);

  const stats = useMemo(() => {
    if (warehouseData.length === 0) return null;

    const totalCapacity = warehouseData.reduce((s, w) => s + w.totalCapacity, 0);
    const totalUsed = warehouseData.reduce((s, w) => s + w.usedCapacity, 0);
    const avgUtilization = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;
    const criticalCount = warehouseData.filter(w => w.utilization >= 85).length;
    const emptyCount = warehouseData.filter(w => w.utilization === 0).length;

    return { totalCapacity, totalUsed, avgUtilization, criticalCount, emptyCount };
  }, [warehouseData]);

  if (!warehouses || warehouses.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
        <p>No warehouses to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-medium" style={{ color: "var(--text-muted)" }}>Utilization:</span>
        {Object.entries(UTILIZATION_COLORS).map(([key, value]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${value.bg} border ${value.border}`} />
            <span className={value.text}>{value.label}</span>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {stats && !compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg p-3 text-center" style={{ background: "var(--surface-hover)" }}>
            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{stats.avgUtilization}%</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Avg Utilization</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: "var(--surface-hover)" }}>
            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{stats.totalUsed.toLocaleString()}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Used</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: "var(--surface-hover)" }}>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.criticalCount}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Critical</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: "var(--surface-hover)" }}>
            <p className="text-lg font-bold text-gray-400">{stats.emptyCount}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Empty</p>
          </div>
        </div>
      )}

      {/* Heatmap Grid */}
      <div className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {warehouseData.map((wh) => (
          <button
            key={wh._id}
            onClick={() => onWarehouseClick?.(wh._id)}
            className={`relative rounded-xl border-2 p-4 transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 ${wh.level.bg} ${wh.level.border}`}
            title={`${wh.name}: ${wh.utilization}% utilized (${wh.usedCapacity}/${wh.totalCapacity})`}
            aria-label={`Warehouse ${wh.name}, ${wh.utilization}% utilized, ${wh.remaining} units remaining`}
          >
            {/* Utilization bar background */}
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div
                className="absolute bottom-0 left-0 right-0 opacity-20"
                style={{
                  height: `${wh.utilization}%`,
                  backgroundColor: wh.color,
                  transition: "height 0.5s ease-in-out",
                }}
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-semibold text-sm ${wh.level.text} truncate mr-2`}>
                  {wh.name}
                </h3>
                <span
                  className="text-lg font-bold"
                  style={{ color: wh.color }}
                >
                  {wh.utilization}%
                </span>
              </div>

              <p className="text-xs mb-2 truncate" style={{ color: "var(--text-muted)" }}>{wh.location}</p>

              {/* Mini bar */}
              <div className="w-full rounded-full h-2 mb-1" style={{ background: "var(--border)" }}>
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${wh.utilization}%`,
                    backgroundColor: wh.color,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{wh.usedCapacity.toLocaleString()} used</span>
                <span>{wh.remaining.toLocaleString()} free</span>
              </div>

              {!compact && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {wh.allocationCount} allocation{wh.allocationCount !== 1 ? "s" : ""}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${wh.level.bg} ${wh.level.text}`}>
                    {wh.level.label}
                  </span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Warehouse, Sprout, FlaskConical, GitMerge,
  BrainCircuit, AlertTriangle, Info, Plus,
  ArrowUpRight, TrendingUp,
} from "lucide-react";
import { useData } from "../contexts/DataContext";

const LazyWarehouseChart = lazy(() => import("../components/charts/WarehouseUtilChart"));
const LazyCropPieChart = lazy(() => import("../components/charts/CropPieChart"));
const LazyResourceStockChart = lazy(() => import("../components/charts/ResourceStockChart"));
const LazyAllocationHistoryChart = lazy(() => import("../components/charts/AllocationHistoryChart"));

const SEV_STYLES: Record<string, { bg: string; border: string; icon: string; dot: string }> = {
  critical: { bg: "bg-rose-50 dark:bg-rose-500/8", border: "border-l-rose-500", icon: "text-rose-500", dot: "bg-rose-500" },
  warning: { bg: "bg-amber-50 dark:bg-amber-500/8", border: "border-l-amber-500", icon: "text-amber-500", dot: "bg-amber-500" },
  info: { bg: "bg-sky-50 dark:bg-sky-500/8", border: "border-l-sky-500", icon: "text-sky-500", dot: "bg-sky-500" },
};
const SEV_ICON: Record<string, typeof Info> = { critical: AlertTriangle, warning: AlertTriangle, info: Info };

const STAT_CONFIGS = [
  { key: "warehouses", label: "Total Warehouses", icon: Warehouse, gradient: "stat-gradient-emerald", iconBg: "bg-emerald-500", iconShadow: "shadow-emerald-500/25" },
  { key: "crops", label: "Total Crops", icon: Sprout, gradient: "stat-gradient-blue", iconBg: "bg-blue-500", iconShadow: "shadow-blue-500/25" },
  { key: "resources", label: "Resource Types", icon: FlaskConical, gradient: "stat-gradient-amber", iconBg: "bg-amber-500", iconShadow: "shadow-amber-500/25" },
  { key: "allocations", label: "Active Allocations", icon: GitMerge, gradient: "stat-gradient-violet", iconBg: "bg-violet-500", iconShadow: "shadow-violet-500/25" },
] as const;

function StatCard({ label, value, icon: Icon, gradient, iconBg, iconShadow }: {
  label: string; value: number | string; icon: typeof Warehouse;
  gradient: string; iconBg: string; iconShadow: string;
}) {
  return (
    <div className={`card card-hover p-5 relative overflow-hidden`}>
      <div className={`absolute inset-0 ${gradient} opacity-60`} />
      <div className="relative flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shadow-lg ${iconShadow} flex-shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">{value}</p>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ChartSpinner() {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-[var(--brand-500)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardPage() {
  const { warehouses, crops, resources, allocations, suggestions } = useData();
  const navigate = useNavigate();

  const statValues: Record<string, number> = {
    warehouses: warehouses.length,
    crops: crops.length,
    resources: resources.length,
    allocations: allocations.length,
  };

  const warehouseUtilData = warehouses.map((w) => ({
    name: w.name.length > 12 ? w.name.slice(0, 12) + "…" : w.name,
    used: w.usedCapacity,
    free: w.totalCapacity - w.usedCapacity,
    pct: w.totalCapacity > 0 ? Math.round((w.usedCapacity / w.totalCapacity) * 100) : 0,
  }));

  const cropStatusData = Object.entries(
    crops.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const resourceData = resources.map((r) => ({
    name: r.name.length > 12 ? r.name.slice(0, 12) + "…" : r.name,
    stock: r.stockQuantity,
  }));

  const allocationHistoryData = (() => {
    const sorted = [...allocations].sort((a, b) => a.createdAt - b.createdAt);
    const dayMap = new Map<string, number>();
    sorted.forEach((a) => {
      const dateStr = new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + a.allocatedQuantity);
    });
    let cumulative = 0;
    return Array.from(dayMap.entries()).map(([date, qty]) => {
      cumulative += qty;
      return { date, daily: qty, cumulative };
    });
  })();

  const recentAllocations = [...allocations]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const topSuggestions = suggestions.slice(0, 5);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Overview of your agricultural operations</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => navigate("/warehouses")}
            className="btn btn-secondary text-[13px]"
          >
            <Plus size={15} /> New Warehouse
          </button>
          <button
            onClick={() => navigate("/allocations")}
            className="btn btn-primary text-[13px]"
          >
            <Plus size={15} /> New Allocation
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {STAT_CONFIGS.map(({ key, label, icon, gradient, iconBg, iconShadow }) => (
          <StatCard key={key} label={label} value={statValues[key]} icon={icon} gradient={gradient} iconBg={iconBg} iconShadow={iconShadow} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h2 className="font-display font-semibold text-[var(--text-primary)] mb-5 text-[15px]">Warehouse Utilization</h2>
          <Suspense fallback={<ChartSpinner />}>
            <LazyWarehouseChart data={warehouseUtilData} />
          </Suspense>
        </div>
        <div className="card p-6">
          <h2 className="font-display font-semibold text-[var(--text-primary)] mb-5 text-[15px]">Crop Status Distribution</h2>
          <Suspense fallback={<ChartSpinner />}>
            <LazyCropPieChart data={cropStatusData} />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h2 className="font-display font-semibold text-[var(--text-primary)] mb-5 text-[15px]">Resource Stock Levels</h2>
          <Suspense fallback={<ChartSpinner />}>
            <LazyResourceStockChart data={resourceData} />
          </Suspense>
        </div>
        <div className="card p-6">
          <h2 className="font-display font-semibold text-[var(--text-primary)] mb-5 text-[15px]">Allocation History</h2>
          <Suspense fallback={<ChartSpinner />}>
            <LazyAllocationHistoryChart data={allocationHistoryData} />
          </Suspense>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent allocations */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-[15px]">Recent Allocations</h2>
            <button onClick={() => navigate("/allocations")} className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] hover:text-[var(--brand-700)] transition-colors">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          {recentAllocations.length === 0 ? (
            <div className="text-center py-10">
              <GitMerge size={28} className="mx-auto text-[var(--text-muted)] mb-2 opacity-40" />
              <p className="text-sm text-[var(--text-muted)]">No allocations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentAllocations.map((al) => (
                <div
                  key={al._id}
                  className="flex items-center justify-between text-sm cursor-pointer hover:bg-[var(--surface-hover)] rounded-xl px-3 py-2.5 -mx-1 transition-all group"
                  onClick={() => navigate(`/allocations/${al._id}`)}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-600)] transition-colors truncate">
                      {al.cropName} → {al.warehouseName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{new Date(al.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="font-display font-semibold text-[var(--text-primary)] ml-3 flex-shrink-0 text-[13px]">{al.allocatedQuantity} units</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-[15px] flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <BrainCircuit size={14} className="text-violet-500" />
              </div>
              AI Insights
            </h2>
            <button onClick={() => navigate("/ai-insights")} className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] hover:text-[var(--brand-700)] transition-colors">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          {topSuggestions.length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp size={28} className="mx-auto text-[var(--text-muted)] mb-2 opacity-40" />
              <p className="text-sm text-[var(--text-muted)]">No suggestions available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topSuggestions.map((s, i) => {
                const Icon = SEV_ICON[s.severity];
                const style = SEV_STYLES[s.severity];
                return (
                  <div key={i} className={`rounded-xl border-l-[3px] ${style.border} ${style.bg} px-4 py-3`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 flex-shrink-0 ${style.icon}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{s.title}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{s.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Warehouse, Sprout, FlaskConical, GitMerge,
  BrainCircuit, AlertTriangle, Info, Plus,
  ArrowUpRight, TrendingUp, Activity,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
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
  { key: "warehouses", label: "Total Warehouses", icon: Warehouse, gradient: "stat-gradient-emerald", iconBg: "bg-emerald-500", iconShadow: "shadow-emerald-500/25", trend: "+12%" },
  { key: "crops", label: "Total Crops", icon: Sprout, gradient: "stat-gradient-blue", iconBg: "bg-blue-500", iconShadow: "shadow-blue-500/25", trend: "+8%" },
  { key: "resources", label: "Resource Types", icon: FlaskConical, gradient: "stat-gradient-amber", iconBg: "bg-amber-500", iconShadow: "shadow-amber-500/25", trend: "+5%" },
  { key: "allocations", label: "Active Allocations", icon: GitMerge, gradient: "stat-gradient-violet", iconBg: "bg-violet-500", iconShadow: "shadow-violet-500/25", trend: "+15%" },
] as const;

function StatCard({ label, value, icon: Icon, gradient, iconBg, iconShadow }: {
  label: string; value: number | string; icon: typeof Warehouse;
  gradient: string; iconBg: string; iconShadow: string;
}) {
  return (
    <div className={`card card-hover p-5 relative overflow-hidden group`}>
      <div className={`absolute inset-0 ${gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-300`} />
      {/* Decorative corner accent */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07]" style={{ background: "var(--brand-500)" }} />
      <div className="relative flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-lg ${iconShadow} flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[var(--text-muted)] mb-0.5">{label}</p>
          <p className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon: Icon, iconColor, children }: {
  title: string; icon: typeof Warehouse; iconColor: string; children: React.ReactNode;
}) {
  return (
    <div className="card p-6 relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${iconColor}, transparent)` }} />
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}15` }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <h2 className="font-display font-semibold text-[var(--text-primary)] text-[15px]">{title}</h2>
      </div>
      {children}
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
  const { user } = useUser();
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
      {/* Header with welcome message */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10">
              <Activity size={12} className="text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}. Here's your farm overview.
          </p>
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
        <ChartCard title="Warehouse Utilization" icon={Warehouse} iconColor="#059669">
          <Suspense fallback={<ChartSpinner />}>
            <LazyWarehouseChart data={warehouseUtilData} />
          </Suspense>
        </ChartCard>
        <ChartCard title="Crop Status Distribution" icon={Sprout} iconColor="#3b82f6">
          <Suspense fallback={<ChartSpinner />}>
            <LazyCropPieChart data={cropStatusData} />
          </Suspense>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Resource Stock Levels" icon={FlaskConical} iconColor="#f59e0b">
          <Suspense fallback={<ChartSpinner />}>
            <LazyResourceStockChart data={resourceData} />
          </Suspense>
        </ChartCard>
        <ChartCard title="Allocation History" icon={GitMerge} iconColor="#8b5cf6">
          <Suspense fallback={<ChartSpinner />}>
            <LazyAllocationHistoryChart data={allocationHistoryData} />
          </Suspense>
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent allocations */}
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #8b5cf6, transparent)" }} />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <GitMerge size={16} className="text-violet-500" />
              </div>
              <h2 className="font-display font-semibold text-[var(--text-primary)] text-[15px]">Recent Allocations</h2>
            </div>
            <button onClick={() => navigate("/allocations")} className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] hover:text-[var(--brand-700)] transition-colors">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          {recentAllocations.length === 0 ? (
            <div className="text-center py-12 relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
                <GitMerge size={120} />
              </div>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                  <GitMerge size={24} className="text-violet-400" />
                </div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">No allocations yet</p>
                <p className="text-xs text-[var(--text-muted)]">Allocate crops to warehouses to see them here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {recentAllocations.map((al, idx) => (
                <div
                  key={al._id}
                  className="flex items-center justify-between text-sm cursor-pointer hover:bg-[var(--surface-hover)] rounded-xl px-3 py-2.5 -mx-1 transition-all group"
                  onClick={() => navigate(`/allocations/${al._id}`)}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/10 transition-colors">
                      <GitMerge size={14} className="text-[var(--text-muted)] group-hover:text-violet-500 transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-600)] transition-colors truncate">
                        {al.cropName} → {al.warehouseName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{new Date(al.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="font-display font-semibold text-[var(--text-primary)] ml-3 flex-shrink-0 text-[13px] tabular-nums">{al.allocatedQuantity} units</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #a855f7, transparent)" }} />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BrainCircuit size={16} className="text-purple-500" />
              </div>
              <h2 className="font-display font-semibold text-[var(--text-primary)] text-[15px]">AI Insights</h2>
            </div>
            <button onClick={() => navigate("/ai-insights")} className="flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] hover:text-[var(--brand-700)] transition-colors">
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          {topSuggestions.length === 0 ? (
            <div className="text-center py-12 relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
                <BrainCircuit size={120} />
              </div>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp size={24} className="text-purple-400" />
                </div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">No insights available</p>
                <p className="text-xs text-[var(--text-muted)]">AI suggestions will appear as data grows</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {topSuggestions.map((s, i) => {
                const Icon = SEV_ICON[s.severity];
                const style = SEV_STYLES[s.severity];
                return (
                  <div key={i} className={`rounded-xl border-l-[3px] ${style.border} ${style.bg} px-4 py-3 transition-all hover:shadow-sm`}>
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

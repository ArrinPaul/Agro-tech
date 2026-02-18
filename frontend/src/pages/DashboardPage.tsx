import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Warehouse, Sprout, FlaskConical, GitMerge,
  BrainCircuit, AlertTriangle, Info, Plus,
} from "lucide-react";
import { useData } from "../contexts/DataContext";

// Lazy load chart components for better initial load performance
const LazyWarehouseChart = lazy(() => import("../components/charts/WarehouseUtilChart"));
const LazyCropPieChart = lazy(() => import("../components/charts/CropPieChart"));
const LazyResourceStockChart = lazy(() => import("../components/charts/ResourceStockChart"));
const LazyAllocationHistoryChart = lazy(() => import("../components/charts/AllocationHistoryChart"));

const SEV_STYLES: Record<string, string> = {
  critical: "bg-red-50 border-l-4 border-red-500",
  warning: "bg-yellow-50 border-l-4 border-yellow-400",
  info: "bg-blue-50 border-l-4 border-blue-400",
};
const SEV_ICON: Record<string, typeof Info> = { critical: AlertTriangle, warning: AlertTriangle, info: Info };

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof Warehouse; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { warehouses, crops, resources, allocations, suggestions } = useData();
  const navigate = useNavigate();

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

  // Allocation history over time (5.2)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Overview of your agricultural operations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/warehouses")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={15} /> New Warehouse
          </button>
          <button
            onClick={() => navigate("/allocations")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={15} /> New Allocation
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Warehouses" value={warehouses.length} icon={Warehouse} color="bg-green-600" />
        <StatCard label="Total Crops" value={crops.length} icon={Sprout} color="bg-blue-600" />
        <StatCard label="Resource Types" value={resources.length} icon={FlaskConical} color="bg-amber-500" />
        <StatCard label="Active Allocations" value={allocations.length} icon={GitMerge} color="bg-purple-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Warehouse utilization */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Warehouse Utilization</h2>
          <Suspense fallback={<div className="h-[200px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <LazyWarehouseChart data={warehouseUtilData} />
          </Suspense>
        </div>

        {/* Crop status distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Crop Status Distribution</h2>
          <Suspense fallback={<div className="h-[160px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <LazyCropPieChart data={cropStatusData} />
          </Suspense>
        </div>
      </div>

      {/* Resource stock + allocation history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resource stock chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Resource Stock Levels</h2>
          <Suspense fallback={<div className="h-[180px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <LazyResourceStockChart data={resourceData} />
          </Suspense>
        </div>

        {/* Allocation history line chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Allocation History</h2>
          <Suspense fallback={<div className="h-[180px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <LazyAllocationHistoryChart data={allocationHistoryData} />
          </Suspense>
        </div>
      </div>

      {/* Bottom row: recent allocations + AI suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent allocations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Allocations</h2>
            <button onClick={() => navigate("/allocations")} className="text-xs text-green-600 hover:underline">View all</button>
          </div>
          {recentAllocations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No allocations yet</p>
          ) : (
            <div className="space-y-3">
              {recentAllocations.map((al) => (
                <div
                  key={al._id}
                  className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 py-1 -mx-2 transition-colors"
                  onClick={() => navigate(`/allocations/${al._id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{al.cropName} → {al.warehouseName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(al.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{al.allocatedQuantity} units</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BrainCircuit size={16} className="text-purple-600" /> AI Insights
            </h2>
            <button onClick={() => navigate("/ai-insights")} className="text-xs text-green-600 hover:underline">View all</button>
          </div>
          {topSuggestions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No suggestions</p>
          ) : (
            <div className="space-y-2">
              {topSuggestions.map((s, i) => {
                const Icon = SEV_ICON[s.severity];
                return (
                  <div key={i} className={`rounded-lg px-3 py-2.5 ${SEV_STYLES[s.severity]}`}>
                    <div className="flex items-start gap-2">
                      <Icon size={14} className={`mt-0.5 flex-shrink-0 ${s.severity === "critical" ? "text-red-600" : s.severity === "warning" ? "text-yellow-600" : "text-blue-600"}`} />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{s.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{s.message}</p>
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

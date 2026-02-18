import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line,
} from "recharts";
import {
  Warehouse, Sprout, FlaskConical, GitMerge,
  BrainCircuit, AlertTriangle, Info, Plus,
} from "lucide-react";
import { useData } from "../contexts/DataContext";

const STATUS_COLORS: Record<string, string> = {
  PLANTED: "#16a34a", GROWING: "#2563eb", HARVESTED: "#d97706", STORED: "#7c3aed",
};
const UTIL_COLOR = (pct: number) => pct > 95 ? "#dc2626" : pct > 80 ? "#d97706" : "#16a34a";
const SEV_STYLES: Record<string, string> = {
  critical: "bg-red-50 border-l-4 border-red-500",
  warning: "bg-yellow-50 border-l-4 border-yellow-400",
  info: "bg-blue-50 border-l-4 border-blue-400",
};
const SEV_ICON: Record<string, typeof Info> = { critical: AlertTriangle, warning: AlertTriangle, info: Info };

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof Warehouse; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your agricultural operations</p>
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
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Warehouse Utilization</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={warehouseUtilData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [v, n === "used" ? "Used" : "Free"]} />
              <Bar dataKey="used" name="Used" stackId="a" radius={[0, 0, 4, 4]}>
                {warehouseUtilData.map((entry, i) => (
                  <Cell key={i} fill={UTIL_COLOR(entry.pct)} />
                ))}
              </Bar>
              <Bar dataKey="free" name="Free" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Crop status distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Crop Status Distribution</h2>
          <div className="flex items-center justify-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={cropStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {cropStatusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {cropStatusData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-sm" style={{ background: STATUS_COLORS[entry.name] ?? "#94a3b8" }} />
                  <span className="text-gray-600">{entry.name}</span>
                  <span className="font-semibold text-gray-900">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resource stock + allocation history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resource stock chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Resource Stock Levels</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={resourceData} barSize={36}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <Bar dataKey="stock" name="Stock" fill="#16a34a" radius={[4, 4, 0, 0]}>
                {resourceData.map((entry, i) => (
                  <Cell key={i} fill={entry.stock === 0 ? "#dc2626" : entry.stock < 50 ? "#d97706" : "#16a34a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation history line chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Allocation History</h2>
          {allocationHistoryData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No allocation data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={allocationHistoryData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <Tooltip />
                <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="daily" name="Daily" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row: recent allocations + AI suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent allocations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Allocations</h2>
            <button onClick={() => navigate("/allocations")} className="text-xs text-green-600 hover:underline">View all</button>
          </div>
          {recentAllocations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No allocations yet</p>
          ) : (
            <div className="space-y-3">
              {recentAllocations.map((al) => (
                <div
                  key={al._id}
                  className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 transition-colors"
                  onClick={() => navigate(`/allocations/${al._id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-800">{al.cropName} → {al.warehouseName}</p>
                    <p className="text-xs text-gray-400">{new Date(al.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="font-semibold text-gray-900">{al.allocatedQuantity} units</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
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

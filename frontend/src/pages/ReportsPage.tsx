import { useState, useMemo } from "react";
import {
    FileBarChart2, Download, Calendar, Warehouse,
    GitMerge, FlaskConical,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Cell,
} from "recharts";
import { useData } from "../contexts/DataContext";

type Tab = "warehouse" | "allocation" | "resource";

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function toCSV(headers: string[], rows: string[][]) {
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
    return lines.join("\n");
}

function downloadCSV(filename: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function ReportsPage() {
    const { warehouses, allocations, resources, crops } = useData();
    const [tab, setTab] = useState<Tab>("warehouse");

    // Date range — default last 90 days
    const now = Date.now();
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(now - 90 * 86400000);
        return d.toISOString().slice(0, 10);
    });
    const [endDate, setEndDate] = useState(() => new Date(now).toISOString().slice(0, 10));

    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400000; // inclusive end

    // ── Warehouse Report ──
    const warehouseReport = useMemo(() =>
        warehouses.map((w) => {
            const util = w.totalCapacity > 0 ? Math.round((w.usedCapacity / w.totalCapacity) * 100) : 0;
            const allocCount = allocations.filter((a) => a.warehouseId === w._id).length;
            return { ...w, util, allocCount };
        }),
        [warehouses, allocations]);

    // ── Allocation Report ──
    const allocationReport = useMemo(() =>
        allocations
            .filter((a) => a.createdAt >= startTs && a.createdAt < endTs)
            .sort((a, b) => b.createdAt - a.createdAt),
        [allocations, startTs, endTs]);

    // ── Resource Report ──
    const resourceReport = useMemo(() =>
        resources.map((r) => {
            const linkedCrops = crops.filter((c) =>
                allocations.some((a) => a.cropId === c._id)
            ).length;
            return { ...r, linkedCrops };
        }),
        [resources, crops, allocations]);

    // ── Chart data ──
    const chartData = useMemo(() => {
        if (tab === "warehouse") {
            return warehouseReport.map((w) => ({
                name: w.name.length > 14 ? w.name.slice(0, 14) + "…" : w.name,
                utilization: w.util,
            }));
        }
        if (tab === "resource") {
            return resourceReport.map((r) => ({
                name: r.name.length > 14 ? r.name.slice(0, 14) + "…" : r.name,
                stock: r.stockQuantity,
            }));
        }
        // allocation — group by day
        const dayMap: Record<string, number> = {};
        allocationReport.forEach((a) => {
            const day = new Date(a.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
            dayMap[day] = (dayMap[day] ?? 0) + a.allocatedQuantity;
        });
        return Object.entries(dayMap).map(([name, qty]) => ({ name, quantity: qty }));
    }, [tab, warehouseReport, resourceReport, allocationReport]);

    // ── Export handlers ──
    function handleExport() {
        if (tab === "warehouse") {
            const csv = toCSV(
                ["Name", "Location", "Total Capacity", "Used Capacity", "Utilization %", "Allocations"],
                warehouseReport.map((w) => [w.name, w.location, String(w.totalCapacity), String(w.usedCapacity), `${w.util}%`, String(w.allocCount)])
            );
            downloadCSV("warehouse_report.csv", csv);
        } else if (tab === "allocation") {
            const csv = toCSV(
                ["Date", "Crop", "Warehouse", "Quantity", "Created By"],
                allocationReport.map((a) => [formatDate(a.createdAt), a.cropName ?? "", a.warehouseName ?? "", String(a.allocatedQuantity), a.createdByName ?? ""])
            );
            downloadCSV("allocation_report.csv", csv);
        } else {
            const csv = toCSV(
                ["Name", "Type", "Stock Quantity"],
                resourceReport.map((r) => [r.name, r.type, String(r.stockQuantity)])
            );
            downloadCSV("resource_report.csv", csv);
        }
    }

    const tabs: { key: Tab; label: string; icon: typeof Warehouse }[] = [
        { key: "warehouse", label: "Warehouses", icon: Warehouse },
        { key: "allocation", label: "Allocations", icon: GitMerge },
        { key: "resource", label: "Resources", icon: FlaskConical },
    ];

    const UTIL_COLOR = (pct: number) => pct > 95 ? "#dc2626" : pct > 80 ? "#d97706" : "#16a34a";

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileBarChart2 className="text-green-600" size={24} /> Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Generate and export detailed reports</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Tabs + Date Range */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-1">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === key
                                ? "bg-green-600 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <Icon size={16} /> {label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={15} className="text-gray-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-semibold text-gray-900 mb-4">
                        {tab === "warehouse" ? "Warehouse Utilization (%)" : tab === "resource" ? "Resource Stock Levels" : "Allocation Quantities Over Time"}
                    </h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            {tab === "warehouse" && (
                                <Bar dataKey="utilization" name="Utilization %" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry: any, i: number) => (
                                        <Cell key={i} fill={UTIL_COLOR(entry.utilization)} />
                                    ))}
                                </Bar>
                            )}
                            {tab === "resource" && (
                                <Bar dataKey="stock" name="Stock" fill="#16a34a" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry: any, i: number) => (
                                        <Cell key={i} fill={(entry.stock ?? 0) === 0 ? "#dc2626" : (entry.stock ?? 0) < 50 ? "#d97706" : "#16a34a"} />
                                    ))}
                                </Bar>
                            )}
                            {tab === "allocation" && (
                                <Bar dataKey="quantity" name="Quantity" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {tab === "warehouse" && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Location</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Total Cap.</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Used Cap.</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Utilization</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Allocations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {warehouseReport.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No warehouses found</td></tr>
                            ) : warehouseReport.map((w) => (
                                <tr key={w._id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-5 py-3 font-medium text-gray-900">{w.name}</td>
                                    <td className="px-5 py-3 text-gray-500">{w.location}</td>
                                    <td className="px-5 py-3">{w.totalCapacity.toLocaleString()}</td>
                                    <td className="px-5 py-3">{w.usedCapacity.toLocaleString()}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full transition-all"
                                                    style={{ width: `${Math.min(w.util, 100)}%`, backgroundColor: UTIL_COLOR(w.util) }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-600">{w.util}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-gray-600">{w.allocCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {tab === "allocation" && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Crop</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Warehouse</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Quantity</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Created By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allocationReport.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No allocations in this date range</td></tr>
                            ) : allocationReport.map((a) => (
                                <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                                    <td className="px-5 py-3 font-medium text-gray-900">{a.cropName}</td>
                                    <td className="px-5 py-3 text-gray-600">{a.warehouseName}</td>
                                    <td className="px-5 py-3">{a.allocatedQuantity.toLocaleString()} units</td>
                                    <td className="px-5 py-3 text-gray-600">{a.createdByName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {tab === "resource" && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Stock Qty</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resourceReport.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No resources found</td></tr>
                            ) : resourceReport.map((r) => (
                                <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-5 py-3 font-medium text-gray-900">{r.name}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.type === "FERTILIZER" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                            }`}>
                                            {r.type}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">{r.stockQuantity.toLocaleString()}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.stockQuantity === 0 ? "bg-red-100 text-red-700" :
                                            r.stockQuantity < 50 ? "bg-yellow-100 text-yellow-700" :
                                                "bg-green-100 text-green-700"
                                            }`}>
                                            {r.stockQuantity === 0 ? "Out of Stock" : r.stockQuantity < 50 ? "Low Stock" : "In Stock"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Summary footer */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                        {tab === "warehouse" && `${warehouseReport.length} warehouses`}
                        {tab === "allocation" && `${allocationReport.length} allocations in range`}
                        {tab === "resource" && `${resourceReport.length} resources`}
                    </span>
                    <span className="text-xs text-gray-400">
                        Report generated: {new Date().toLocaleString("en-IN")}
                    </span>
                </div>
            </div>
        </div>
    );
}

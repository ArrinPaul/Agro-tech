import { useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { useData } from "../contexts/DataContext";

const ACTION_COLORS: Record<string, string> = {
  CREATE_WAREHOUSE: "bg-green-100 text-green-700",
  UPDATE_WAREHOUSE: "bg-blue-100 text-blue-700",
  DELETE_WAREHOUSE: "bg-red-100 text-red-700",
  CREATE_CROP: "bg-emerald-100 text-emerald-700",
  UPDATE_CROP: "bg-sky-100 text-sky-700",
  DELETE_CROP: "bg-rose-100 text-rose-700",
  CREATE_RESOURCE: "bg-amber-100 text-amber-700",
  UPDATE_RESOURCE: "bg-cyan-100 text-cyan-700",
  DELETE_RESOURCE: "bg-orange-100 text-orange-700",
  ALLOCATE_CROP: "bg-purple-100 text-purple-700",
  DEALLOCATE: "bg-gray-100 text-gray-700",
};

const ENTITY_FILTERS = ["ALL", "warehouse", "crop", "resource", "allocation"];

export default function AuditLogPage() {
  const { auditLogs } = useData();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const filtered = auditLogs.filter((l) => {
    const matchSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.performedByName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      l.entityType.toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === "ALL" || l.entityType === entityFilter;
    return matchSearch && matchEntity;
  });

  const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="text-gray-500" size={24} /> Audit Log
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{auditLogs.length} total log entries</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Search logs…" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ENTITY_FILTERS.map((f) => (
            <button key={f} onClick={() => { setEntityFilter(f); setPage(1); }}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${entityFilter === f ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-600">Timestamp</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Action</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Entity</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Performed By</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">No logs found</td></tr>
            )}
            {paginated.map((l) => (
              <tr key={l._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                  {new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[l.action] ?? "bg-gray-100 text-gray-700"}`}>
                    {l.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600 capitalize">{l.entityType}</td>
                <td className="px-5 py-3 text-gray-700">{l.performedByName ?? l.performedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1 text-xs rounded-lg ${p === page ? "bg-gray-800 text-white" : "border border-gray-200 hover:bg-gray-50"}`}>
                  {p}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

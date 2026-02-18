import { useState, useMemo } from "react";
import { ClipboardList, Download } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";

const ACTION_COLORS: Record<string, string> = {
  CREATE_WAREHOUSE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  UPDATE_WAREHOUSE: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  DELETE_WAREHOUSE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  CREATE_CROP: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  UPDATE_CROP: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  DELETE_CROP: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  CREATE_RESOURCE: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  UPDATE_RESOURCE: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  DELETE_RESOURCE: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  ALLOCATE_CROP: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  DEALLOCATE: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const ENTITY_FILTERS = ["ALL", "warehouse", "crop", "resource", "allocation"];

export default function AuditLogPage() {
  const { auditLogs } = useData();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return auditLogs.filter((l) => {
      const matchSearch = !search ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        (l.performedByName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        l.entityType.toLowerCase().includes(search.toLowerCase());
      const matchEntity = entityFilter === "ALL" || l.entityType === entityFilter;
      return matchSearch && matchEntity;
    });
  }, [auditLogs, search, entityFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.timestamp - a.timestamp), [filtered]);

  const {
    paginatedData,
    currentPage,
    itemsPerPage,
    setPage,
    setItemsPerPage,
  } = usePagination(sorted, { initialPage: 1, itemsPerPage: 15 });

  function handleExport() {
    const headers = ["Timestamp", "Action", "Entity Type", "Performed By"];
    const rows = sorted.map(l => [
      new Date(l.timestamp).toLocaleString(),
      l.action.replace(/_/g, " "),
      l.entityType,
      l.performedByName ?? l.performedBy
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Audit log exported to CSV", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <ClipboardList style={{ color: "var(--text-muted)" }} size={24} /> Audit Log
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{sorted.length} of {auditLogs.length} log entries</p>
        </div>
        <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchBar
          placeholder="Search logs…"
          onSearch={(q) => { setSearch(q); setPage(1); }}
          delay={300}
          className="flex-1 min-w-48"
        />
        <div className="flex gap-1 flex-wrap">
          {ENTITY_FILTERS.map((f) => (
            <button key={f} onClick={() => { setEntityFilter(f); setPage(1); }}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${entityFilter === f
                ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-hover)" }}>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Timestamp</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Action</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Entity</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Performed By</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10" style={{ color: "var(--text-muted)" }}>No logs found</td></tr>
            )}
            {paginatedData.items.map((l) => (
              <tr key={l._id} className="table-row" style={{ borderBottom: "1px solid var(--border-light)" }}>
                <td className="px-5 py-3 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[l.action] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                    {l.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3 capitalize" style={{ color: "var(--text-secondary)" }}>{l.entityType}</td>
                <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{l.performedByName ?? l.performedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {paginatedData.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={paginatedData.totalPages}
            totalItems={paginatedData.totalItems}
            itemsPerPage={itemsPerPage}
            hasNext={paginatedData.hasNext}
            hasPrev={paginatedData.hasPrev}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
            showItemsPerPage={true}
          />
        )}
      </div>
    </div>
  );
}

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ClipboardList className="text-gray-500 dark:text-gray-400" size={24} /> Audit Log
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{sorted.length} of {auditLogs.length} log entries</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
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
                : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-300">Timestamp</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-300">Action</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-300">Entity</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-300">Performed By</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400 dark:text-gray-500">No logs found</td></tr>
            )}
            {paginatedData.items.map((l) => (
              <tr key={l._id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-5 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[l.action] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                    {l.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600 dark:text-gray-400 capitalize">{l.entityType}</td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{l.performedByName ?? l.performedBy}</td>
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

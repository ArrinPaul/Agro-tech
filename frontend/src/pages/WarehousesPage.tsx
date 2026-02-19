import { useState, useMemo, lazy, Suspense } from "react";
import { Plus, Pencil, Trash2, MapPin, Package, Download, Users, BarChart3, List } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";
import { validateStringLength, validateNumberRange } from "../utils/security";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";
import type { Warehouse } from "../types";

const WarehouseHeatmap = lazy(() => import("../components/WarehouseHeatmap"));

function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const barColor = pct > 95 ? "#ef4444" : pct > 80 ? "#f59e0b" : "var(--brand-500)";
  const textColor = pct > 95 ? "text-rose-600 dark:text-rose-400" : pct > 80 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
        <span>{used} / {total} units</span>
        <span className={`font-semibold ${textColor}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}

type FormData = { name: string; location: string; totalCapacity: string };

function WarehouseForm({ initial, onSubmit, onClose }: {
  initial?: Partial<FormData>;
  onSubmit: (d: FormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>({ name: initial?.name ?? "", location: initial?.location ?? "", totalCapacity: initial?.totalCapacity ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: keyof FormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nameValid = validateStringLength(form.name, 1, 100, "Warehouse name");
    if (!nameValid.valid) newErrors.name = nameValid.error!;
    const locValid = validateStringLength(form.location, 1, 200, "Location");
    if (!locValid.valid) newErrors.location = locValid.error!;
    const capValid = validateNumberRange(Number(form.totalCapacity), 1, 10000000, "Total capacity");
    if (!capValid.valid) newErrors.totalCapacity = capValid.error!;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try { await onSubmit(form); } finally { setIsSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Name *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)}
          className={`input ${errors.name ? "input-error" : ""}`}
          placeholder="e.g. Central Silo A" />
        {errors.name && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Location *</label>
        <input required value={form.location} onChange={(e) => set("location", e.target.value)}
          className={`input ${errors.location ? "input-error" : ""}`}
          placeholder="e.g. North Field" />
        {errors.location && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.location}</p>}
      </div>
      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Total Capacity (units) *</label>
        <input required type="number" min={1} value={form.totalCapacity} onChange={(e) => set("totalCapacity", e.target.value)}
          className={`input ${errors.totalCapacity ? "input-error" : ""}`}
          placeholder="e.g. 1000" />
        {errors.totalCapacity && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.totalCapacity}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-3">
        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          Save
        </button>
      </div>
    </form>
  );
}

export default function WarehousesPage() {
  const { warehouses, createWarehouse, updateWarehouse, deleteWarehouse } = useData();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedWarehouses, setSelectedWarehouses] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "heatmap">("list");

  // Memoize filtered data to avoid recalculation on every render
  const filtered = useMemo(() => {
    if (!searchQuery) return warehouses;
    const query = searchQuery.toLowerCase();
    return warehouses.filter((w) =>
      w.name.toLowerCase().includes(query) ||
      w.location.toLowerCase().includes(query)
    );
  }, [warehouses, searchQuery]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    itemsPerPage,
    setPage,
    setItemsPerPage,
  } = usePagination(filtered, { initialPage: 1, itemsPerPage: 10 });

  function handleCreate(form: FormData) {
    const cap = Number(form.totalCapacity);
    if (cap <= 0) { addToast("Capacity must be > 0", "error"); return; }
    createWarehouse({ name: form.name, location: form.location, totalCapacity: cap });
    addToast("Warehouse created", "success");
    setCreateOpen(false);
  }

  function handleEdit(form: FormData) {
    if (!editTarget) return;
    const cap = Number(form.totalCapacity);
    if (cap <= 0) { addToast("Capacity must be > 0", "error"); return; }
    if (cap < editTarget.usedCapacity) { addToast(`Capacity cannot be less than current usage (${editTarget.usedCapacity})`, "error"); return; }
    updateWarehouse(editTarget._id, { name: form.name, location: form.location, totalCapacity: cap });
    addToast("Warehouse updated", "success");
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const err = await deleteWarehouse(deleteTarget._id);
    if (err) { addToast(err, "error"); return; }
    addToast("Warehouse deleted", "success");
  }

  // Bulk operations
  function toggleSelection(id: string) {
    setSelectedWarehouses(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function toggleSelectAll() {
    if (selectedWarehouses.size === paginatedData.items.length) {
      setSelectedWarehouses(new Set());
    } else {
      setSelectedWarehouses(new Set(paginatedData.items.map(w => w._id)));
    }
  }

  async function handleBulkDelete() {
    const errors: string[] = [];
    for (const id of selectedWarehouses) {
      const err = await deleteWarehouse(id);
      if (err) errors.push(err);
    }
    if (errors.length > 0) {
      addToast(`Some warehouses couldn't be deleted. ${errors[0]}`, "error");
    } else {
      addToast(`Deleted ${selectedWarehouses.size} warehouses`, "success");
    }
    setSelectedWarehouses(new Set());
    setBulkSelectMode(false);
  }

  // CSV Export
  function handleExport() {
    const headers = ["Name", "Location", "Total Capacity", "Used Capacity", "Utilization %", "Created"];
    const rows = filtered.map(w => [
      w.name,
      w.location,
      w.totalCapacity.toString(),
      w.usedCapacity.toString(),
      (w.totalCapacity > 0 ? Math.round((w.usedCapacity / w.totalCapacity) * 100) : 0).toString(),
      new Date(w.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warehouses_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Warehouses exported to CSV", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">Warehouses</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {filtered.length} of {warehouses.length} warehouses
            {bulkSelectMode && selectedWarehouses.size > 0 && ` • ${selectedWarehouses.size} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-all ${viewMode === "list" ? "bg-[var(--brand-600)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"}`}
              style={viewMode !== "list" ? { background: "var(--surface)" } : {}}>
              <List size={14} /> List
            </button>
            <button onClick={() => setViewMode("heatmap")}
              className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-all ${viewMode === "heatmap" ? "bg-[var(--brand-600)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"}`}
              style={viewMode !== "heatmap" ? { background: "var(--surface)" } : {}}>
              <BarChart3 size={14} /> Heatmap
            </button>
          </div>
          <button onClick={handleExport} className="btn btn-secondary text-[13px]">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => { setBulkSelectMode(!bulkSelectMode); setSelectedWarehouses(new Set()); }}
            className={`btn text-[13px] ${bulkSelectMode ? "btn-accent" : "btn-secondary"}`}>
            <Users size={15} /> {bulkSelectMode ? "Cancel" : "Bulk Edit"}
          </button>
          <button onClick={() => setCreateOpen(true)} className="btn btn-primary text-[13px]">
            <Plus size={15} /> Add Warehouse
          </button>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        placeholder="Search warehouses by name or location..."
        onSearch={setSearchQuery}
        delay={300}
      />

      {/* Bulk Actions Bar */}
      {bulkSelectMode && selectedWarehouses.size > 0 && (
        <div className="card animate-slide-down" style={{ padding: "0.875rem 1.25rem", background: "rgba(99, 102, 241, 0.06)" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: "var(--accent-600)" }}>
              {selectedWarehouses.size} warehouses selected
            </span>
            <button onClick={handleBulkDelete} className="btn btn-danger text-xs py-1">
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {/* Heatmap View */}
      {viewMode === "heatmap" && (
        <div className="card p-6">
          <Suspense fallback={<div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-[var(--brand-500)] border-t-transparent rounded-full animate-spin" /></div>}>
            <WarehouseHeatmap onWarehouseClick={(id) => {
              const wh = warehouses.find(w => w._id === id);
              if (wh) setEditTarget(wh);
            }} />
          </Suspense>
        </div>
      )}

      {/* Table View */}
      {viewMode === "list" && (
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-hover)" }}>
              {bulkSelectMode && (
                <th className="px-5 py-3.5">
                  <input type="checkbox"
                    checked={selectedWarehouses.size === paginatedData.items.length && paginatedData.items.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded" style={{ accentColor: "var(--brand-600)" }} />
                </th>
              )}
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Name</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Location</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider w-56" style={{ color: "var(--text-muted)" }}>Capacity</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Created</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.length === 0 && (
              <tr><td colSpan={bulkSelectMode ? 6 : 5} className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>No warehouses found</td></tr>
            )}
            {paginatedData.items.map((w) => (
              <tr key={w._id} className="table-row" style={{ borderBottom: "1px solid var(--border-light)" }}>
                {bulkSelectMode && (
                  <td className="px-5 py-4">
                    <input type="checkbox" checked={selectedWarehouses.has(w._id)} onChange={() => toggleSelection(w._id)}
                      className="rounded" style={{ accentColor: "var(--brand-600)" }} />
                  </td>
                )}
                <td className="px-5 py-4 font-medium flex items-center gap-2.5" style={{ color: "var(--text-primary)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(5, 150, 105, 0.08)" }}>
                    <Package size={14} style={{ color: "var(--brand-600)" }} />
                  </div>
                  {w.name}
                </td>
                <td className="px-5 py-4 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  <span className="flex items-center gap-1.5"><MapPin size={13} style={{ color: "var(--text-muted)" }} />{w.location}</span>
                </td>
                <td className="px-5 py-4 w-56">
                  <CapacityBar used={w.usedCapacity} total={w.totalCapacity} />
                </td>
                <td className="px-5 py-4 text-[13px]" style={{ color: "var(--text-muted)" }}>{new Date(w.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-0.5 justify-end">
                    <button onClick={() => setEditTarget(w)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteTarget(w)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {paginatedData.totalPages > 0 && (
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
      )}

      {/* Modals */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Warehouse">
        <WarehouseForm onSubmit={handleCreate} onClose={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Warehouse">
        {editTarget && (
          <WarehouseForm
            initial={{ name: editTarget.name, location: editTarget.location, totalCapacity: String(editTarget.totalCapacity) }}
            onSubmit={handleEdit}
            onClose={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Warehouse"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}

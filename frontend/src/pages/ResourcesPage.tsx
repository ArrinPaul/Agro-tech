import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Minus, FlaskConical, AlertTriangle, Download, Users, Check } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";
import { usePagination } from "../hooks/usePagination";
import { validateStringLength, validateNumberRange } from "../utils/security";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import type { Resource, ResourceType } from "../types";

const TYPES: ResourceType[] = ["FERTILIZER", "PESTICIDE"];
const TYPE_COLORS: Record<ResourceType, string> = {
  FERTILIZER: "bg-green-100 text-green-700",
  PESTICIDE: "bg-orange-100 text-orange-700",
};

type FormData = { name: string; type: ResourceType; stockQuantity: string };

function ResourceForm({ initial, onSubmit, onClose }: {
  initial?: Partial<FormData>;
  onSubmit: (d: FormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>({
    name: initial?.name ?? "",
    type: initial?.type ?? "FERTILIZER",
    stockQuantity: initial?.stockQuantity ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: keyof FormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nameValid = validateStringLength(form.name, 1, 100, "Resource name");
    if (!nameValid.valid) newErrors.name = nameValid.error!;
    const qty = Number(form.stockQuantity);
    const qtyValid = validateNumberRange(qty, 0, 1000000, "Stock quantity");
    if (!qtyValid.valid) newErrors.stockQuantity = qtyValid.error!;
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
          placeholder="e.g. NPK Fertilizer" />
        {errors.name && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Type *</label>
        <select value={form.type} onChange={(e) => set("type", e.target.value)}
          className="input">
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Stock Quantity *</label>
        <input required type="number" min={0} value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)}
          className={`input ${errors.stockQuantity ? "input-error" : ""}`}
          placeholder="e.g. 100" />
        {errors.stockQuantity && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.stockQuantity}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          Save
        </button>
      </div>
    </form>
  );
}

function AdjustStockModal({ resource, onAdjust, onClose }: {
  resource: Resource;
  onAdjust: (delta: number) => void;
  onClose: () => void;
}) {
  const [delta, setDelta] = useState("0");
  const numDelta = Number(delta);
  const preview = resource.stockQuantity + numDelta;

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Current stock: <strong style={{ color: "var(--text-primary)" }}>{resource.stockQuantity}</strong> units</p>
      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Adjustment (+ add / - deduct)</label>
        <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)}
          className="input" />
      </div>
      <p className={`text-sm ${preview < 0 ? "text-rose-600 dark:text-rose-400" : ""}`} style={preview >= 0 ? { color: "var(--text-secondary)" } : undefined}>
        Result: <strong>{preview}</strong> units {preview < 0 && "(invalid)"}
      </p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button
          disabled={preview < 0 || numDelta === 0}
          onClick={() => { onAdjust(numDelta); onClose(); }}
          className="btn btn-primary disabled:opacity-40">
          Apply
        </button>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const { resources, createResource, updateResource, deleteResource, adjustStock } = useData();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Resource | null>(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<Resource>>>(new Map());

  // Memoized filtered data
  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "ALL" || r.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [resources, search, typeFilter]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    itemsPerPage,
    setPage,
    setItemsPerPage,
  } = usePagination(filtered, { initialPage: 1, itemsPerPage: 10 });

  function handleCreate(form: FormData) {
    const qty = Number(form.stockQuantity);
    if (qty < 0) { addToast("Stock cannot be negative", "error"); return; }
    createResource({ name: form.name, type: form.type, stockQuantity: qty });
    addToast("Resource created", "success");
    setCreateOpen(false);
  }

  function handleEdit(form: FormData) {
    if (!editTarget) return;
    // Optimistic update
    setOptimisticUpdates(prev => new Map(prev.set(editTarget._id, { name: form.name, stockQuantity: Number(form.stockQuantity) })));
    updateResource(editTarget._id, { name: form.name, stockQuantity: Number(form.stockQuantity) });
    addToast("Resource updated", "success");
    setEditTarget(null);
    setTimeout(() => {
      setOptimisticUpdates(prev => { const m = new Map(prev); m.delete(editTarget._id); return m; });
    }, 1000);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const err = await deleteResource(deleteTarget._id);
    if (err) { addToast(err, "error"); return; }
    addToast("Resource deleted", "success");
  }

  async function handleAdjust(delta: number) {
    if (!adjustTarget) return;
    const err = await adjustStock(adjustTarget._id, delta);
    if (err) { addToast(err, "error"); return; }
    addToast(`Stock ${delta >= 0 ? "added" : "deducted"}`, "success");
  }

  // Bulk operations
  function toggleResourceSelection(id: string) {
    setSelectedResources(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function toggleSelectAll() {
    if (selectedResources.size === paginatedData.items.length) {
      setSelectedResources(new Set());
    } else {
      setSelectedResources(new Set(paginatedData.items.map(r => r._id)));
    }
  }

  async function handleBulkDelete() {
    const errors: string[] = [];
    for (const id of selectedResources) {
      const err = await deleteResource(id);
      if (err) errors.push(err);
    }
    if (errors.length > 0) {
      addToast(`Some resources couldn't be deleted. ${errors[0]}`, "error");
    } else {
      addToast(`Deleted ${selectedResources.size} resources`, "success");
    }
    setSelectedResources(new Set());
    setBulkSelectMode(false);
  }

  // CSV Export
  function handleExport() {
    const headers = ["Name", "Type", "Stock Quantity", "Status"];
    const rows = filtered.map(r => [
      r.name,
      r.type,
      r.stockQuantity.toString(),
      r.stockQuantity === 0 ? "Out of Stock" : r.stockQuantity < 50 ? "Low Stock" : "In Stock"
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resources_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Resources exported to CSV", "success");
  }

  const outOfStock = resources.filter((r) => r.stockQuantity === 0).length;
  const lowStock = resources.filter((r) => r.stockQuantity > 0 && r.stockQuantity < 50).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">Resources</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {filtered.length} of {resources.length} resources
            {bulkSelectMode && selectedResources.size > 0 && ` • ${selectedResources.size} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => { setBulkSelectMode(!bulkSelectMode); setSelectedResources(new Set()); }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${
              bulkSelectMode
                ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700"
                : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
            }`}>
            <Users size={16} /> {bulkSelectMode ? "Cancel" : "Bulk Edit"}
          </button>
          <button onClick={() => setCreateOpen(true)} className="btn btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Resource
          </button>
        </div>
      </div>

      {/* Warnings */}
      {(outOfStock > 0 || lowStock > 0) && (
        <div className="flex gap-3 flex-wrap">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle size={14} /> {outOfStock} resource(s) out of stock
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg px-3 py-2 text-sm text-yellow-700 dark:text-yellow-300">
              <AlertTriangle size={14} /> {lowStock} resource(s) running low
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {bulkSelectMode && selectedResources.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedResources.size} resources selected
            </span>
            <button onClick={handleBulkDelete}
              className="px-3 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-700">
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchBar
          placeholder="Search resources by name..."
          onSearch={setSearch}
          delay={300}
          className="flex-1 min-w-48"
        />
        <div className="flex gap-1">
          {(["ALL", ...TYPES] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                typeFilter === t
                  ? "bg-green-600 text-white"
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-hover)" }}>
              {bulkSelectMode && (
                <th className="px-5 py-3.5">
                  <input type="checkbox"
                    checked={selectedResources.size === paginatedData.items.length && paginatedData.items.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                </th>
              )}
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Name</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Type</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Stock</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.length === 0 && (
              <tr><td colSpan={bulkSelectMode ? 6 : 5} className="text-center py-10" style={{ color: "var(--text-muted)" }}>No resources found</td></tr>
            )}
            {paginatedData.items.map((r) => {
              const optimistic = optimisticUpdates.get(r._id);
              const displayName = optimistic?.name ?? r.name;
              const displayStock = optimistic?.stockQuantity ?? r.stockQuantity;
              const status = displayStock === 0 ? "OUT" : displayStock < 50 ? "LOW" : "OK";
              return (
                <tr key={r._id} className={`table-row ${optimistic ? "ring-1 ring-inset ring-green-200 dark:ring-green-700" : ""}`} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  {bulkSelectMode && (
                    <td className="px-5 py-4">
                      <input type="checkbox" checked={selectedResources.has(r._id)} onChange={() => toggleResourceSelection(r._id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    </td>
                  )}
                  <td className="px-5 py-4 font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <FlaskConical size={15} className="text-green-600 flex-shrink-0" />
                    {displayName}
                    {optimistic && <Check size={12} className="text-green-600" />}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[r.type]}`}>{r.type}</span>
                  </td>
                  <td className="px-5 py-4 font-semibold" style={{ color: "var(--text-primary)" }}>{displayStock.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === "OUT" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : status === "LOW" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"}`}>
                      {status === "OUT" ? "Out of Stock" : status === "LOW" ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setAdjustTarget(r)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all" title="Adjust stock">
                        {r.stockQuantity > 0 ? <Minus size={15} /> : <Plus size={15} />}
                      </button>
                      <button onClick={() => setEditTarget(r)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(r)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Resource">
        <ResourceForm onSubmit={handleCreate} onClose={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Resource">
        {editTarget && (
          <ResourceForm
            initial={{ name: editTarget.name, type: editTarget.type, stockQuantity: String(editTarget.stockQuantity) }}
            onSubmit={handleEdit}
            onClose={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <Modal open={!!adjustTarget} onClose={() => setAdjustTarget(null)} title={`Adjust Stock — ${adjustTarget?.name}`}>
        {adjustTarget && (
          <AdjustStockModal resource={adjustTarget} onAdjust={handleAdjust} onClose={() => setAdjustTarget(null)} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Resource"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}

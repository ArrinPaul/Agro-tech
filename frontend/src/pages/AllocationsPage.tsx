import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlertTriangle, CheckCircle, Eye, Download, Users } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";
import { usePagination } from "../hooks/usePagination";
import { validateNumberRange } from "../utils/security";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import type { Allocation } from "../types";

function NewAllocationForm({ onClose }: { onClose: () => void }) {
  const { crops, warehouses, cropResources, resources, allocate } = useData();
  const { addToast } = useToast();
  const [cropId, setCropId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCrop = crops.find((c) => c._id === cropId);
  const selectedWarehouse = warehouses.find((w) => w._id === warehouseId);
  const qty = Number(quantity);

  const remainingCapacity = selectedWarehouse
    ? selectedWarehouse.totalCapacity - selectedWarehouse.usedCapacity
    : null;

  const resourceChecks = selectedCrop
    ? cropResources
      .filter((cr) => cr.cropId === selectedCrop._id)
      .map((cr) => {
        const res = resources.find((r) => r._id === cr.resourceId);
        const needed = cr.requiredQuantity * qty;
        return { name: res?.name ?? cr.resourceId, needed, available: res?.stockQuantity ?? 0, ok: (res?.stockQuantity ?? 0) >= needed };
      })
    : [];

  const capacityOk = remainingCapacity !== null && qty > 0 && qty <= remainingCapacity;
  const resourcesOk = resourceChecks.every((r) => r.ok);
  const canSubmit = cropId && warehouseId && qty > 0 && capacityOk && resourcesOk;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!cropId) newErrors.crop = "Select a crop";
    if (!warehouseId) newErrors.warehouse = "Select a warehouse";
    const qtyValid = validateNumberRange(qty, 1, 1000000, "Quantity");
    if (!qtyValid.valid) newErrors.quantity = qtyValid.error!;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const err = await allocate(cropId, warehouseId, qty);
      if (err) { addToast(err, "error"); return; }
      addToast("Allocation created successfully", "success");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Select Crop *</label>
        <select required value={cropId} onChange={(e) => { setCropId(e.target.value); if (errors.crop) setErrors(p => ({ ...p, crop: "" })); }}
          className="input">
          <option value="">Choose a crop…</option>
          {crops.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.quantity} units, {c.status})</option>)}
        </select>
        {errors.crop && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.crop}</p>}
      </div>

      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Select Warehouse *</label>
        <select required value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); if (errors.warehouse) setErrors(p => ({ ...p, warehouse: "" })); }}
          className="input">
          <option value="">Choose a warehouse…</option>
          {warehouses.map((w) => {
            const avail = w.totalCapacity - w.usedCapacity;
            const pct = w.totalCapacity > 0 ? Math.round((w.usedCapacity / w.totalCapacity) * 100) : 0;
            return (
              <option key={w._id} value={w._id}>
                {w.name} — {avail} units free ({pct}% used)
              </option>
            );
          })}
        </select>
        {errors.warehouse && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.warehouse}</p>}
        {selectedWarehouse && (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Available: <strong>{remainingCapacity?.toLocaleString()}</strong> units
          </p>
        )}
      </div>

      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Quantity *</label>
        <input required type="number" min={1} value={quantity} onChange={(e) => { setQuantity(e.target.value); if (errors.quantity) setErrors(p => ({ ...p, quantity: "" })); }}
          className={`input ${errors.quantity ? "input-error" : ""}`}
          placeholder="Enter quantity to allocate" />
        {errors.quantity && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.quantity}</p>}
      </div>

      {/* Capacity check */}
      {selectedWarehouse && qty > 0 && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${capacityOk ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>
          {capacityOk ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {capacityOk
            ? `Capacity OK — ${remainingCapacity! - qty} units will remain`
            : `Insufficient capacity — only ${remainingCapacity} units available`}
        </div>
      )}

      {/* Resource checks */}
      {resourceChecks.length > 0 && qty > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Resource requirements:</p>
          {resourceChecks.map((rc) => (
            <div key={rc.name} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${rc.ok ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>
              <span className="flex items-center gap-1.5">
                {rc.ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                {rc.name}
              </span>
              <span>Need {rc.needed} / Have {rc.available}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={!canSubmit || isSubmitting}
          className="btn btn-primary disabled:opacity-40 flex items-center gap-2">
          {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          Allocate
        </button>
      </div>
    </form>
  );
}

export default function AllocationsPage() {
  const { allocations, deallocate } = useData();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deallocateTarget, setDeallocateTarget] = useState<Allocation | null>(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState<Set<string>>(new Set());

  // Memoized filtered + sorted
  const sorted = useMemo(() => {
    const filtered = allocations.filter((a) =>
      !search ||
      (a.cropName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.warehouseName ?? "").toLowerCase().includes(search.toLowerCase())
    );
    return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
  }, [allocations, search]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    itemsPerPage,
    setPage,
    setItemsPerPage,
  } = usePagination(sorted, { initialPage: 1, itemsPerPage: 10 });

  function handleDeallocate() {
    if (!deallocateTarget) return;
    deallocate(deallocateTarget._id);
    addToast("Allocation removed", "info");
  }

  // Bulk operations
  function toggleSelection(id: string) {
    setSelectedAllocations(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function toggleSelectAll() {
    if (selectedAllocations.size === paginatedData.items.length) {
      setSelectedAllocations(new Set());
    } else {
      setSelectedAllocations(new Set(paginatedData.items.map(a => a._id)));
    }
  }

  function handleBulkDeallocate() {
    selectedAllocations.forEach(id => deallocate(id));
    addToast(`Deallocated ${selectedAllocations.size} allocations`, "info");
    setSelectedAllocations(new Set());
    setBulkSelectMode(false);
  }

  // CSV Export
  function handleExport() {
    const headers = ["Crop", "Warehouse", "Quantity", "Allocated By", "Date"];
    const rows = sorted.map(a => [
      a.cropName ?? a.cropId,
      a.warehouseName ?? a.warehouseId,
      a.allocatedQuantity.toString(),
      a.createdByName ?? a.createdBy,
      new Date(a.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `allocations_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Allocations exported to CSV", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">Allocations</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {sorted.length} of {allocations.length} allocations
            {bulkSelectMode && selectedAllocations.size > 0 && ` • ${selectedAllocations.size} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => { setBulkSelectMode(!bulkSelectMode); setSelectedAllocations(new Set()); }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${
              bulkSelectMode
                ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700"
                : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
            }`}>
            <Users size={16} /> {bulkSelectMode ? "Cancel" : "Bulk Edit"}
          </button>
          <button onClick={() => setCreateOpen(true)} className="btn btn-primary flex items-center gap-2">
            <Plus size={16} /> New Allocation
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkSelectMode && selectedAllocations.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedAllocations.size} allocations selected
            </span>
            <button onClick={handleBulkDeallocate}
              className="px-3 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-700">
              Deallocate All
            </button>
          </div>
        </div>
      )}

      <SearchBar
        placeholder="Search by crop or warehouse…"
        onSearch={setSearch}
        delay={300}
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-hover)" }}>
              {bulkSelectMode && (
                <th className="px-5 py-3.5">
                  <input type="checkbox"
                    checked={selectedAllocations.size === paginatedData.items.length && paginatedData.items.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                </th>
              )}
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Crop</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Warehouse</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Quantity</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Allocated By</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Date</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.length === 0 && (
              <tr><td colSpan={bulkSelectMode ? 7 : 6} className="text-center py-10" style={{ color: "var(--text-muted)" }}>No allocations found</td></tr>
            )}
            {paginatedData.items.map((a) => (
              <tr key={a._id} className="table-row" style={{ borderBottom: "1px solid var(--border-light)" }}>
                {bulkSelectMode && (
                  <td className="px-5 py-4">
                    <input type="checkbox" checked={selectedAllocations.has(a._id)} onChange={() => toggleSelection(a._id)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  </td>
                )}
                <td className="px-5 py-4 font-medium" style={{ color: "var(--text-primary)" }}>
                  <button onClick={() => navigate(`/allocations/${a._id}`)} className="text-green-700 dark:text-green-400 hover:underline">{a.cropName ?? a.cropId}</button>
                </td>
                <td className="px-5 py-4" style={{ color: "var(--text-secondary)" }}>{a.warehouseName ?? a.warehouseId}</td>
                <td className="px-5 py-4 font-semibold" style={{ color: "var(--text-primary)" }}>{a.allocatedQuantity.toLocaleString()}</td>
                <td className="px-5 py-4" style={{ color: "var(--text-muted)" }}>{a.createdByName ?? a.createdBy}</td>
                <td className="px-5 py-4" style={{ color: "var(--text-muted)" }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => navigate(`/allocations/${a._id}`)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all" title="View details"><Eye size={15} /></button>
                    <button onClick={() => setDeallocateTarget(a)} className="btn-ghost p-1.5 rounded-lg text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-all">
                      Deallocate
                    </button>
                  </div>
                </td>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Allocation">
        <NewAllocationForm onClose={() => setCreateOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deallocateTarget}
        onClose={() => setDeallocateTarget(null)}
        onConfirm={handleDeallocate}
        title="Deallocate"
        message={`Remove allocation of ${deallocateTarget?.allocatedQuantity} units of "${deallocateTarget?.cropName}" from "${deallocateTarget?.warehouseName}"? Resources will be restored.`}
      />
    </div>
  );
}

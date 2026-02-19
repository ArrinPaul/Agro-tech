import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, ChevronDown, Eye, Download, Check, Users } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";
import { usePagination } from "../hooks/usePagination";
import { validateStringLength, validateNumberRange } from "../utils/security";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import type { Crop, CropStatus, Resource, CropResource } from "../types";

const STATUSES: CropStatus[] = ["PLANTED", "GROWING", "HARVESTED", "STORED"];
const STATUS_COLORS: Record<CropStatus, string> = {
  PLANTED: "bg-green-100 text-green-700",
  GROWING: "bg-blue-100 text-blue-700",
  HARVESTED: "bg-amber-100 text-amber-700",
  STORED: "bg-purple-100 text-purple-700",
};

type FormData = { name: string; quantity: string };

function CropForm({ initial, onSubmit, onClose }: {
  initial?: Partial<FormData>;
  onSubmit: (d: FormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>({ name: initial?.name ?? "", quantity: initial?.quantity ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const set = (k: keyof FormData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    // Clear error when user starts typing
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate name
    const nameValid = validateStringLength(form.name, 1, 100, "Crop name");
    if (!nameValid.valid) newErrors.name = nameValid.error!;
    
    // Validate quantity
    const qty = Number(form.quantity);
    const qtyValid = validateNumberRange(qty, 1, 1000000, "Quantity");
    if (!qtyValid.valid) newErrors.quantity = qtyValid.error!;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Crop Name *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)}
          className={`input ${errors.name ? "input-error" : ""}`}
          placeholder="e.g. Wheat" />
        {errors.name && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Quantity (units) *</label>
        <input required type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)}
          className={`input ${errors.quantity ? "input-error" : ""}`}
          placeholder="e.g. 500" />
        {errors.quantity && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.quantity}</p>}
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

function ResourceLinkPanel({ crop, resources, cropResources, onLink, onUnlink }: {
  crop: Crop;
  resources: Resource[];
  cropResources: CropResource[];
  onLink: (resourceId: string, qty: number) => void;
  onUnlink: (resourceId: string) => void;
}) {
  const linked = cropResources.filter((cr) => cr.cropId === crop._id);
  const linkedIds = new Set(linked.map((cr) => cr.resourceId));
  const [selRes, setSelRes] = useState("");
  const [qty, setQty] = useState("1");

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Manage resource requirements for <strong>{crop.name}</strong>.</p>
      {linked.length === 0 ? (
        <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No resources linked yet.</p>
      ) : (
        <div className="space-y-2">
          {linked.map((cr) => {
            const res = resources.find((r) => r._id === cr.resourceId);
            return (
              <div key={cr._id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--surface-hover)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{res?.name ?? cr.resourceId}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{cr.requiredQuantity} units / allocation unit</p>
                </div>
                <button onClick={() => onUnlink(cr.resourceId)} className="text-xs text-rose-500 hover:text-rose-700">Unlink</button>
              </div>
            );
          })}
        </div>
      )}
      <div className="pt-3" style={{ borderTop: "1px solid var(--border-light)" }}>
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Link a resource</p>
        <div className="flex gap-2">
          <select value={selRes} onChange={(e) => setSelRes(e.target.value)}
            className="input flex-1">
            <option value="">Select resource…</option>
            {resources.filter((r) => !linkedIds.has(r._id)).map((r) => (
              <option key={r._id} value={r._id}>{r.name} ({r.type})</option>
            ))}
          </select>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)}
            className="input w-20"
            placeholder="qty" />
          <button disabled={!selRes} onClick={() => { onLink(selRes, Number(qty)); setSelRes(""); setQty("1"); }}
            className="btn btn-primary disabled:opacity-40">
            Link
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CropsPage() {
  const { crops, resources, cropResources, createCrop, updateCrop, deleteCrop, linkResource, unlinkResource } = useData();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CropStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Crop | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Crop | null>(null);
  const [resourcesTarget, setResourcesTarget] = useState<Crop | null>(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState<Set<string>>(new Set());
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<Crop>>>(new Map());

  // Memoized filtered data
  const filtered = useMemo(() => {
    return crops.filter((c) => {
      const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [crops, searchQuery, statusFilter]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    itemsPerPage,
    setPage,
    setItemsPerPage,
  } = usePagination(filtered, { initialPage: 1, itemsPerPage: 10 });

  function handleCreate(form: FormData) {
    const qty = Number(form.quantity);
    if (qty <= 0) { addToast("Quantity must be > 0", "error"); return; }
    createCrop({ name: form.name, quantity: qty });
    addToast("Crop created", "success");
    setCreateOpen(false);
  }

  function handleEdit(form: FormData) {
    if (!editTarget) return;
    const qty = Number(form.quantity);
    if (qty <= 0) { addToast("Quantity must be > 0", "error"); return; }
    updateCrop(editTarget._id, { name: form.name, quantity: qty });
    addToast("Crop updated", "success");
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const err = await deleteCrop(deleteTarget._id);
    if (err) { addToast(err, "error"); return; }
    addToast("Crop deleted", "success");
  }

  // Optimistic UI update for status changes
  function handleStatusChange(cropId: string, status: CropStatus) {
    // Apply optimistic update
    setOptimisticUpdates(prev => new Map(prev.set(cropId, { status })));
    
    // Perform actual update
    updateCrop(cropId, { status });
    addToast("Status updated", "success");
    
    // Clear optimistic update after a delay
    setTimeout(() => {
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(cropId);
        return newMap;
      });
    }, 1000);
  }

  // Bulk operations
  function toggleCropSelection(cropId: string) {
    setSelectedCrops(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cropId)) {
        newSet.delete(cropId);
      } else {
        newSet.add(cropId);
      }
      return newSet;
    });
  }

  function toggleSelectAll() {
    if (selectedCrops.size === paginatedData.items.length) {
      setSelectedCrops(new Set());
    } else {
      setSelectedCrops(new Set(paginatedData.items.map(c => c._id)));
    }
  }

  function handleBulkStatusUpdate(status: CropStatus) {
    selectedCrops.forEach(cropId => {
      updateCrop(cropId, { status });
    });
    addToast(`Updated ${selectedCrops.size} crops`, "success");
    setSelectedCrops(new Set());
    setBulkSelectMode(false);
  }

  async function handleBulkDelete() {
    const errors: string[] = [];
    for (const cropId of selectedCrops) {
      const err = await deleteCrop(cropId);
      if (err) errors.push(err);
    }
    
    if (errors.length > 0) {
      addToast(`Some crops couldn deleting. ${errors[0]}`, "error");
    } else {
      addToast(`Deleted ${selectedCrops.size} crops`, "success");
    }
    
    setSelectedCrops(new Set());
    setBulkSelectMode(false);
  }

  // CSV Export
  function handleExport() {
    const headers = ["Name", "Quantity", "Status", "Created", "Resources"];
    const rows = filtered.map(c => [
      c.name,
      c.quantity.toString(),
      c.status,
      new Date(c.createdAt).toLocaleDateString(),
      cropResources.filter(cr => cr.cropId === c._id).length.toString()
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crops_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Crops exported to CSV", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">Crops</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {filtered.length} of {crops.length} crops
            {bulkSelectMode && selectedCrops.size > 0 && ` • ${selectedCrops.size} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
          <button 
            onClick={() => setBulkSelectMode(!bulkSelectMode)} 
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${ 
              bulkSelectMode 
                ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700" 
                : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
            }`}
          >
            <Users size={16} /> {bulkSelectMode ? "Cancel" : "Bulk Edit"}
          </button>
          <button onClick={() => setCreateOpen(true)} className="btn btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Crop
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkSelectMode && selectedCrops.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedCrops.size} crops selected
            </span>
            <div className="flex gap-2">
              {["PLANTED", "GROWING", "HARVESTED", "STORED"].map(status => (
                <button
                  key={status}
                  onClick={() => handleBulkStatusUpdate(status as CropStatus)}
                  className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700"
                >
                  Set {status}
                </button>
              ))}
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchBar
          placeholder="Search crops by name..."
          onSearch={setSearchQuery}
          delay={300}
          className="flex-1 min-w-48"
        />
        <div className="flex gap-1">
          {(["ALL", ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === s 
                  ? "bg-[var(--brand-600)] text-white" 
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              }`}>
              {s}
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
                  <input 
                    type="checkbox" 
                    checked={selectedCrops.size === paginatedData.items.length && paginatedData.items.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[var(--border)] text-[var(--brand-600)] focus:ring-[var(--brand-500)]"
                  />
                </th>
              )}
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Name</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Quantity</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Resources</th>
              <th className="text-left px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Created</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.length === 0 && (
              <tr><td colSpan={bulkSelectMode ? 7 : 6} className="text-center py-10" style={{ color: "var(--text-muted)" }}>No crops found</td></tr>
            )}
            {paginatedData.items.map((c) => {
              const linkedCount = cropResources.filter((cr) => cr.cropId === c._id).length;
              const optimisticUpdate = optimisticUpdates.get(c._id);
              const displayStatus = optimisticUpdate?.status || c.status;
              
              return (
                <tr key={c._id} className="table-row" style={{ borderBottom: "1px solid var(--border-light)" }}>
                  {bulkSelectMode && (
                    <td className="px-5 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedCrops.has(c._id)}
                        onChange={() => toggleCropSelection(c._id)}
                        className="rounded border-[var(--border)] text-[var(--brand-600)] focus:ring-[var(--brand-500)]"
                      />
                    </td>
                  )}
                  <td className="px-5 py-4 font-medium" style={{ color: "var(--text-primary)" }}>
                    <button onClick={() => navigate(`/crops/${c._id}`)} className="text-[var(--brand-700)] hover:underline">{c.name}</button>
                  </td>
                  <td className="px-5 py-4" style={{ color: "var(--text-secondary)" }}>{c.quantity.toLocaleString()} units</td>
                  <td className="px-5 py-4">
                    <div className="relative inline-block">
                      <select value={displayStatus} onChange={(e) => handleStatusChange(c._id, e.target.value as CropStatus)}
                        className={`appearance-none pr-6 pl-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[displayStatus]} ${
                          optimisticUpdate ? 'ring-2 ring-green-300' : ''
                        }`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      {optimisticUpdate && <Check size={12} className="absolute -right-2 -top-2 text-[var(--brand-600)]" />}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => setResourcesTarget(c)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      {linkedCount} linked
                    </button>
                  </td>
                  <td className="px-5 py-4" style={{ color: "var(--text-muted)" }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => navigate(`/crops/${c._id}`)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all" title="View details"><Eye size={15} /></button>
                      <button onClick={() => setEditTarget(c)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(c)} className="btn-ghost p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"><Trash2 size={15} /></button>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Crop">
        <CropForm onSubmit={handleCreate} onClose={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Crop">
        {editTarget && (
          <CropForm
            initial={{ name: editTarget.name, quantity: String(editTarget.quantity) }}
            onSubmit={handleEdit}
            onClose={() => setEditTarget(null)}
          />
        )}
      </Modal>

      <Modal open={!!resourcesTarget} onClose={() => setResourcesTarget(null)} title="Manage Resources">
        {resourcesTarget && (
          <ResourceLinkPanel
            crop={resourcesTarget}
            resources={resources}
            cropResources={cropResources}
            onLink={(resourceId, qty) => { linkResource(resourcesTarget._id, resourceId, qty); addToast("Resource linked", "success"); }}
            onUnlink={(resourceId) => { unlinkResource(resourcesTarget._id, resourceId); addToast("Resource unlinked", "info"); }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Crop"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}

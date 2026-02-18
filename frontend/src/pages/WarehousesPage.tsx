import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, MapPin, Package } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";
import type { Warehouse } from "../types";

function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color = pct > 95 ? "bg-red-500" : pct > 80 ? "bg-amber-400" : "bg-green-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{used} / {total} units</span>
        <span className={`font-medium ${pct > 95 ? "text-red-600" : pct > 80 ? "text-amber-600" : "text-green-600"}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
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
  const set = (k: keyof FormData, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. Central Silo A" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
        <input required value={form.location} onChange={(e) => set("location", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. North Field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Total Capacity (units) *</label>
        <input required type="number" min={1} value={form.totalCapacity} onChange={(e) => set("totalCapacity", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. 1000" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Save</button>
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
    nextPage,
    prevPage,
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

  function handleDelete() {
    if (!deleteTarget) return;
    const err = deleteWarehouse(deleteTarget._id);
    if (err) { addToast(err, "error"); return; }
    addToast("Warehouse deleted", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Warehouses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {filtered.length} of {warehouses.length} warehouses
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
          <Plus size={16} /> Add Warehouse
        </button>
      </div>

      {/* Search */}
      <SearchBar
        placeholder="Search warehouses by name or location..."
        onSearch={setSearchQuery}
        delay={300}
      />

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-300">Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-300">Location</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-300 w-56">Capacity</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-300">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 dark:text-gray-500">No warehouses found</td></tr>
            )}
            {paginatedData.items.map((w) => (
              <tr key={w._id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package size={15} className="text-green-600 flex-shrink-0" />
                  {w.name}
                </td>
                <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1"><MapPin size={13} />{w.location}</span>
                </td>
                <td className="px-5 py-4 w-56">
                  <CapacityBar used={w.usedCapacity} total={w.totalCapacity} />
                </td>
                <td className="px-5 py-4 text-gray-400 dark:text-gray-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setEditTarget(w)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteTarget(w)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg"><Trash2 size={15} /></button>
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

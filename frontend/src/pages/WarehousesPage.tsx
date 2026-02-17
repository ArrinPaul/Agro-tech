import { useState } from "react";
import { Plus, Pencil, Trash2, Search, MapPin, Package } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
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
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const filtered = warehouses.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.location.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{warehouses.length} total warehouses</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
          <Plus size={16} /> Add Warehouse
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Search warehouses…" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Location</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 w-56">Capacity</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">No warehouses found</td></tr>
            )}
            {filtered.map((w) => (
              <tr key={w._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4 font-medium text-gray-900 flex items-center gap-2">
                  <Package size={15} className="text-green-600 flex-shrink-0" />
                  {w.name}
                </td>
                <td className="px-5 py-4 text-gray-600">
                  <span className="flex items-center gap-1"><MapPin size={13} />{w.location}</span>
                </td>
                <td className="px-5 py-4 w-56">
                  <CapacityBar used={w.usedCapacity} total={w.totalCapacity} />
                </td>
                <td className="px-5 py-4 text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setEditTarget(w)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteTarget(w)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Minus, FlaskConical, AlertTriangle } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
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
  const set = (k: keyof FormData, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. NPK Fertilizer" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
        <select value={form.type} onChange={(e) => set("type", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
        <input required type="number" min={0} value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. 100" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Save</button>
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
      <p className="text-sm text-gray-600">Current stock: <strong>{resource.stockQuantity}</strong> units</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment (+ add / - deduct)</label>
        <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <p className={`text-sm ${preview < 0 ? "text-red-600" : "text-gray-600"}`}>
        Result: <strong>{preview}</strong> units {preview < 0 && "(invalid)"}
      </p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button
          disabled={preview < 0 || numDelta === 0}
          onClick={() => { onAdjust(numDelta); onClose(); }}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40">
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

  const filtered = resources.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  function handleCreate(form: FormData) {
    const qty = Number(form.stockQuantity);
    if (qty < 0) { addToast("Stock cannot be negative", "error"); return; }
    createResource({ name: form.name, type: form.type, stockQuantity: qty });
    addToast("Resource created", "success");
    setCreateOpen(false);
  }

  function handleEdit(form: FormData) {
    if (!editTarget) return;
    updateResource(editTarget._id, { name: form.name, stockQuantity: Number(form.stockQuantity) });
    addToast("Resource updated", "success");
    setEditTarget(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const err = deleteResource(deleteTarget._id);
    if (err) { addToast(err, "error"); return; }
    addToast("Resource deleted", "success");
  }

  function handleAdjust(delta: number) {
    if (!adjustTarget) return;
    const err = adjustStock(adjustTarget._id, delta);
    if (err) { addToast(err, "error"); return; }
    addToast(`Stock ${delta >= 0 ? "added" : "deducted"}`, "success");
  }

  const outOfStock = resources.filter((r) => r.stockQuantity === 0).length;
  const lowStock = resources.filter((r) => r.stockQuantity > 0 && r.stockQuantity < 50).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
          <p className="text-sm text-gray-500 mt-0.5">{resources.length} total resources</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
          <Plus size={16} /> Add Resource
        </button>
      </div>

      {/* Warnings */}
      {(outOfStock > 0 || lowStock > 0) && (
        <div className="flex gap-3 flex-wrap">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              <AlertTriangle size={14} /> {outOfStock} resource(s) out of stock
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-700">
              <AlertTriangle size={14} /> {lowStock} resource(s) running low
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Search resources…" />
        </div>
        <div className="flex gap-1">
          {(["ALL", ...TYPES] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${typeFilter === t ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">No resources found</td></tr>
            )}
            {filtered.map((r) => {
              const status = r.stockQuantity === 0 ? "OUT" : r.stockQuantity < 50 ? "LOW" : "OK";
              return (
                <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <FlaskConical size={15} className="text-green-600 flex-shrink-0" />
                    {r.name}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[r.type]}`}>{r.type}</span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{r.stockQuantity.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === "OUT" ? "bg-red-100 text-red-700" : status === "LOW" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {status === "OUT" ? "Out of Stock" : status === "LOW" ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setAdjustTarget(r)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Adjust stock">
                        {r.stockQuantity > 0 ? <Minus size={15} /> : <Plus size={15} />}
                      </button>
                      <button onClick={() => setEditTarget(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

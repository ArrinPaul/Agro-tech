import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, ChevronDown, Eye } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
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
  const set = (k: keyof FormData, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. Wheat" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (units) *</label>
        <input required type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. 500" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Save</button>
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
      <p className="text-sm text-gray-600">Manage resource requirements for <strong>{crop.name}</strong>.</p>
      {linked.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No resources linked yet.</p>
      ) : (
        <div className="space-y-2">
          {linked.map((cr) => {
            const res = resources.find((r) => r._id === cr.resourceId);
            return (
              <div key={cr._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{res?.name ?? cr.resourceId}</p>
                  <p className="text-xs text-gray-500">{cr.requiredQuantity} units / allocation unit</p>
                </div>
                <button onClick={() => onUnlink(cr.resourceId)} className="text-red-500 hover:text-red-700 text-xs">Unlink</button>
              </div>
            );
          })}
        </div>
      )}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-medium text-gray-600 mb-2">Link a resource</p>
        <div className="flex gap-2">
          <select value={selRes} onChange={(e) => setSelRes(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Select resource…</option>
            {resources.filter((r) => !linkedIds.has(r._id)).map((r) => (
              <option key={r._id} value={r._id}>{r.name} ({r.type})</option>
            ))}
          </select>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="qty" />
          <button disabled={!selRes} onClick={() => { onLink(selRes, Number(qty)); setSelRes(""); setQty("1"); }}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-40">
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CropStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Crop | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Crop | null>(null);
  const [resourcesTarget, setResourcesTarget] = useState<Crop | null>(null);

  const filtered = crops.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

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

  function handleDelete() {
    if (!deleteTarget) return;
    const err = deleteCrop(deleteTarget._id);
    if (err) { addToast(err, "error"); return; }
    addToast("Crop deleted", "success");
  }

  function handleStatusChange(cropId: string, status: CropStatus) {
    updateCrop(cropId, { status });
    addToast("Status updated", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crops</h1>
          <p className="text-sm text-gray-500 mt-0.5">{crops.length} total crops</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
          <Plus size={16} /> Add Crop
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Search crops…" />
        </div>
        <div className="flex gap-1">
          {(["ALL", ...STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {s}
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
              <th className="text-left px-5 py-3 font-medium text-gray-600">Quantity</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Resources</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No crops found</td></tr>
            )}
            {filtered.map((c) => {
              const linkedCount = cropResources.filter((cr) => cr.cropId === c._id).length;
              return (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">
                    <button onClick={() => navigate(`/crops/${c._id}`)} className="text-green-700 hover:underline">{c.name}</button>
                  </td>
                  <td className="px-5 py-4 text-gray-700">{c.quantity.toLocaleString()} units</td>
                  <td className="px-5 py-4">
                    <div className="relative inline-block">
                      <select value={c.status} onChange={(e) => handleStatusChange(c._id, e.target.value as CropStatus)}
                        className={`appearance-none pr-6 pl-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[c.status]}`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => setResourcesTarget(c)} className="text-xs text-blue-600 hover:underline">
                      {linkedCount} linked
                    </button>
                  </td>
                  <td className="px-5 py-4 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => navigate(`/crops/${c._id}`)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="View details"><Eye size={15} /></button>
                      <button onClick={() => setEditTarget(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

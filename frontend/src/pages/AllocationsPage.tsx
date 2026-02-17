import { useState } from "react";
import { Plus, Search, AlertTriangle, CheckCircle } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import type { Allocation } from "../types";

function NewAllocationForm({ onClose }: { onClose: () => void }) {
  const { crops, warehouses, cropResources, resources, allocate } = useData();
  const { addToast } = useToast();
  const [cropId, setCropId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");

  const selectedCrop = crops.find((c) => c._id === cropId);
  const selectedWarehouse = warehouses.find((w) => w._id === warehouseId);
  const qty = Number(quantity);

  // Preflight checks
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = allocate(cropId, warehouseId, qty);
    if (err) { addToast(err, "error"); return; }
    addToast("Allocation created successfully", "success");
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Crop *</label>
        <select required value={cropId} onChange={(e) => setCropId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Choose a crop…</option>
          {crops.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.quantity} units, {c.status})</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Warehouse *</label>
        <select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
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
        {selectedWarehouse && (
          <p className="text-xs text-gray-500 mt-1">
            Available: <strong>{remainingCapacity?.toLocaleString()}</strong> units
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
        <input required type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Enter quantity to allocate" />
      </div>

      {/* Capacity check */}
      {selectedWarehouse && qty > 0 && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${capacityOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {capacityOk ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {capacityOk
            ? `Capacity OK — ${remainingCapacity! - qty} units will remain`
            : `Insufficient capacity — only ${remainingCapacity} units available`}
        </div>
      )}

      {/* Resource checks */}
      {resourceChecks.length > 0 && qty > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600">Resource requirements:</p>
          {resourceChecks.map((rc) => (
            <div key={rc.name} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${rc.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
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
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button type="submit" disabled={!canSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40">
          Allocate
        </button>
      </div>
    </form>
  );
}

export default function AllocationsPage() {
  const { allocations, deallocate } = useData();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deallocateTarget, setDeallocateTarget] = useState<Allocation | null>(null);

  const filtered = allocations.filter((a) =>
    (a.cropName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (a.warehouseName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  function handleDeallocate() {
    if (!deallocateTarget) return;
    deallocate(deallocateTarget._id);
    addToast("Allocation removed", "info");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Allocations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{allocations.length} active allocations</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
          <Plus size={16} /> New Allocation
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Search by crop or warehouse…" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-600">Crop</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Warehouse</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Quantity</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Allocated By</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No allocations found</td></tr>
            )}
            {sorted.map((a) => (
              <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4 font-medium text-gray-900">{a.cropName ?? a.cropId}</td>
                <td className="px-5 py-4 text-gray-700">{a.warehouseName ?? a.warehouseId}</td>
                <td className="px-5 py-4 font-semibold text-gray-900">{a.allocatedQuantity.toLocaleString()}</td>
                <td className="px-5 py-4 text-gray-500">{a.createdByName ?? a.createdBy}</td>
                <td className="px-5 py-4 text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <button onClick={() => setDeallocateTarget(a)} className="text-xs text-red-500 hover:text-red-700 hover:underline">
                    Deallocate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

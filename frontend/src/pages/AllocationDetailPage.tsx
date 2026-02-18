import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, GitMerge, Calendar, Warehouse, Sprout, User } from "lucide-react";
import { useData } from "../contexts/DataContext";

export default function AllocationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { allocations, warehouses, crops, cropResources, resources } = useData();

    const allocation = allocations.find((a) => a._id === id);
    if (!allocation) {
        return (
            <div className="text-center py-20">
                <GitMerge size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <p className="font-medium" style={{ color: "var(--text-muted)" }}>Allocation not found</p>
                <button onClick={() => navigate("/allocations")} className="text-sm hover:underline mt-2" style={{ color: "var(--brand-600)" }}>
                    Back to Allocations
                </button>
            </div>
        );
    }

    const warehouse = warehouses.find((w) => w._id === allocation.warehouseId);
    const crop = crops.find((c) => c._id === allocation.cropId);
    const linkedResources = cropResources
        .filter((cr) => cr.cropId === allocation.cropId)
        .map((cr) => {
            const res = resources.find((r) => r._id === cr.resourceId);
            return { ...cr, resource: res, consumed: cr.requiredQuantity * allocation.allocatedQuantity };
        });

    const whUtil = warehouse && warehouse.totalCapacity > 0
        ? Math.round((warehouse.usedCapacity / warehouse.totalCapacity) * 100)
        : 0;

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate("/allocations")} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-muted)" }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold font-display flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <GitMerge className="text-purple-600" size={24} /> Allocation Detail
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {allocation.cropName} → {allocation.warehouseName}
                    </p>
                </div>
            </div>

            {/* Detail cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Crop info */}
                <div className="card p-5">
                    <h2 className="font-semibold font-display flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
                        <Sprout size={16} style={{ color: "var(--brand-600)" }} /> Crop
                    </h2>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt style={{ color: "var(--text-muted)" }}>Name</dt>
                            <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{allocation.cropName}</dd>
                        </div>
                        {crop && (
                            <>
                                <div className="flex justify-between">
                                    <dt style={{ color: "var(--text-muted)" }}>Status</dt>
                                    <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{crop.status}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt style={{ color: "var(--text-muted)" }}>Total Quantity</dt>
                                    <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{crop.quantity.toLocaleString()} units</dd>
                                </div>
                            </>
                        )}
                    </dl>
                </div>

                {/* Warehouse info */}
                <div className="card p-5">
                    <h2 className="font-semibold font-display flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
                        <Warehouse size={16} style={{ color: "var(--brand-600)" }} /> Warehouse
                    </h2>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt style={{ color: "var(--text-muted)" }}>Name</dt>
                            <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{allocation.warehouseName}</dd>
                        </div>
                        {warehouse && (
                            <>
                                <div className="flex justify-between">
                                    <dt style={{ color: "var(--text-muted)" }}>Location</dt>
                                    <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{warehouse.location}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt style={{ color: "var(--text-muted)" }}>Current Utilization</dt>
                                    <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{whUtil}%</dd>
                                </div>
                            </>
                        )}
                    </dl>
                </div>
            </div>

            {/* Allocation details */}
            <div className="card p-5">
                <h2 className="font-semibold font-display mb-4" style={{ color: "var(--text-primary)" }}>Allocation Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Allocated Quantity</p>
                        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{allocation.allocatedQuantity.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs mb-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}><Calendar size={12} /> Date</p>
                        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                            {new Date(allocation.createdAt).toLocaleDateString()} {new Date(allocation.createdAt).toLocaleTimeString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs mb-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}><User size={12} /> Created By</p>
                        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{allocation.createdByName}</p>
                    </div>
                    <div>
                        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>ID</p>
                        <p className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>{allocation._id}</p>
                    </div>
                </div>
            </div>

            {/* Resources consumed */}
            {linkedResources.length > 0 && (
                <div className="card p-5">
                    <h2 className="font-semibold font-display mb-4" style={{ color: "var(--text-primary)" }}>Resources Consumed</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Resource</th>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Per Unit</th>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Total Used</th>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Remaining Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linkedResources.map((lr) => (
                                <tr key={lr._id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td className="py-2 font-medium" style={{ color: "var(--text-primary)" }}>{lr.resource?.name ?? lr.resourceId}</td>
                                    <td className="py-2" style={{ color: "var(--text-muted)" }}>{lr.requiredQuantity}</td>
                                    <td className="py-2 font-semibold" style={{ color: "var(--text-primary)" }}>{lr.consumed.toLocaleString()}</td>
                                    <td className="py-2" style={{ color: "var(--text-muted)" }}>{lr.resource?.stockQuantity?.toLocaleString() ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

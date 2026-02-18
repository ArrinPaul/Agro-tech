import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Sprout, Calendar, Package, FlaskConical, GitMerge } from "lucide-react";
import { useData } from "../contexts/DataContext";

const STATUS_COLORS: Record<string, string> = {
    PLANTED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    GROWING: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    HARVESTED: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    STORED: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export default function CropDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { crops, getResourcesForCrop, getAllocationsForCrop } = useData();

    const crop = crops.find((c) => c._id === id);
    if (!crop) {
        return (
            <div className="text-center py-20">
                <Sprout size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <p className="font-medium" style={{ color: "var(--text-muted)" }}>Crop not found</p>
                <button onClick={() => navigate("/crops")} className="text-sm hover:underline mt-2" style={{ color: "var(--brand-600)" }}>
                    Back to Crops
                </button>
            </div>
        );
    }

    const linkedResources = getResourcesForCrop(crop._id);
    const cropAllocations = getAllocationsForCrop(crop._id);
    const totalAllocated = cropAllocations.reduce((sum, a) => sum + a.allocatedQuantity, 0);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate("/crops")} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-muted)" }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Sprout className="text-green-600" size={24} /> {crop.name}
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Crop detail view</p>
                </div>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Status</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[crop.status]}`}>
                        {crop.status}
                    </span>
                </div>
                <div className="card p-4">
                    <p className="text-xs mb-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}><Package size={12} /> Quantity</p>
                    <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{crop.quantity.toLocaleString()}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs mb-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}><GitMerge size={12} /> Total Allocated</p>
                    <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{totalAllocated.toLocaleString()}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs mb-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}><Calendar size={12} /> Created</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{new Date(crop.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Linked Resources */}
            <div className="card p-5">
                <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
                    <FlaskConical size={16} className="text-green-600" /> Linked Resources
                </h2>
                {linkedResources.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>No resources linked to this crop</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Resource</th>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Type</th>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Required / Unit</th>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Available Stock</th>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linkedResources.map((lr) => {
                                const stock = lr.resource?.stockQuantity ?? 0;
                                const ok = stock >= lr.requiredQuantity;
                                return (
                                    <tr key={lr._id} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td className="py-2 font-medium" style={{ color: "var(--text-primary)" }}>{lr.resource?.name ?? lr.resourceId}</td>
                                        <td className="py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lr.resource?.type === "FERTILIZER" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"}`}>
                                                {lr.resource?.type}
                                            </span>
                                        </td>
                                        <td className="py-2" style={{ color: "var(--text-muted)" }}>{lr.requiredQuantity}</td>
                                        <td className="py-2" style={{ color: "var(--text-muted)" }}>{stock.toLocaleString()}</td>
                                        <td className="py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ok ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                                                {ok ? "Sufficient" : "Insufficient"}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Allocation History */}
            <div className="card p-5">
                <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
                    <GitMerge size={16} className="text-purple-600" /> Allocation History
                </h2>
                {cropAllocations.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>No allocations for this crop</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Date</th>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Warehouse</th>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Quantity</th>
                                <th className="text-left py-2 font-medium" style={{ color: "var(--text-muted)" }}>Allocated By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...cropAllocations].sort((a, b) => b.createdAt - a.createdAt).map((a) => (
                                <tr key={a._id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td className="py-2" style={{ color: "var(--text-muted)" }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                                    <td className="py-2" style={{ color: "var(--text-secondary)" }}>
                                        <Link to={`/warehouses`} className="text-green-600 hover:underline">{a.warehouseName}</Link>
                                    </td>
                                    <td className="py-2 font-semibold" style={{ color: "var(--text-primary)" }}>{a.allocatedQuantity.toLocaleString()} units</td>
                                    <td className="py-2" style={{ color: "var(--text-muted)" }}>{a.createdByName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

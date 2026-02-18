import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Sprout, Calendar, Package, FlaskConical, GitMerge } from "lucide-react";
import { useData } from "../contexts/DataContext";

const STATUS_COLORS: Record<string, string> = {
    PLANTED: "bg-green-100 text-green-700",
    GROWING: "bg-blue-100 text-blue-700",
    HARVESTED: "bg-amber-100 text-amber-700",
    STORED: "bg-purple-100 text-purple-700",
};

export default function CropDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { crops, getResourcesForCrop, getAllocationsForCrop } = useData();

    const crop = crops.find((c) => c._id === id);
    if (!crop) {
        return (
            <div className="text-center py-20">
                <Sprout size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Crop not found</p>
                <button onClick={() => navigate("/crops")} className="text-sm text-green-600 hover:underline mt-2">
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
                <button onClick={() => navigate("/crops")} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Sprout className="text-green-600" size={24} /> {crop.name}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Crop detail view</p>
                </div>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[crop.status]}`}>
                        {crop.status}
                    </span>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Package size={12} /> Quantity</p>
                    <p className="text-lg font-bold text-gray-900">{crop.quantity.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><GitMerge size={12} /> Total Allocated</p>
                    <p className="text-lg font-bold text-gray-900">{totalAllocated.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Created</p>
                    <p className="text-sm font-medium text-gray-700">{new Date(crop.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Linked Resources */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <FlaskConical size={16} className="text-green-600" /> Linked Resources
                </h2>
                {linkedResources.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No resources linked to this crop</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-2 font-medium text-gray-600">Resource</th>
                                <th className="text-left py-2 font-medium text-gray-600">Type</th>
                                <th className="text-left py-2 font-medium text-gray-600">Required / Unit</th>
                                <th className="text-left py-2 font-medium text-gray-600">Available Stock</th>
                                <th className="text-left py-2 font-medium text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linkedResources.map((lr) => {
                                const stock = lr.resource?.stockQuantity ?? 0;
                                const ok = stock >= lr.requiredQuantity;
                                return (
                                    <tr key={lr._id} className="border-b border-gray-50">
                                        <td className="py-2 font-medium text-gray-900">{lr.resource?.name ?? lr.resourceId}</td>
                                        <td className="py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lr.resource?.type === "FERTILIZER" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                                                {lr.resource?.type}
                                            </span>
                                        </td>
                                        <td className="py-2 text-gray-600">{lr.requiredQuantity}</td>
                                        <td className="py-2 text-gray-600">{stock.toLocaleString()}</td>
                                        <td className="py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
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
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <GitMerge size={16} className="text-purple-600" /> Allocation History
                </h2>
                {cropAllocations.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No allocations for this crop</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-2 font-medium text-gray-600">Date</th>
                                <th className="text-left py-2 font-medium text-gray-600">Warehouse</th>
                                <th className="text-left py-2 font-medium text-gray-600">Quantity</th>
                                <th className="text-left py-2 font-medium text-gray-600">Allocated By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...cropAllocations].sort((a, b) => b.createdAt - a.createdAt).map((a) => (
                                <tr key={a._id} className="border-b border-gray-50">
                                    <td className="py-2 text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                                    <td className="py-2 text-gray-700">
                                        <Link to={`/warehouses`} className="text-green-600 hover:underline">{a.warehouseName}</Link>
                                    </td>
                                    <td className="py-2 font-semibold text-gray-900">{a.allocatedQuantity.toLocaleString()} units</td>
                                    <td className="py-2 text-gray-500">{a.createdByName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

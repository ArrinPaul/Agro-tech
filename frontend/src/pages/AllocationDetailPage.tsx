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
                <GitMerge size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Allocation not found</p>
                <button onClick={() => navigate("/allocations")} className="text-sm text-green-600 hover:underline mt-2">
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
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate("/allocations")} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <GitMerge className="text-purple-600" size={24} /> Allocation Detail
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {allocation.cropName} → {allocation.warehouseName}
                    </p>
                </div>
            </div>

            {/* Detail cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Crop info */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                        <Sprout size={16} className="text-green-600" /> Crop
                    </h2>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">Name</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{allocation.cropName}</dd>
                        </div>
                        {crop && (
                            <>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                                    <dd className="font-medium text-gray-900 dark:text-gray-100">{crop.status}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500 dark:text-gray-400">Total Quantity</dt>
                                    <dd className="font-medium text-gray-900 dark:text-gray-100">{crop.quantity.toLocaleString()} units</dd>
                                </div>
                            </>
                        )}
                    </dl>
                </div>

                {/* Warehouse info */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                        <Warehouse size={16} className="text-green-600" /> Warehouse
                    </h2>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">Name</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{allocation.warehouseName}</dd>
                        </div>
                        {warehouse && (
                            <>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500 dark:text-gray-400">Location</dt>
                                    <dd className="font-medium text-gray-900 dark:text-gray-100">{warehouse.location}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500 dark:text-gray-400">Current Utilization</dt>
                                    <dd className="font-medium text-gray-900 dark:text-gray-100">{whUtil}%</dd>
                                </div>
                            </>
                        )}
                    </dl>
                </div>
            </div>

            {/* Allocation details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Allocation Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Allocated Quantity</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{allocation.allocatedQuantity.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> Date</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {new Date(allocation.createdAt).toLocaleDateString()} {new Date(allocation.createdAt).toLocaleTimeString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><User size={12} /> Created By</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{allocation.createdByName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID</p>
                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{allocation._id}</p>
                    </div>
                </div>
            </div>

            {/* Resources consumed */}
            {linkedResources.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Resources Consumed</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700">
                                <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-400">Resource</th>
                                <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-400">Per Unit</th>
                                <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-400">Total Used</th>
                                <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-400">Remaining Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linkedResources.map((lr) => (
                                <tr key={lr._id} className="border-b border-gray-50 dark:border-gray-700">
                                    <td className="py-2 font-medium text-gray-900 dark:text-gray-100">{lr.resource?.name ?? lr.resourceId}</td>
                                    <td className="py-2 text-gray-600 dark:text-gray-400">{lr.requiredQuantity}</td>
                                    <td className="py-2 font-semibold text-gray-900 dark:text-gray-100">{lr.consumed.toLocaleString()}</td>
                                    <td className="py-2 text-gray-600 dark:text-gray-400">{lr.resource?.stockQuantity?.toLocaleString() ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

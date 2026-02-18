import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type {
  User, Organization, Warehouse, Crop, Resource, CropResource,
  Allocation, AuditLog, Suggestion,
} from "../types";

function id() {
  return Math.random().toString(36).slice(2, 11);
}

const DEFAULT_ORG: Organization = { _id: "org1", name: "AgroTech Farm Co.", createdAt: Date.now() - 86400000 * 30 };

const DEFAULT_USER: User = {
  _id: "user1", clerkId: "clerk_1", email: "admin@agrotech.com",
  name: "Admin User", role: "ADMIN", organizationId: "org1", createdAt: Date.now() - 86400000 * 30,
};

const SEED_WAREHOUSES: Warehouse[] = [
  { _id: "wh1", name: "Central Silo A", location: "North Field", totalCapacity: 1000, usedCapacity: 750, organizationId: "org1", createdAt: Date.now() - 86400000 * 20 },
  { _id: "wh2", name: "Cold Storage B", location: "South Complex", totalCapacity: 500, usedCapacity: 120, organizationId: "org1", createdAt: Date.now() - 86400000 * 15 },
  { _id: "wh3", name: "Grain Depot C", location: "East Wing", totalCapacity: 2000, usedCapacity: 1950, organizationId: "org1", createdAt: Date.now() - 86400000 * 10 },
  { _id: "wh4", name: "Open Yard D", location: "West Perimeter", totalCapacity: 800, usedCapacity: 100, organizationId: "org1", createdAt: Date.now() - 86400000 * 5 },
];

const SEED_CROPS: Crop[] = [
  { _id: "cr1", name: "Wheat", quantity: 500, status: "HARVESTED", organizationId: "org1", createdAt: Date.now() - 86400000 * 18 },
  { _id: "cr2", name: "Rice", quantity: 300, status: "GROWING", organizationId: "org1", createdAt: Date.now() - 86400000 * 14 },
  { _id: "cr3", name: "Corn", quantity: 700, status: "PLANTED", organizationId: "org1", createdAt: Date.now() - 86400000 * 8 },
  { _id: "cr4", name: "Soybean", quantity: 200, status: "STORED", organizationId: "org1", createdAt: Date.now() - 86400000 * 3 },
];

const SEED_RESOURCES: Resource[] = [
  { _id: "rs1", name: "NPK Fertilizer", type: "FERTILIZER", stockQuantity: 120, organizationId: "org1" },
  { _id: "rs2", name: "Urea", type: "FERTILIZER", stockQuantity: 30, organizationId: "org1" },
  { _id: "rs3", name: "Glyphosate", type: "PESTICIDE", stockQuantity: 0, organizationId: "org1" },
  { _id: "rs4", name: "Chlorpyrifos", type: "PESTICIDE", stockQuantity: 85, organizationId: "org1" },
];

const SEED_CROP_RESOURCES: CropResource[] = [
  { _id: "crl1", cropId: "cr1", resourceId: "rs1", requiredQuantity: 2 },
  { _id: "crl2", cropId: "cr2", resourceId: "rs2", requiredQuantity: 1 },
  { _id: "crl3", cropId: "cr3", resourceId: "rs1", requiredQuantity: 3 },
  { _id: "crl4", cropId: "cr3", resourceId: "rs4", requiredQuantity: 1 },
];

const SEED_ALLOCATIONS: Allocation[] = [
  { _id: "al1", cropId: "cr1", warehouseId: "wh1", allocatedQuantity: 400, createdBy: "user1", organizationId: "org1", createdAt: Date.now() - 86400000 * 7, cropName: "Wheat", warehouseName: "Central Silo A", createdByName: "Admin User" },
  { _id: "al2", cropId: "cr4", warehouseId: "wh1", allocatedQuantity: 200, createdBy: "user1", organizationId: "org1", createdAt: Date.now() - 86400000 * 5, cropName: "Soybean", warehouseName: "Central Silo A", createdByName: "Admin User" },
  { _id: "al3", cropId: "cr1", warehouseId: "wh3", allocatedQuantity: 100, createdBy: "user1", organizationId: "org1", createdAt: Date.now() - 86400000 * 2, cropName: "Wheat", warehouseName: "Grain Depot C", createdByName: "Admin User" },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  { _id: "log1", action: "CREATE_WAREHOUSE", entityType: "warehouse", entityId: "wh1", performedBy: "user1", performedByName: "Admin User", timestamp: Date.now() - 86400000 * 20 },
  { _id: "log2", action: "CREATE_CROP", entityType: "crop", entityId: "cr1", performedBy: "user1", performedByName: "Admin User", timestamp: Date.now() - 86400000 * 18 },
  { _id: "log3", action: "ALLOCATE_CROP", entityType: "allocation", entityId: "al1", performedBy: "user1", performedByName: "Admin User", timestamp: Date.now() - 86400000 * 7 },
  { _id: "log4", action: "ALLOCATE_CROP", entityType: "allocation", entityId: "al2", performedBy: "user1", performedByName: "Admin User", timestamp: Date.now() - 86400000 * 5 },
  { _id: "log5", action: "ALLOCATE_CROP", entityType: "allocation", entityId: "al3", performedBy: "user1", performedByName: "Admin User", timestamp: Date.now() - 86400000 * 2 },
];

// Smart warehouse recommendation
export interface WarehouseRecommendation {
  warehouse: Warehouse;
  remainingCapacity: number;
  utilization: number;
  reason: string;
}

interface DataContextType {
  // Auth
  currentUser: User;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  // Organization
  organization: Organization;
  // Warehouses
  warehouses: Warehouse[];
  createWarehouse: (data: Pick<Warehouse, "name" | "location" | "totalCapacity">) => void;
  updateWarehouse: (id: string, data: Partial<Pick<Warehouse, "name" | "location" | "totalCapacity">>) => void;
  deleteWarehouse: (id: string) => string | null;
  // Crops
  crops: Crop[];
  createCrop: (data: Pick<Crop, "name" | "quantity">) => void;
  updateCrop: (id: string, data: Partial<Pick<Crop, "name" | "quantity" | "status">>) => void;
  deleteCrop: (id: string) => string | null;
  // Resources
  resources: Resource[];
  createResource: (data: Pick<Resource, "name" | "type" | "stockQuantity">) => void;
  updateResource: (id: string, data: Partial<Pick<Resource, "name" | "stockQuantity">>) => void;
  deleteResource: (id: string) => string | null;
  adjustStock: (id: string, delta: number) => string | null;
  // Crop-Resource linking
  cropResources: CropResource[];
  linkResource: (cropId: string, resourceId: string, requiredQuantity: number) => void;
  unlinkResource: (cropId: string, resourceId: string) => void;
  getResourcesForCrop: (cropId: string) => (CropResource & { resource?: Resource })[];
  getCropsForResource: (resourceId: string) => (CropResource & { crop?: Crop })[];
  // Allocations
  allocations: Allocation[];
  allocate: (cropId: string, warehouseId: string, quantity: number) => string | null;
  deallocate: (id: string) => void;
  getAllocationsForWarehouse: (warehouseId: string) => Allocation[];
  getAllocationsForCrop: (cropId: string) => Allocation[];
  // Audit
  auditLogs: AuditLog[];
  // AI
  suggestions: Suggestion[];
  recommendWarehouse: (cropId: string, quantity: number) => WarehouseRecommendation[];
}

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(SEED_WAREHOUSES);
  const [crops, setCrops] = useState<Crop[]>(SEED_CROPS);
  const [resources, setResources] = useState<Resource[]>(SEED_RESOURCES);
  const [cropResources, setCropResources] = useState<CropResource[]>(SEED_CROP_RESOURCES);
  const [allocations, setAllocations] = useState<Allocation[]>(SEED_ALLOCATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(SEED_AUDIT_LOGS);

  const addLog = useCallback((action: string, entityType: string, entityId: string) => {
    setAuditLogs((prev) => [
      { _id: id(), action, entityType, entityId, performedBy: "user1", performedByName: "Admin User", timestamp: Date.now() },
      ...prev,
    ]);
  }, []);

  // Warehouses
  const createWarehouse = useCallback((data: Pick<Warehouse, "name" | "location" | "totalCapacity">) => {
    const newId = id();
    setWarehouses((prev) => [...prev, { ...data, _id: newId, usedCapacity: 0, organizationId: "org1", createdAt: Date.now() }]);
    addLog("CREATE_WAREHOUSE", "warehouse", newId);
  }, [addLog]);

  const updateWarehouse = useCallback((whId: string, data: Partial<Pick<Warehouse, "name" | "location" | "totalCapacity">>) => {
    setWarehouses((prev) => prev.map((w) => w._id === whId ? { ...w, ...data } : w));
    addLog("UPDATE_WAREHOUSE", "warehouse", whId);
  }, [addLog]);

  const deleteWarehouse = useCallback((whId: string): string | null => {
    if (allocations.some((a) => a.warehouseId === whId)) return "Cannot delete warehouse with active allocations";
    setWarehouses((prev) => prev.filter((w) => w._id !== whId));
    addLog("DELETE_WAREHOUSE", "warehouse", whId);
    return null;
  }, [allocations, addLog]);

  // Crops
  const createCrop = useCallback((data: Pick<Crop, "name" | "quantity">) => {
    const newId = id();
    setCrops((prev) => [...prev, { ...data, _id: newId, status: "PLANTED", organizationId: "org1", createdAt: Date.now() }]);
    addLog("CREATE_CROP", "crop", newId);
  }, [addLog]);

  const updateCrop = useCallback((cId: string, data: Partial<Pick<Crop, "name" | "quantity" | "status">>) => {
    setCrops((prev) => prev.map((c) => c._id === cId ? { ...c, ...data } : c));
    addLog("UPDATE_CROP", "crop", cId);
  }, [addLog]);

  const deleteCrop = useCallback((cId: string): string | null => {
    if (allocations.some((a) => a.cropId === cId)) return "Cannot delete crop with active allocations";
    setCrops((prev) => prev.filter((c) => c._id !== cId));
    setCropResources((prev) => prev.filter((cr) => cr.cropId !== cId));
    addLog("DELETE_CROP", "crop", cId);
    return null;
  }, [allocations, addLog]);

  // Resources
  const createResource = useCallback((data: Pick<Resource, "name" | "type" | "stockQuantity">) => {
    const newId = id();
    setResources((prev) => [...prev, { ...data, _id: newId, organizationId: "org1" }]);
    addLog("CREATE_RESOURCE", "resource", newId);
  }, [addLog]);

  const updateResource = useCallback((rId: string, data: Partial<Pick<Resource, "name" | "stockQuantity">>) => {
    setResources((prev) => prev.map((r) => r._id === rId ? { ...r, ...data } : r));
    addLog("UPDATE_RESOURCE", "resource", rId);
  }, [addLog]);

  const deleteResource = useCallback((rId: string): string | null => {
    if (cropResources.some((cr) => cr.resourceId === rId)) return "Cannot delete resource linked to crops";
    setResources((prev) => prev.filter((r) => r._id !== rId));
    addLog("DELETE_RESOURCE", "resource", rId);
    return null;
  }, [cropResources, addLog]);

  const adjustStock = useCallback((rId: string, delta: number): string | null => {
    const r = resources.find((r) => r._id === rId);
    if (!r) return "Resource not found";
    if (r.stockQuantity + delta < 0) return "Stock cannot be negative";
    setResources((prev) => prev.map((r) => r._id === rId ? { ...r, stockQuantity: r.stockQuantity + delta } : r));
    return null;
  }, [resources]);

  // Crop-Resource linking
  const linkResource = useCallback((cropId: string, resourceId: string, requiredQuantity: number) => {
    setCropResources((prev) => [...prev, { _id: id(), cropId, resourceId, requiredQuantity }]);
  }, []);

  const unlinkResource = useCallback((cropId: string, resourceId: string) => {
    setCropResources((prev) => prev.filter((cr) => !(cr.cropId === cropId && cr.resourceId === resourceId)));
  }, []);

  const getResourcesForCrop = useCallback((cropId: string) => {
    return cropResources
      .filter((cr) => cr.cropId === cropId)
      .map((cr) => ({ ...cr, resource: resources.find((r) => r._id === cr.resourceId) }));
  }, [cropResources, resources]);

  const getCropsForResource = useCallback((resourceId: string) => {
    return cropResources
      .filter((cr) => cr.resourceId === resourceId)
      .map((cr) => ({ ...cr, crop: crops.find((c) => c._id === cr.cropId) }));
  }, [cropResources, crops]);

  // Allocation queries
  const getAllocationsForWarehouse = useCallback((warehouseId: string) => {
    return allocations.filter((a) => a.warehouseId === warehouseId);
  }, [allocations]);

  const getAllocationsForCrop = useCallback((cropId: string) => {
    return allocations.filter((a) => a.cropId === cropId);
  }, [allocations]);

  // Allocations
  const allocate = useCallback((cropId: string, warehouseId: string, quantity: number): string | null => {
    const wh = warehouses.find((w) => w._id === warehouseId);
    if (!wh) return "Warehouse not found";
    const remaining = wh.totalCapacity - wh.usedCapacity;
    if (quantity > remaining) return `Insufficient capacity. Available: ${remaining}, Requested: ${quantity}`;

    const reqs = cropResources.filter((cr) => cr.cropId === cropId);
    for (const req of reqs) {
      const res = resources.find((r) => r._id === req.resourceId);
      if (!res) return `Resource not found: ${req.resourceId}`;
      const totalNeeded = req.requiredQuantity * quantity;
      if (res.stockQuantity < totalNeeded) return `Insufficient ${res.name}. Available: ${res.stockQuantity}, Required: ${totalNeeded}`;
    }

    // Deduct resources
    setResources((prev) => prev.map((r) => {
      const req = reqs.find((cr) => cr.resourceId === r._id);
      if (!req) return r;
      return { ...r, stockQuantity: r.stockQuantity - req.requiredQuantity * quantity };
    }));

    // Update warehouse
    setWarehouses((prev) => prev.map((w) => w._id === warehouseId ? { ...w, usedCapacity: w.usedCapacity + quantity } : w));

    const crop = crops.find((c) => c._id === cropId);
    const alId = id();
    setAllocations((prev) => [...prev, {
      _id: alId, cropId, warehouseId, allocatedQuantity: quantity,
      createdBy: "user1", organizationId: "org1", createdAt: Date.now(),
      cropName: crop?.name ?? "Unknown", warehouseName: wh.name, createdByName: "Admin User",
    }]);
    addLog("ALLOCATE_CROP", "allocation", alId);
    return null;
  }, [warehouses, resources, cropResources, crops, addLog]);

  const deallocate = useCallback((alId: string) => {
    const al = allocations.find((a) => a._id === alId);
    if (!al) return;

    setWarehouses((prev) => prev.map((w) => w._id === al.warehouseId ? { ...w, usedCapacity: Math.max(0, w.usedCapacity - al.allocatedQuantity) } : w));

    const reqs = cropResources.filter((cr) => cr.cropId === al.cropId);
    setResources((prev) => prev.map((r) => {
      const req = reqs.find((cr) => cr.resourceId === r._id);
      if (!req) return r;
      return { ...r, stockQuantity: r.stockQuantity + req.requiredQuantity * al.allocatedQuantity };
    }));

    setAllocations((prev) => prev.filter((a) => a._id !== alId));
    addLog("DEALLOCATE", "allocation", alId);
  }, [allocations, cropResources, addLog]);

  // Smart Warehouse Recommendation (Phase 4.4)
  const recommendWarehouse = useCallback((_cropId: string, quantity: number): WarehouseRecommendation[] => {
    return warehouses
      .map((wh) => {
        const remaining = wh.totalCapacity - wh.usedCapacity;
        const util = wh.totalCapacity > 0 ? Math.round((wh.usedCapacity / wh.totalCapacity) * 100) : 100;
        let reason = "";
        if (remaining >= quantity) {
          if (util < 50) reason = "Low utilization — plenty of room";
          else if (util < 80) reason = "Good balance of space available";
          else reason = "Tight fit but sufficient capacity";
        }
        return { warehouse: wh, remainingCapacity: remaining, utilization: util, reason };
      })
      .filter((r) => r.remainingCapacity >= quantity && r.reason)
      .sort((a, b) => a.utilization - b.utilization)
      .slice(0, 3);
  }, [warehouses]);

  // AI Suggestions — auto-refresh on data changes (Phase 4.6)
  const suggestions: Suggestion[] = useMemo(() => {
    const s: Suggestion[] = [];

    // Warehouse utilization warnings (4.2)
    for (const wh of warehouses) {
      const util = wh.totalCapacity > 0 ? (wh.usedCapacity / wh.totalCapacity) * 100 : 0;
      if (util > 95) {
        s.push({ type: "OPTIMIZATION", title: `Critical: ${wh.name} nearly full`, message: `${wh.name} is at ${util.toFixed(1)}% capacity. Immediate redistribution recommended.`, severity: "critical" });
      } else if (util > 80) {
        s.push({ type: "OPTIMIZATION", title: `High utilization: ${wh.name}`, message: `${wh.name} is at ${util.toFixed(1)}% capacity. Consider redistributing.`, severity: "warning" });
      } else if (util < 20 && wh.usedCapacity > 0) {
        s.push({ type: "OPTIMIZATION", title: `Underutilized: ${wh.name}`, message: `${wh.name} is only at ${util.toFixed(1)}% capacity. Consider consolidating.`, severity: "info" });
      }
    }

    // Resource depletion warnings (4.3)
    for (const r of resources) {
      if (r.stockQuantity <= 0) {
        s.push({ type: "DEPLETION_WARNING", title: `Out of stock: ${r.name}`, message: `${r.name} (${r.type}) is completely depleted. Restock immediately.`, severity: "critical" });
      } else if (r.stockQuantity < 50) {
        s.push({ type: "DEPLETION_WARNING", title: `Low stock: ${r.name}`, message: `${r.name} has only ${r.stockQuantity} units remaining. Consider restocking.`, severity: "warning" });
      }
    }

    // Redistribution targets (4.2 enhancement)
    const overloaded = warehouses.filter((wh) => wh.totalCapacity > 0 && (wh.usedCapacity / wh.totalCapacity) > 0.9);
    const underutilized = warehouses
      .filter((wh) => wh.totalCapacity > 0 && (wh.usedCapacity / wh.totalCapacity) < 0.5)
      .sort((a, b) => (a.usedCapacity / a.totalCapacity) - (b.usedCapacity / b.totalCapacity));

    if (overloaded.length > 0 && underutilized.length > 0) {
      s.push({
        type: "RECOMMENDATION",
        title: "Redistribution opportunity",
        message: `Move stock from ${overloaded.map((w) => w.name).join(", ")} to ${underutilized.slice(0, 2).map((w) => `${w.name} (${(w.totalCapacity - w.usedCapacity).toLocaleString()} free)`).join(", ")}.`,
        severity: "warning",
        data: { overloaded: overloaded.map((w) => w._id), targets: underutilized.slice(0, 2).map((w) => w._id) },
      });
    }

    // Best warehouses for new allocations
    const bestOptions = warehouses
      .filter((wh) => wh.totalCapacity > 0 && (wh.usedCapacity / wh.totalCapacity) < 0.5)
      .sort((a, b) => (a.usedCapacity / a.totalCapacity) - (b.usedCapacity / b.totalCapacity))
      .slice(0, 3);
    if (bestOptions.length > 0) {
      s.push({ type: "RECOMMENDATION", title: "Best warehouses for new allocations", message: `Top picks: ${bestOptions.map((w) => `${w.name} (${Math.round((w.usedCapacity / w.totalCapacity) * 100)}% used)`).join(", ")}`, severity: "info" });
    }

    // Demand forecast (4.5)
    for (const crop of crops) {
      const ca = allocations.filter((a) => a.cropId === crop._id);
      if (ca.length >= 2) {
        const total = ca.reduce((sum, a) => sum + a.allocatedQuantity, 0);
        const avgAllocation = total / ca.length;
        const sorted = [...ca].sort((a, b) => a.createdAt - b.createdAt);
        const daySpan = Math.max(1, (sorted[sorted.length - 1].createdAt - sorted[0].createdAt) / 86400000);
        const dailyRate = total / daySpan;
        const forecast30 = Math.round(dailyRate * 30);
        s.push({
          type: "FORECAST",
          title: `Demand trend: ${crop.name}`,
          message: `Avg allocation: ${avgAllocation.toFixed(0)} units. Estimated 30-day demand: ~${forecast30.toLocaleString()} units based on ${ca.length} allocations over ${Math.round(daySpan)} days.`,
          severity: "info",
          data: { cropId: crop._id, dailyRate, forecast30 },
        });
      }
    }

    return s;
  }, [warehouses, resources, crops, allocations]);

  return (
    <DataContext.Provider value={{
      currentUser: DEFAULT_USER, isAuthenticated, login: () => setIsAuthenticated(true), logout: () => setIsAuthenticated(false),
      organization: DEFAULT_ORG,
      warehouses, createWarehouse, updateWarehouse, deleteWarehouse,
      crops, createCrop, updateCrop, deleteCrop,
      resources, createResource, updateResource, deleteResource, adjustStock,
      cropResources, linkResource, unlinkResource, getResourcesForCrop, getCropsForResource,
      allocations, allocate, deallocate, getAllocationsForWarehouse, getAllocationsForCrop,
      auditLogs, suggestions, recommendWarehouse,
    }}>
      {children}
    </DataContext.Provider>
  );
}

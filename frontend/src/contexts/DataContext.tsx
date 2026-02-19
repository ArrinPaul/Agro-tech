/**
 * DataContext.tsx — Compatibility wrapper around ConvexDataContext
 * 
 * This module provides a null-safe interface for all pages that import useData.
 * It wraps the Convex-backed data context with:
 * - Default empty arrays instead of undefined
 * - Error-returning wrappers for delete/allocate mutations
 * - Consistent API for all consuming pages
 */
import { useCallback } from "react";
import { useData as useConvexData } from "./ConvexDataContext";
import type {
  Warehouse, Crop, Resource, CropResource,
  Allocation, AuditLog, Suggestion,
} from "../types";

// Re-export the warehouse recommendation type
export type { WarehouseRecommendation } from "./ConvexDataContext";

export function useData() {
  const ctx = useConvexData();

  // Null-safe data arrays
  const warehouses: Warehouse[] = ctx.warehouses ?? [];
  const crops: Crop[] = ctx.crops ?? [];
  const resources: Resource[] = ctx.resources ?? [];
  const cropResources: CropResource[] = ctx.cropResources ?? [];
  const allocations: Allocation[] = ctx.allocations ?? [];
  const auditLogs: AuditLog[] = ctx.auditLogs ?? [];
  const suggestions: Suggestion[] = ctx.suggestions ?? [];

  // Wrap async void functions with proper error handling
  const deleteWarehouse = useCallback(async (id: string): Promise<string | null> => {
    try {
      await ctx.deleteWarehouse(id as never);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [ctx]);

  const deleteCrop = useCallback(async (id: string): Promise<string | null> => {
    try {
      await ctx.deleteCrop(id as never);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [ctx]);

  const deleteResource = useCallback(async (id: string): Promise<string | null> => {
    try {
      await ctx.deleteResource(id as never);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [ctx]);

  const adjustStock = useCallback(async (id: string, delta: number): Promise<string | null> => {
    try {
      await ctx.adjustStock(id as never, delta);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [ctx]);

  // Wrap allocate to return error string
  const allocate = useCallback(async (cropId: string, warehouseId: string, quantity: number): Promise<string | null> => {
    try {
      await ctx.allocate(cropId as never, warehouseId as never, quantity);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [ctx]);

  // Wrap mutation functions for type compatibility
  const createWarehouse = useCallback((data: { name: string; location: string; totalCapacity: number }) => {
    ctx.createWarehouse(data);
  }, [ctx]);

  const updateWarehouse = useCallback((id: string, data: Partial<{ name: string; location: string; totalCapacity: number }>) => {
    ctx.updateWarehouse(id as never, data);
  }, [ctx]);

  const createCrop = useCallback((data: { name: string; quantity: number }) => {
    ctx.createCrop(data);
  }, [ctx]);

  const updateCrop = useCallback((id: string, data: Partial<{ name: string; quantity: number; status: "PLANTED" | "GROWING" | "HARVESTED" | "STORED" }>) => {
    ctx.updateCrop(id as never, data);
  }, [ctx]);

  const createResource = useCallback((data: { name: string; type: "FERTILIZER" | "PESTICIDE"; stockQuantity: number }) => {
    ctx.createResource(data);
  }, [ctx]);

  const updateResource = useCallback((id: string, data: Partial<{ name: string; stockQuantity: number }>) => {
    ctx.updateResource(id as never, data);
  }, [ctx]);

  const linkResource = useCallback((cropId: string, resourceId: string, requiredQuantity: number) => {
    ctx.linkResource(cropId as never, resourceId as never, requiredQuantity);
  }, [ctx]);

  const unlinkResource = useCallback((cropId: string, resourceId: string) => {
    ctx.unlinkResource(cropId as never, resourceId as never);
  }, [ctx]);

  const deallocate = useCallback((id: string) => {
    ctx.deallocate(id as never);
  }, [ctx]);

  // Null-safe query helpers
  const getWarehouse = useCallback((id: string) => {
    return ctx.getWarehouse ? ctx.getWarehouse(id as never) : warehouses.find(w => w._id === id);
  }, [ctx, warehouses]);

  const getCrop = useCallback((id: string) => {
    return ctx.getCrop ? ctx.getCrop(id as never) : crops.find(c => c._id === id);
  }, [ctx, crops]);

  const getResource = useCallback((id: string) => {
    return ctx.getResource ? ctx.getResource(id as never) : resources.find(r => r._id === id);
  }, [ctx, resources]);

  const getResourcesForCrop = useCallback((cropId: string) => {
    return ctx.getResourcesForCrop ? ctx.getResourcesForCrop(cropId as never) : [];
  }, [ctx]);

  const getCropsForResource = useCallback((resourceId: string) => {
    return ctx.getCropsForResource ? ctx.getCropsForResource(resourceId as never) : [];
  }, [ctx]);

  const getAllocationsForWarehouse = useCallback((warehouseId: string) => {
    return ctx.getAllocationsForWarehouse ? ctx.getAllocationsForWarehouse(warehouseId as never) : [];
  }, [ctx]);

  const getAllocationsForCrop = useCallback((cropId: string) => {
    return ctx.getAllocationsForCrop ? ctx.getAllocationsForCrop(cropId as never) : [];
  }, [ctx]);

  const recommendWarehouse = useCallback((cropId: string, quantity: number) => {
    return ctx.recommendWarehouse ? ctx.recommendWarehouse(cropId as never, quantity) : [];
  }, [ctx]);

  return {
    // Data arrays (never undefined)
    warehouses,
    crops,
    resources,
    cropResources,
    allocations,
    auditLogs,
    suggestions,
    
    // Organization
    organizationId: ctx.organizationId,
    organizationName: ctx.organizationName,
    
    // Warehouse operations
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouse,
    
    // Crop operations
    createCrop,
    updateCrop,
    deleteCrop,
    getCrop,
    
    // Resource operations
    createResource,
    updateResource,
    deleteResource,
    adjustStock,
    getResource,
    
    // Crop-Resource linking
    linkResource,
    unlinkResource,
    getResourcesForCrop,
    getCropsForResource,
    
    // Allocation operations
    allocate,
    deallocate,
    getAllocationsForWarehouse,
    getAllocationsForCrop,
    
    // AI
    recommendWarehouse,
    
    // Loading state
    isLoading: ctx.isLoading,
  };
}

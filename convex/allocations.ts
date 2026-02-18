import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Allocate crop to warehouse
export const allocateCropToWarehouse = mutation({
  args: {
    cropId: v.id("crops"),
    warehouseId: v.id("warehouses"),
    allocatedQuantity: v.number(),
    userId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Step 1: Validate warehouse exists and belongs to org
    const warehouse = await ctx.db.get(args.warehouseId);
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }
    if (warehouse.organizationId !== args.organizationId) {
      throw new Error("Warehouse does not belong to your organization");
    }

    // Step 2: Check capacity
    const remainingCapacity = warehouse.totalCapacity - warehouse.usedCapacity;
    if (remainingCapacity < args.allocatedQuantity) {
      throw new Error(`Insufficient warehouse capacity. Available: ${remainingCapacity}, Required: ${args.allocatedQuantity}`);
    }

    // Step 3: Validate crop exists
    const crop = await ctx.db.get(args.cropId);
    if (!crop) {
      throw new Error("Crop not found");
    }
    if (crop.organizationId !== args.organizationId) {
      throw new Error("Crop does not belong to your organization");
    }

    // Step 4: Check resource requirements
    const cropResources = await ctx.db
      .query("cropResources")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect();
    
    interface InsufficientResource {
      name: string;
      required: number;
      available: number;
    }
    
    const insufficientResources: InsufficientResource[] = [];
    for (const link of cropResources) {
      const resource = await ctx.db.get(link.resourceId);
      if (!resource) continue;
      
      const requiredTotal = link.requiredQuantity * args.allocatedQuantity;
      if (resource.stockQuantity < requiredTotal) {
        insufficientResources.push({
          name: resource.name,
          required: requiredTotal,
          available: resource.stockQuantity,
        });
      }
    }
    
    if (insufficientResources.length > 0) {
      const details = insufficientResources
        .map(r => `${r.name}: need ${r.required}, have ${r.available}`)
        .join("; ");
      throw new Error(`Insufficient resources: ${details}`);
    }

    // Step 5: Deduct resource stock
    for (const link of cropResources) {
      const resource = await ctx.db.get(link.resourceId);
      if (!resource) continue;
      
      const requiredTotal = link.requiredQuantity * args.allocatedQuantity;
      await ctx.db.patch(link.resourceId, {
        stockQuantity: resource.stockQuantity - requiredTotal,
        updatedAt: Date.now(),
      });
    }

    // Step 6: Increment warehouse used capacity
    await ctx.db.patch(args.warehouseId, {
      usedCapacity: warehouse.usedCapacity + args.allocatedQuantity,
      updatedAt: Date.now(),
    });

    // Step 7: Create allocation record
    const allocationId = await ctx.db.insert("allocations", {
      cropId: args.cropId,
      warehouseId: args.warehouseId,
      allocatedQuantity: args.allocatedQuantity,
      createdBy: args.userId,
      organizationId: args.organizationId,
      createdAt: Date.now(),
    });

    // Step 8: Log the action
    await ctx.db.insert("auditLogs", {
      action: "ALLOCATION_CREATED",
      entityType: "allocation",
      entityId: allocationId,
      performedBy: args.userId,
      organizationId: args.organizationId,
      details: {
        cropId: args.cropId,
        warehouseId: args.warehouseId,
        quantity: args.allocatedQuantity,
      },
      timestamp: Date.now(),
    });

    return allocationId;
  },
});

// Deallocate (remove allocation)
export const deallocate = mutation({
  args: {
    allocationId: v.id("allocations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const allocation = await ctx.db.get(args.allocationId);
    if (!allocation) {
      throw new Error("Allocation not found");
    }

    // Restore warehouse capacity
    const warehouse = await ctx.db.get(allocation.warehouseId);
    if (warehouse) {
      await ctx.db.patch(allocation.warehouseId, {
        usedCapacity: Math.max(0, warehouse.usedCapacity - allocation.allocatedQuantity),
        updatedAt: Date.now(),
      });
    }

    // Restore resource stock (approximate - assumes resources weren't changed)
    const cropResources = await ctx.db
      .query("cropResources")
      .withIndex("by_crop", (q) => q.eq("cropId", allocation.cropId))
      .collect();
    
    for (const link of cropResources) {
      const resource = await ctx.db.get(link.resourceId);
      if (!resource) continue;
      
      const restoreAmount = link.requiredQuantity * allocation.allocatedQuantity;
      await ctx.db.patch(link.resourceId, {
        stockQuantity: resource.stockQuantity + restoreAmount,
        updatedAt: Date.now(),
      });
    }

    // Delete allocation
    await ctx.db.delete(args.allocationId);

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "ALLOCATION_DELETED",
      entityType: "allocation",
      entityId: args.allocationId,
      performedBy: args.userId,
      organizationId: allocation.organizationId,
      details: {
        cropId: allocation.cropId,
        warehouseId: allocation.warehouseId,
        quantity: allocation.allocatedQuantity,
      },
      timestamp: Date.now(),
    });

    return args.allocationId;
  },
});

// List all allocations
export const listAllocations = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    // Enrich with crop and warehouse details
    const enriched = await Promise.all(
      allocations.map(async (allocation) => {
        const crop = await ctx.db.get(allocation.cropId);
        const warehouse = await ctx.db.get(allocation.warehouseId);
        const user = await ctx.db.get(allocation.createdBy);
        
        return {
          ...allocation,
          cropName: crop?.name || "Unknown",
          warehouseName: warehouse?.name || "Unknown",
          createdByName: user?.name || "Unknown",
        };
      })
    );
    
    return enriched;
  },
});

// Get allocations for a specific warehouse
export const getAllocationsForWarehouse = query({
  args: { warehouseId: v.id("warehouses") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_warehouse", (q) => q.eq("warehouseId", args.warehouseId))
      .collect();
    
    const enriched = await Promise.all(
      allocations.map(async (allocation) => {
        const crop = await ctx.db.get(allocation.cropId);
        const user = await ctx.db.get(allocation.createdBy);
        
        return {
          ...allocation,
          cropName: crop?.name || "Unknown",
          createdByName: user?.name || "Unknown",
        };
      })
    );
    
    return enriched;
  },
});

// Get allocations for a specific crop
export const getAllocationsForCrop = query({
  args: { cropId: v.id("crops") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect();
    
    const enriched = await Promise.all(
      allocations.map(async (allocation) => {
        const warehouse = await ctx.db.get(allocation.warehouseId);
        const user = await ctx.db.get(allocation.createdBy);
        
        return {
          ...allocation,
          warehouseName: warehouse?.name || "Unknown",
          createdByName: user?.name || "Unknown",
        };
      })
    );
    
    return enriched;
  },
});

// Get allocation by ID
export const getAllocation = query({
  args: { id: v.id("allocations") },
  handler: async (ctx, args) => {
    const allocation = await ctx.db.get(args.id);
    if (!allocation) return null;
    
    const crop = await ctx.db.get(allocation.cropId);
    const warehouse = await ctx.db.get(allocation.warehouseId);
    const user = await ctx.db.get(allocation.createdBy);
    
    return {
      ...allocation,
      crop,
      warehouse,
      createdByUser: user,
    };
  },
});

// Get allocation summary
export const getAllocationSummary = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    const totalAllocations = allocations.length;
    const totalQuantityAllocated = allocations.reduce(
      (sum, alloc) => sum + alloc.allocatedQuantity,
      0
    );
    
    return {
      totalAllocations,
      totalQuantityAllocated,
    };
  },
});

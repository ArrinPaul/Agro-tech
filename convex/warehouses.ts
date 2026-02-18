import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new warehouse
export const createWarehouse = mutation({
  args: {
    name: v.string(),
    location: v.string(),
    totalCapacity: v.number(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    if (args.totalCapacity <= 0) {
      throw new Error("Total capacity must be greater than 0");
    }

    const warehouseId = await ctx.db.insert("warehouses", {
      name: args.name,
      location: args.location,
      totalCapacity: args.totalCapacity,
      usedCapacity: 0,
      organizationId: args.organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return warehouseId;
  },
});

// Get warehouse by ID
export const getWarehouse = query({
  args: { id: v.id("warehouses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List warehouses by organization
export const listWarehouses = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("warehouses")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

// Update warehouse
export const updateWarehouse = mutation({
  args: {
    id: v.id("warehouses"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    totalCapacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const warehouse = await ctx.db.get(args.id);
    if (!warehouse) {
      throw new Error("Warehouse not found");
    }

    const updates: any = { updatedAt: Date.now() };
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.location !== undefined) updates.location = args.location;
    if (args.totalCapacity !== undefined) {
      if (args.totalCapacity <= 0) {
        throw new Error("Total capacity must be greater than 0");
      }
      if (args.totalCapacity < warehouse.usedCapacity) {
        throw new Error("Total capacity cannot be less than used capacity");
      }
      updates.totalCapacity = args.totalCapacity;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Delete warehouse
export const deleteWarehouse = mutation({
  args: { id: v.id("warehouses") },
  handler: async (ctx, args) => {
    // Check if warehouse has allocations
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_warehouse", (q) => q.eq("warehouseId", args.id))
      .collect();
    
    if (allocations.length > 0) {
      throw new Error("Cannot delete warehouse with existing allocations");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Get warehouse utilization percentage
export const getWarehouseUtilization = query({
  args: { id: v.id("warehouses") },
  handler: async (ctx, args) => {
    const warehouse = await ctx.db.get(args.id);
    if (!warehouse) return null;
    
    return {
      warehouseId: args.id,
      name: warehouse.name,
      usedCapacity: warehouse.usedCapacity,
      totalCapacity: warehouse.totalCapacity,
      utilization: (warehouse.usedCapacity / warehouse.totalCapacity) * 100,
    };
  },
});

// Get all warehouses utilization by organization
export const getOrganizationWarehouseUtilization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    return warehouses.map(warehouse => ({
      warehouseId: warehouse._id,
      name: warehouse.name,
      usedCapacity: warehouse.usedCapacity,
      totalCapacity: warehouse.totalCapacity,
      utilization: (warehouse.usedCapacity / warehouse.totalCapacity) * 100,
    }));
  },
});

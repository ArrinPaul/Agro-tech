import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new crop
export const createCrop = mutation({
  args: {
    name: v.string(),
    quantity: v.number(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    if (args.quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }

    const cropId = await ctx.db.insert("crops", {
      name: args.name,
      quantity: args.quantity,
      status: "PLANTED",
      organizationId: args.organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return cropId;
  },
});

// Get crop by ID
export const getCrop = query({
  args: { id: v.id("crops") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List crops by organization
export const listCrops = query({
  args: { 
    organizationId: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("PLANTED"),
      v.literal("GROWING"),
      v.literal("HARVESTED"),
      v.literal("STORED")
    )),
  },
  handler: async (ctx, args) => {
    let crops = await ctx.db
      .query("crops")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    if (args.status) {
      crops = crops.filter(crop => crop.status === args.status);
    }
    
    return crops;
  },
});

// Update crop
export const updateCrop = mutation({
  args: {
    id: v.id("crops"),
    name: v.optional(v.string()),
    quantity: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("PLANTED"),
      v.literal("GROWING"),
      v.literal("HARVESTED"),
      v.literal("STORED")
    )),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, string | number> = { updatedAt: Date.now() };
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.status !== undefined) updates.status = args.status;
    if (args.quantity !== undefined) {
      if (args.quantity < 0) {
        throw new Error("Quantity cannot be negative");
      }
      updates.quantity = args.quantity;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Update crop status
export const updateCropStatus = mutation({
  args: {
    id: v.id("crops"),
    status: v.union(
      v.literal("PLANTED"),
      v.literal("GROWING"),
      v.literal("HARVESTED"),
      v.literal("STORED")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Delete crop
export const deleteCrop = mutation({
  args: { id: v.id("crops") },
  handler: async (ctx, args) => {
    // Check if crop has allocations
    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_crop", (q) => q.eq("cropId", args.id))
      .collect();
    
    if (allocations.length > 0) {
      throw new Error("Cannot delete crop with existing allocations");
    }

    // Delete crop resource links
    const cropResources = await ctx.db
      .query("cropResources")
      .withIndex("by_crop", (q) => q.eq("cropId", args.id))
      .collect();
    
    for (const link of cropResources) {
      await ctx.db.delete(link._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Get crop status distribution
export const getCropStatusDistribution = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const crops = await ctx.db
      .query("crops")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    const distribution = {
      PLANTED: 0,
      GROWING: 0,
      HARVESTED: 0,
      STORED: 0,
    };
    
    crops.forEach(crop => {
      distribution[crop.status]++;
    });
    
    return distribution;
  },
});

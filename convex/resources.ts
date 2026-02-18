import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new resource
export const createResource = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("FERTILIZER"), v.literal("PESTICIDE")),
    stockQuantity: v.number(),
    unit: v.optional(v.string()),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    if (args.stockQuantity < 0) {
      throw new Error("Stock quantity cannot be negative");
    }

    const resourceId = await ctx.db.insert("resources", {
      name: args.name,
      type: args.type,
      stockQuantity: args.stockQuantity,
      unit: args.unit,
      organizationId: args.organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return resourceId;
  },
});

// Get resource by ID
export const getResource = query({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List resources by organization
export const listResources = query({
  args: { 
    organizationId: v.id("organizations"),
    type: v.optional(v.union(v.literal("FERTILIZER"), v.literal("PESTICIDE"))),
  },
  handler: async (ctx, args) => {
    let resources = await ctx.db
      .query("resources")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    if (args.type) {
      resources = resources.filter(resource => resource.type === args.type);
    }
    
    return resources;
  },
});

// Update resource
export const updateResource = mutation({
  args: {
    id: v.id("resources"),
    name: v.optional(v.string()),
    stockQuantity: v.optional(v.number()),
    unit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = { updatedAt: Date.now() };
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.unit !== undefined) updates.unit = args.unit;
    if (args.stockQuantity !== undefined) {
      if (args.stockQuantity < 0) {
        throw new Error("Stock quantity cannot be negative");
      }
      updates.stockQuantity = args.stockQuantity;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Adjust stock (increment or decrement)
export const adjustStock = mutation({
  args: {
    id: v.id("resources"),
    delta: v.number(),
  },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    const newStock = resource.stockQuantity + args.delta;
    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    await ctx.db.patch(args.id, {
      stockQuantity: newStock,
      updatedAt: Date.now(),
    });
    
    return args.id;
  },
});

// Delete resource
export const deleteResource = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    // Check if resource is linked to any crops
    const cropResources = await ctx.db
      .query("cropResources")
      .withIndex("by_resource", (q) => q.eq("resourceId", args.id))
      .collect();
    
    if (cropResources.length > 0) {
      throw new Error("Cannot delete resource linked to crops");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Link resource to crop
export const linkResourceToCrop = mutation({
  args: {
    cropId: v.id("crops"),
    resourceId: v.id("resources"),
    requiredQuantity: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.requiredQuantity <= 0) {
      throw new Error("Required quantity must be greater than 0");
    }

    // Check if link already exists
    const existing = await ctx.db
      .query("cropResources")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect();
    
    const alreadyLinked = existing.find(link => link.resourceId === args.resourceId);
    if (alreadyLinked) {
      // Update existing link
      await ctx.db.patch(alreadyLinked._id, {
        requiredQuantity: args.requiredQuantity,
      });
      return alreadyLinked._id;
    }

    // Create new link
    const linkId = await ctx.db.insert("cropResources", {
      cropId: args.cropId,
      resourceId: args.resourceId,
      requiredQuantity: args.requiredQuantity,
      createdAt: Date.now(),
    });
    
    return linkId;
  },
});

// Unlink resource from crop
export const unlinkResourceFromCrop = mutation({
  args: {
    cropId: v.id("crops"),
    resourceId: v.id("resources"),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("cropResources")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect()
      .then(links => links.find(l => l.resourceId === args.resourceId));
    
    if (link) {
      await ctx.db.delete(link._id);
    }
    
    return args.cropId;
  },
});

// Get resources for a crop
export const getResourcesForCrop = query({
  args: { cropId: v.id("crops") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("cropResources")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect();
    
    const resources = await Promise.all(
      links.map(async (link) => {
        const resource = await ctx.db.get(link.resourceId);
        return {
          ...resource,
          requiredQuantity: link.requiredQuantity,
          linkId: link._id,
        };
      })
    );
    
    return resources;
  },
});

// Get crops using a resource
export const getCropsForResource = query({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("cropResources")
      .withIndex("by_resource", (q) => q.eq("resourceId", args.resourceId))
      .collect();
    
    const crops = await Promise.all(
      links.map(async (link) => {
        const crop = await ctx.db.get(link.cropId);
        return {
          ...crop,
          requiredQuantity: link.requiredQuantity,
          linkId: link._id,
        };
      })
    );
    
    return crops;
  },
});

// Get resource stock summary
export const getResourceStockSummary = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    return {
      totalResources: resources.length,
      fertilizers: resources.filter(r => r.type === "FERTILIZER").length,
      pesticides: resources.filter(r => r.type === "PESTICIDE").length,
      lowStock: resources.filter(r => r.stockQuantity < 100).length, // Threshold: 100
    };
  },
});

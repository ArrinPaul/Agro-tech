import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new organization
export const createOrganization = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return orgId;
  },
});

// Get organization by ID
export const getOrganization = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List all organizations
export const listOrganizations = query({
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

// Update organization
export const updateOrganization = mutation({
  args: {
    id: v.id("organizations"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Delete organization
export const deleteOrganization = mutation({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    // Check if organization has users
    const users = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.id))
      .collect();
    
    if (users.length > 0) {
      throw new Error("Cannot delete organization with existing users");
    }

    // Check if organization has warehouses
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.id))
      .collect();
    
    if (warehouses.length > 0) {
      throw new Error("Cannot delete organization with existing warehouses");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

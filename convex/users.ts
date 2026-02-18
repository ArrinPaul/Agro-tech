import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

// Create a new user (Admin only)
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("ADMIN"), v.literal("MANAGER"), v.literal("OPERATOR")),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    // Require admin access
    await requireAdmin(ctx);
    
    const userId = await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return userId;
  },
});

// Get user by ID
export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// List users by organization
export const listUsers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

// Update user role (Admin only)
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("ADMIN"), v.literal("MANAGER"), v.literal("OPERATOR")),
  },
  handler: async (ctx, args) => {
    // Require admin access
    await requireAdmin(ctx);
    
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
    return args.userId;
  },
});

// Update user organization
export const updateUserOrganization = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      organizationId: args.organizationId,
      updatedAt: Date.now(),
    });
    return args.userId;
  },
});

// Delete user (Admin only)
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Require admin access
    await requireAdmin(ctx);
    
    await ctx.db.delete(args.userId);
    return args.userId;
  },
});

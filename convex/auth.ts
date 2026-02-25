import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Internal webhook handler (called from http.ts)
export const handleWebhook = internalMutation({
  args: {
    type: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const { type, data } = args;

    if (type === "user.created") {
      // Extract user data from Clerk payload
      const userId = await ctx.db.insert("users", {
        clerkId: data.id,
        email: data.email_addresses[0]?.email_address || "",
        name: data.first_name && data.last_name 
          ? `${data.first_name} ${data.last_name}` 
          : data.first_name || data.username || data.email_addresses[0]?.email_address || "User",
        role: "OPERATOR", // Default role
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // User created successfully
      return userId;
    }

    if (type === "user.updated") {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", data.id))
        .unique();
      
      if (user) {
        await ctx.db.patch(user._id, {
          email: data.email_addresses[0]?.email_address || user.email,
          name: data.first_name && data.last_name 
            ? `${data.first_name} ${data.last_name}` 
            : data.first_name || data.username || user.name,
          updatedAt: Date.now(),
        });
      }
    }

    if (type === "user.deleted") {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", data.id))
        .unique();
      
      if (user) {
        await ctx.db.delete(user._id);
      }
    }
    
    return { success: true };
  },
});

// Helper to get user from Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get current user role
export const getUserRole = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.role;
  },
});

// Get current user from Clerk auth
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

// Create or get user — called from frontend after Clerk sign-in
// Accepts explicit args for flexibility — also works via ctx.auth when auth.config.ts is configured
export const createOrGetUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // If user has no org, assign to one
      if (!existingUser.organizationId) {
        let org = await ctx.db.query("organizations").first();
        if (!org) {
          const orgId = await ctx.db.insert("organizations", {
            name: "My Farm",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          org = await ctx.db.get(orgId);
        }
        if (org) {
          await ctx.db.patch(existingUser._id, {
            organizationId: org._id,
            updatedAt: Date.now(),
          });
          return await ctx.db.get(existingUser._id);
        }
      }
      return existingUser;
    }

    // Ensure an organization exists for the new user
    let org = await ctx.db.query("organizations").first();
    if (!org) {
      const orgId = await ctx.db.insert("organizations", {
        name: "My Farm",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      org = await ctx.db.get(orgId);
    }

    // Create new user with default OPERATOR role and organization
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name || args.email || "User",
      role: "ADMIN",
      organizationId: org!._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

// Helper: Check if user has required role
export const checkRole = query({
  args: { 
    requiredRoles: v.array(v.union(v.literal("ADMIN"), v.literal("MANAGER"), v.literal("OPERATOR")))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) return false;
    
    return args.requiredRoles.includes(user.role);
  },
});

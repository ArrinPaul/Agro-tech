import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

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
      
      console.log("User created:", userId);
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
        
        console.log("User updated:", user._id);
      }
    }

    if (type === "user.deleted") {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", data.id))
        .unique();
      
      if (user) {
        await ctx.db.delete(user._id);
        console.log("User deleted:", user._id);
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

// Create or get user (for first-time login without webhook)
export const createOrGetUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email || "",
      name: identity.name || identity.email || "User",
      role: "OPERATOR", // Default role
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

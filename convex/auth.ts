import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Webhook handler for Clerk user events
export const handleClerkWebhook = internalMutation({
  args: {
    type: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const { type, data } = args;

    if (type === "user.created") {
      // Create user in Convex
      await ctx.db.insert("users", {
        clerkId: data.id,
        email: data.email_addresses[0].email_address,
        name: data.first_name && data.last_name 
          ? `${data.first_name} ${data.last_name}` 
          : data.first_name || data.email_addresses[0].email_address,
        role: "OPERATOR", // Default role
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (type === "user.updated") {
      // Update user in Convex
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", data.id))
        .unique();
      
      if (user) {
        await ctx.db.patch(user._id, {
          email: data.email_addresses[0].email_address,
          name: data.first_name && data.last_name 
            ? `${data.first_name} ${data.last_name}` 
            : data.first_name || data.email_addresses[0].email_address,
          updatedAt: Date.now(),
        });
      }
    }

    if (type === "user.deleted") {
      // Optionally handle user deletion
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", data.id))
        .unique();
      
      if (user) {
        await ctx.db.delete(user._id);
      }
    }
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

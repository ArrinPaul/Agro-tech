// Helper functions for role-based access control

import type { QueryCtx, MutationCtx } from "../_generated/server";

export type Role = "ADMIN" | "MANAGER" | "OPERATOR";

// Get current user from context
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique();
}

// Require authentication
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Unauthorized: Must be logged in");
  }
  return user;
}

// Require specific role(s)
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Role[]
) {
  const user = await requireAuth(ctx);
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Unauthorized: Requires one of [${allowedRoles.join(", ")}] but user has ${user.role}`
    );
  }
  
  return user;
}

// Check if user has organization access
export async function requireOrganization(
  ctx: QueryCtx | MutationCtx,
  organizationId: string
) {
  const user = await requireAuth(ctx);
  
  if (user.organizationId !== organizationId) {
    throw new Error("Unauthorized: User does not belong to this organization");
  }
  
  return user;
}

// Admin only
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireRole(ctx, ["ADMIN"]);
}

// Manager or Admin
export async function requireManager(ctx: QueryCtx | MutationCtx) {
  return await requireRole(ctx, ["ADMIN", "MANAGER"]);
}

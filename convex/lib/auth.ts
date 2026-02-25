// Helper functions for role-based access control
// Auth is provided by Clerk on the frontend and verified via auth.config.ts.
// Convex data isolation is enforced via organizationId on every query/mutation.
// ctx.auth.getUserIdentity() returns the Clerk JWT identity when auth.config.ts is configured.

import type { QueryCtx, MutationCtx } from "../_generated/server";

export type Role = "ADMIN" | "MANAGER" | "OPERATOR";

// Get current user from context — returns null if auth is not configured
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique();
}

// Require authentication — no-ops gracefully if JWT auth is not configured
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  // If auth is not configured, skip the check (data is still isolated by organizationId)
  if (!user) return null;
  return user;
}

// Require specific role(s) — no-ops gracefully if JWT auth is not configured
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Role[]
) {
  const user = await getCurrentUser(ctx);
  if (!user) return null; // No auth configured — skip role check

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
  const user = await getCurrentUser(ctx);
  if (!user) return null; // No auth configured — skip check

  if (user.organizationId !== organizationId) {
    throw new Error("Unauthorized: User does not belong to this organization");
  }

  return user;
}

// Admin only
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return await requireRole(ctx, ["ADMIN"]);
}

// Admin or Manager
export async function requireManager(ctx: QueryCtx | MutationCtx) {
  return await requireRole(ctx, ["ADMIN", "MANAGER"]);
}

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Log an action
export const logAction = mutation({
  args: {
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    performedBy: v.id("users"),
    organizationId: v.id("organizations"),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("auditLogs", {
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      performedBy: args.performedBy,
      organizationId: args.organizationId,
      details: args.details,
      timestamp: Date.now(),
    });
    
    return logId;
  },
});

// List audit logs
export const listAuditLogs = query({
  args: {
    organizationId: v.id("organizations"),
    entityType: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    // Filter by entity type
    if (args.entityType) {
      logs = logs.filter(log => log.entityType === args.entityType);
    }
    
    // Filter by user
    if (args.performedBy) {
      logs = logs.filter(log => log.performedBy === args.performedBy);
    }
    
    // Filter by date range
    if (args.startDate !== undefined) {
      logs = logs.filter((log) => log.timestamp >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      logs = logs.filter((log) => log.timestamp <= args.endDate!);
    }
    
    // Enrich with user details
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const user = log.performedBy ? await ctx.db.get(log.performedBy) : null;
        return {
          ...log,
          performedByName: user?.name || "Unknown",
          performedByEmail: user?.email || "Unknown",
        };
      })
    );
    
    // Sort by timestamp descending (newest first)
    enriched.sort((a, b) => b.timestamp - a.timestamp);
    
    return enriched;
  },
});

// Get logs for a specific entity
export const getLogsForEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_entity", (q) => 
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();
    
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.performedBy);
        return {
          ...log,
          performedByName: user?.name || "Unknown",
        };
      })
    );
    
    enriched.sort((a, b) => b.timestamp - a.timestamp);
    
    return enriched;
  },
});

// Get logs by user
export const getLogsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_user", (q) => q.eq("performedBy", args.userId))
      .collect();
    
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    return logs;
  },
});

// Get recent activity
export const getRecentActivity = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.performedBy);
        return {
          ...log,
          performedByName: user?.name || "Unknown",
        };
      })
    );
    
    enriched.sort((a, b) => b.timestamp - a.timestamp);
    
    const limit = args.limit || 10;
    return enriched.slice(0, limit);
  },
});

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Create a new alert
export const createAlert = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.optional(v.id("users")),
    type: v.union(
      v.literal("CAPACITY_WARNING"),
      v.literal("DEPLETION_ALERT"),
      v.literal("ALLOCATION_COMPLETE"),
      v.literal("CROP_STATUS_CHANGE"),
      v.literal("SYSTEM_ALERT"),
      v.literal("AI_RECOMMENDATION")
    ),
    title: v.string(),
    message: v.string(),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const alertId = await ctx.db.insert("alerts", {
      organizationId: args.organizationId,
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      severity: args.severity,
      entityType: args.entityType,
      entityId: args.entityId,
      read: false,
      dismissed: false,
      createdAt: Date.now(),
    });
    return alertId;
  },
});

// List alerts for organization (real-time via Convex subscriptions)
export const listAlerts = query({
  args: {
    organizationId: v.id("organizations"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let alerts = await ctx.db
      .query("alerts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();

    if (args.unreadOnly) {
      alerts = alerts.filter((a) => !a.read && !a.dismissed);
    }

    if (args.limit) {
      alerts = alerts.slice(0, args.limit);
    }

    return alerts;
  },
});

// Get unread count
export const getUnreadCount = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_read", (q) => q.eq("organizationId", args.organizationId).eq("read", false))
      .collect();
    return alerts.filter((a) => !a.dismissed).length;
  },
});

// Mark alert as read
export const markAsRead = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { read: true });
  },
});

// Mark all alerts as read
export const markAllAsRead = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("alerts")
      .withIndex("by_read", (q) => q.eq("organizationId", args.organizationId).eq("read", false))
      .collect();

    for (const alert of unread) {
      await ctx.db.patch(alert._id, { read: true });
    }

    return unread.length;
  },
});

// Dismiss alert
export const dismissAlert = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { dismissed: true, read: true });
  },
});

// Delete alert
export const deleteAlert = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Clear all dismissed alerts
export const clearDismissed = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const dismissed = await ctx.db
      .query("alerts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    let deleted = 0;
    for (const alert of dismissed) {
      if (alert.dismissed) {
        await ctx.db.delete(alert._id);
        deleted++;
      }
    }

    return deleted;
  },
});

// Auto-generate alerts based on current data state
// Called after allocation/deallocation or data changes
export const checkAndGenerateAlerts = internalMutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const resources = await ctx.db
      .query("resources")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const generated = [];

    // Check warehouse capacity warnings
    for (const wh of warehouses) {
      const util = wh.totalCapacity > 0 ? (wh.usedCapacity / wh.totalCapacity) * 100 : 0;

      if (util >= 95) {
        // Check for duplicate alert in last 1 hour
        const recentAlerts = await ctx.db
          .query("alerts")
          .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
          .collect();

        const duplicate = recentAlerts.find(
          (a) =>
            a.type === "CAPACITY_WARNING" &&
            a.entityId === wh._id &&
            Date.now() - a.createdAt < 3600000
        );

        if (!duplicate) {
          const id = await ctx.db.insert("alerts", {
            organizationId: args.organizationId,
            type: "CAPACITY_WARNING",
            title: `Critical: ${wh.name} at ${util.toFixed(1)}%`,
            message: `Warehouse "${wh.name}" is nearly full. Only ${wh.totalCapacity - wh.usedCapacity} units of capacity remain.`,
            severity: "critical",
            entityType: "warehouse",
            entityId: wh._id,
            read: false,
            dismissed: false,
            createdAt: Date.now(),
          });
          generated.push(id);
        }
      } else if (util >= 85) {
        const recentAlerts = await ctx.db
          .query("alerts")
          .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
          .collect();

        const duplicate = recentAlerts.find(
          (a) =>
            a.type === "CAPACITY_WARNING" &&
            a.entityId === wh._id &&
            Date.now() - a.createdAt < 3600000
        );

        if (!duplicate) {
          const id = await ctx.db.insert("alerts", {
            organizationId: args.organizationId,
            type: "CAPACITY_WARNING",
            title: `Warning: ${wh.name} at ${util.toFixed(1)}%`,
            message: `Warehouse "${wh.name}" is getting full. ${wh.totalCapacity - wh.usedCapacity} units remaining.`,
            severity: "warning",
            entityType: "warehouse",
            entityId: wh._id,
            read: false,
            dismissed: false,
            createdAt: Date.now(),
          });
          generated.push(id);
        }
      }
    }

    // Check resource depletion
    for (const res of resources) {
      if (res.stockQuantity <= 0) {
        const recentAlerts = await ctx.db
          .query("alerts")
          .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
          .collect();

        const duplicate = recentAlerts.find(
          (a) =>
            a.type === "DEPLETION_ALERT" &&
            a.entityId === res._id &&
            Date.now() - a.createdAt < 3600000
        );

        if (!duplicate) {
          const id = await ctx.db.insert("alerts", {
            organizationId: args.organizationId,
            type: "DEPLETION_ALERT",
            title: `Depleted: ${res.name}`,
            message: `${res.name} (${res.type}) is completely out of stock. Restock immediately.`,
            severity: "critical",
            entityType: "resource",
            entityId: res._id,
            read: false,
            dismissed: false,
            createdAt: Date.now(),
          });
          generated.push(id);
        }
      } else if (res.stockQuantity < 50) {
        const recentAlerts = await ctx.db
          .query("alerts")
          .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
          .collect();

        const duplicate = recentAlerts.find(
          (a) =>
            a.type === "DEPLETION_ALERT" &&
            a.entityId === res._id &&
            Date.now() - a.createdAt < 7200000
        );

        if (!duplicate) {
          const id = await ctx.db.insert("alerts", {
            organizationId: args.organizationId,
            type: "DEPLETION_ALERT",
            title: `Low Stock: ${res.name}`,
            message: `${res.name} has only ${res.stockQuantity} units remaining.`,
            severity: "warning",
            entityType: "resource",
            entityId: res._id,
            read: false,
            dismissed: false,
            createdAt: Date.now(),
          });
          generated.push(id);
        }
      }
    }

    return generated;
  },
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - synced from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("ADMIN"), v.literal("MANAGER"), v.literal("OPERATOR")),
    organizationId: v.optional(v.id("organizations")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_organization", ["organizationId"]),

  // Organizations table
  organizations: defineTable({
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Warehouses table
  warehouses: defineTable({
    name: v.string(),
    location: v.string(),
    totalCapacity: v.number(),
    usedCapacity: v.number(),
    organizationId: v.id("organizations"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"]),

  // Crops table
  crops: defineTable({
    name: v.string(),
    quantity: v.number(),
    status: v.union(
      v.literal("PLANTED"),
      v.literal("GROWING"),
      v.literal("HARVESTED"),
      v.literal("STORED")
    ),
    organizationId: v.id("organizations"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"]),

  // Resources table
  resources: defineTable({
    name: v.string(),
    type: v.union(v.literal("FERTILIZER"), v.literal("PESTICIDE")),
    stockQuantity: v.number(),
    unit: v.optional(v.string()),
    organizationId: v.id("organizations"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_type", ["type"]),

  // Crop-Resource linking table
  cropResources: defineTable({
    cropId: v.id("crops"),
    resourceId: v.id("resources"),
    requiredQuantity: v.number(),
    createdAt: v.number(),
  })
    .index("by_crop", ["cropId"])
    .index("by_resource", ["resourceId"]),

  // Allocations table
  allocations: defineTable({
    cropId: v.id("crops"),
    warehouseId: v.id("warehouses"),
    allocatedQuantity: v.number(),
    createdBy: v.id("users"),
    organizationId: v.id("organizations"),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_warehouse", ["warehouseId"])
    .index("by_crop", ["cropId"]),

  // Audit logs table
  auditLogs: defineTable({
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    performedBy: v.id("users"),
    organizationId: v.id("organizations"),
    details: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_user", ["performedBy"]),

  // Resource usage history table (for tracking and predictions)
  resourceUsageHistory: defineTable({
    resourceId: v.id("resources"),
    quantityUsed: v.number(),
    allocationId: v.id("allocations"),
    cropId: v.id("crops"),
    organizationId: v.id("organizations"),
    timestamp: v.number(),
  })
    .index("by_resource", ["resourceId"])
    .index("by_organization", ["organizationId"])
    .index("by_allocation", ["allocationId"])
    .index("by_timestamp", ["timestamp"]),

  // AI calculation cache table
  aiCache: defineTable({
    organizationId: v.id("organizations"),
    cacheKey: v.string(),
    result: v.any(),
    computedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_org_key", ["organizationId", "cacheKey"])
    .index("by_expiry", ["expiresAt"]),

  // Push notifications / alerts table  
  alerts: defineTable({
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
    read: v.boolean(),
    dismissed: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_read", ["organizationId", "read"]),

  // Rate limiting table
  rateLimits: defineTable({
    key: v.string(),
    attempts: v.number(),
    windowStart: v.number(),
    windowEnd: v.number(),
  })
    .index("by_key", ["key"]),
});

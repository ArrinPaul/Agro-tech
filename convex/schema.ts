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
});

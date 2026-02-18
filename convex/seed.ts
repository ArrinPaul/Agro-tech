/**
 * Data Seeding Script for AgroTech Platform
 * 
 * This script helps seed initial data for testing Phase 2 & 3.
 * Run this after setting up your Convex backend.
 * 
 * HOW TO USE:
 * 1. Make sure you have an organization created first
 * 2. Copy this code into Convex dashboard Functions tab
 * 3. Or create a mutation and call it from frontend
 * 4. Update organizationId with your actual organization ID
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedData = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { organizationId } = args;
    
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user) {
      throw new Error("User not found");
    }

    console.log("Starting data seeding for org:", organizationId);

    // Create warehouses
    const warehouse1 = await ctx.db.insert("warehouses", {
      name: "Central Silo A",
      location: "North Field",
      totalCapacity: 1000,
      usedCapacity: 0,
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const warehouse2 = await ctx.db.insert("warehouses", {
      name: "Cold Storage B",
      location: "South Complex",
      totalCapacity: 500,
      usedCapacity: 0,
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const warehouse3 = await ctx.db.insert("warehouses", {
      name: "Grain Depot C",
      location: "East Wing",
      totalCapacity: 2000,
      usedCapacity: 0,
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const warehouse4 = await ctx.db.insert("warehouses", {
      name: "Open Yard D",
      location: "West Perimeter",
      totalCapacity: 800,
      usedCapacity: 0,
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("✓ Created 4 warehouses");

    // Create crops
    const crop1 = await ctx.db.insert("crops", {
      name: "Wheat",
      quantity: 500,
      status: "HARVESTED",
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const crop2 = await ctx.db.insert("crops", {
      name: "Rice",
      quantity: 300,
      status: "GROWING",
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const crop3 = await ctx.db.insert("crops", {
      name: "Corn",
      quantity: 700,
      status: "PLANTED",
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const crop4 = await ctx.db.insert("crops", {
      name: "Soybean",
      quantity: 200,
      status: "STORED",
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("✓ Created 4 crops");

    // Create resources
    const resource1 = await ctx.db.insert("resources", {
      name: "NPK Fertilizer",
      type: "FERTILIZER",
      stockQuantity: 120,
      unit: "kg",
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const resource2 = await ctx.db.insert("resources", {
      name: "Urea",
      type: "FERTILIZER",
      stockQuantity: 300,
      unit: "kg",
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const resource3 = await ctx.db.insert("resources", {
      name: "Glyphosate",
      type: "PESTICIDE",
      stockQuantity: 50,
      unit: "L",
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const resource4 = await ctx.db.insert("resources", {
      name: "Chlorpyrifos",
      type: "PESTICIDE",
      stockQuantity: 85,
      unit: "L",
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("✓ Created 4 resources");

    // Link resources to crops
    await ctx.db.insert("cropResources", {
      cropId: crop1,
      resourceId: resource1,
      requiredQuantity: 2,
      createdAt: Date.now(),
    });

    await ctx.db.insert("cropResources", {
      cropId: crop2,
      resourceId: resource2,
      requiredQuantity: 1,
      createdAt: Date.now(),
    });

    await ctx.db.insert("cropResources", {
      cropId: crop3,
      resourceId: resource1,
      requiredQuantity: 3,
      createdAt: Date.now(),
    });

    await ctx.db.insert("cropResources", {
      cropId: crop3,
      resourceId: resource4,
      requiredQuantity: 1,
      createdAt: Date.now(),
    });

    await ctx.db.insert("cropResources", {
      cropId: crop4,
      resourceId: resource3,
      requiredQuantity: 2,
      createdAt: Date.now(),
    });

    console.log("✓ Linked resources to crops");

    // Create sample allocations
    // Allocation 1: Wheat to Central Silo A
    const allocation1 = await ctx.db.insert("allocations", {
      cropId: crop1,
      warehouseId: warehouse1,
      allocatedQuantity: 200,
      createdBy: user._id,
      organizationId,
      createdAt: Date.now() - 86400000 * 7, // 7 days ago
    });

    // Update warehouse capacity
    await ctx.db.patch(warehouse1, {
      usedCapacity: 200,
      updatedAt: Date.now(),
    });

    // Deduct resources
    await ctx.db.patch(resource1, {
      stockQuantity: 120 - (2 * 200), // 2 kg per unit * 200 units
      updatedAt: Date.now(),
    });

    // Allocation 2: Soybean to Cold Storage B
    const allocation2 = await ctx.db.insert("allocations", {
      cropId: crop4,
      warehouseId: warehouse2,
      allocatedQuantity: 150,
      createdBy: user._id,
      organizationId,
      createdAt: Date.now() - 86400000 * 3, // 3 days ago
    });

    // Update warehouse capacity
    await ctx.db.patch(warehouse2, {
      usedCapacity: 150,
      updatedAt: Date.now(),
    });

    // Deduct resources
    await ctx.db.patch(resource3, {
      stockQuantity: 50 - (2 * 150),
      updatedAt: Date.now(),
    });

    console.log("✓ Created 2 sample allocations");

    // Create audit logs
    await ctx.db.insert("auditLogs", {
      action: "SEED_DATA",
      entityType: "system",
      entityId: organizationId,
      performedBy: user._id,
      organizationId,
      details: {
        warehouses: 4,
        crops: 4,
        resources: 4,
        allocations: 2,
      },
      timestamp: Date.now(),
    });

    console.log("✓ Created audit log");

    return {
      success: true,
      created: {
        warehouses: 4,
        crops: 4,
        resources: 4,
        cropResourceLinks: 5,
        allocations: 2,
      },
      ids: {
        warehouses: [warehouse1, warehouse2, warehouse3, warehouse4],
        crops: [crop1, crop2, crop3, crop4],
        resources: [resource1, resource2, resource3, resource4],
        allocations: [allocation1, allocation2],
      },
    };
  },
});

// Helper to create a default organization
export const createDefaultOrganization = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log("✓ Created organization:", args.name);
    
    return orgId;
  },
});

// All-in-one setup: create org and seed data
export const setupTestEnvironment = mutation({
  args: {
    organizationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orgName = args.organizationName || "AgroTech Farm Co.";
    
    // Check if org already exists
    const existingOrgs = await ctx.db.query("organizations").collect();
    let orgId;
    
    if (existingOrgs.length > 0) {
      orgId = existingOrgs[0]._id;
      console.log("✓ Using existing organization:", existingOrgs[0].name);
    } else {
      orgId = await ctx.db.insert("organizations", {
        name: orgName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log("✓ Created new organization:", orgName);
    }
    
    // Get current user and assign to org
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      
      if (user && !user.organizationId) {
        await ctx.db.patch(user._id, {
          organizationId: orgId,
          updatedAt: Date.now(),
        });
        console.log("✓ Assigned user to organization");
      }
    }
    
    // Check if data already exists
    const existingWarehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();
    
    if (existingWarehouses.length > 0) {
      return {
        success: true,
        message: "Organization already has data. Skipping seed.",
        organizationId: orgId,
      };
    }
    
    // Temporarily expose seedData functionality inline
    // (Since we can't call exported mutations from other mutations directly)
    
    return {
      success: true,
      message: "Organization created. Use seedData mutation with this organizationId to populate data.",
      organizationId: orgId,
    };
  },
});

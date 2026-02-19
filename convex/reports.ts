import { v } from "convex/values";
import { query } from "./_generated/server";

// Warehouse utilization report
export const getWarehouseReport = query({
  args: {
    organizationId: v.id("organizations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    const report = await Promise.all(
      warehouses.map(async (warehouse) => {
        // Get allocations for this warehouse
        const allocations = await ctx.db
          .query("allocations")
          .withIndex("by_warehouse", (q) => q.eq("warehouseId", warehouse._id))
          .collect();
        
        // Filter by date range if provided
        const filteredAllocations = allocations.filter((a) => {
          if (args.startDate && a.createdAt < args.startDate) return false;
          if (args.endDate && a.createdAt > args.endDate) return false;
          return true;
        });
        
        const totalAllocations = filteredAllocations.length;
        const totalQuantityAllocated = filteredAllocations.reduce((sum, a) => sum + a.allocatedQuantity, 0);
        const utilizationPercent = warehouse.totalCapacity > 0 
          ? Math.round((warehouse.usedCapacity / warehouse.totalCapacity) * 100) 
          : 0;
        
        return {
          warehouseId: warehouse._id,
          warehouseName: warehouse.name,
          location: warehouse.location,
          totalCapacity: warehouse.totalCapacity,
          usedCapacity: warehouse.usedCapacity,
          remainingCapacity: warehouse.totalCapacity - warehouse.usedCapacity,
          utilizationPercent,
          totalAllocations,
          totalQuantityAllocated,
          status: utilizationPercent > 90 ? "critical" : utilizationPercent > 70 ? "warning" : "healthy",
        };
      })
    );
    
    // Summary statistics
    const summary = {
      totalWarehouses: warehouses.length,
      totalCapacity: warehouses.reduce((sum, w) => sum + w.totalCapacity, 0),
      totalUsed: warehouses.reduce((sum, w) => sum + w.usedCapacity, 0),
      averageUtilization: Math.round(
        (warehouses.reduce((sum, w) => sum + (w.usedCapacity / w.totalCapacity) * 100, 0)) / 
        Math.max(warehouses.length, 1)
      ),
      criticalCount: report.filter(r => r.status === "critical").length,
      warningCount: report.filter(r => r.status === "warning").length,
    };
    
    return {
      summary,
      warehouses: report,
      dateRange: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      generatedAt: Date.now(),
    };
  },
});

// Allocation activity report
export const getAllocationReport = query({
  args: {
    organizationId: v.id("organizations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let allocations = await ctx.db
      .query("allocations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    // Filter by date range
    allocations = allocations.filter((a) => {
      if (args.startDate && a.createdAt < args.startDate) return false;
      if (args.endDate && a.createdAt > args.endDate) return false;
      return true;
    });
    
    // Enrich with related data
    const enrichedAllocations = await Promise.all(
      allocations.map(async (allocation) => {
        const crop = await ctx.db.get(allocation.cropId);
        const warehouse = await ctx.db.get(allocation.warehouseId);
        const user = await ctx.db.get(allocation.createdBy);
        
        return {
          allocationId: allocation._id,
          cropName: crop?.name || "Unknown",
          warehouseName: warehouse?.name || "Unknown",
          quantity: allocation.allocatedQuantity,
          createdBy: user?.name || "Unknown",
          createdAt: allocation.createdAt,
        };
      })
    );
    
    // Group by crop
    const byCrop: Record<string, { cropName: string; totalQuantity: number; allocationCount: number }> = {};
    for (const allocation of enrichedAllocations) {
      if (!byCrop[allocation.cropName]) {
        byCrop[allocation.cropName] = { cropName: allocation.cropName, totalQuantity: 0, allocationCount: 0 };
      }
      byCrop[allocation.cropName].totalQuantity += allocation.quantity;
      byCrop[allocation.cropName].allocationCount += 1;
    }
    
    // Group by warehouse
    const byWarehouse: Record<string, { warehouseName: string; totalQuantity: number; allocationCount: number }> = {};
    for (const allocation of enrichedAllocations) {
      if (!byWarehouse[allocation.warehouseName]) {
        byWarehouse[allocation.warehouseName] = { warehouseName: allocation.warehouseName, totalQuantity: 0, allocationCount: 0 };
      }
      byWarehouse[allocation.warehouseName].totalQuantity += allocation.quantity;
      byWarehouse[allocation.warehouseName].allocationCount += 1;
    }
    
    // Group by time period (daily)
    const byDate: Record<string, { date: string; count: number; totalQuantity: number }> = {};
    for (const allocation of enrichedAllocations) {
      const date = new Date(allocation.createdAt).toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { date, count: 0, totalQuantity: 0 };
      }
      byDate[date].count += 1;
      byDate[date].totalQuantity += allocation.quantity;
    }
    
    const summary = {
      totalAllocations: allocations.length,
      totalQuantity: allocations.reduce((sum, a) => sum + a.allocatedQuantity, 0),
      averageQuantity: allocations.length > 0 
        ? Math.round(allocations.reduce((sum, a) => sum + a.allocatedQuantity, 0) / allocations.length) 
        : 0,
      uniqueCrops: Object.keys(byCrop).length,
      uniqueWarehouses: Object.keys(byWarehouse).length,
    };
    
    return {
      summary,
      allocations: enrichedAllocations,
      byCrop: Object.values(byCrop),
      byWarehouse: Object.values(byWarehouse),
      byDate: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)),
      dateRange: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      generatedAt: Date.now(),
    };
  },
});

// Resource usage report
export const getResourceUsageReport = query({
  args: {
    organizationId: v.id("organizations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    // Get allocations in date range to calculate resource consumption
    let allocations = await ctx.db
      .query("allocations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    // Filter by date range
    allocations = allocations.filter((a) => {
      if (args.startDate && a.createdAt < args.startDate) return false;
      if (args.endDate && a.createdAt > args.endDate) return false;
      return true;
    });
    
    // Calculate resource consumption per resource
    const resourceUsage = await Promise.all(
      resources.map(async (resource) => {
        // Get all crop-resource links for this resource
        const cropResourceLinks = await ctx.db
          .query("cropResources")
          .withIndex("by_resource", (q) => q.eq("resourceId", resource._id))
          .collect();
        
        // Calculate consumption from allocations
        let totalConsumed = 0;
        const consumptionByCrop: Record<string, { cropName: string; consumed: number; allocations: number }> = {};
        
        for (const allocation of allocations) {
          const link = cropResourceLinks.find(l => l.cropId === allocation.cropId);
          if (link) {
            const consumed = link.requiredQuantity * allocation.allocatedQuantity;
            totalConsumed += consumed;
            
            const crop = await ctx.db.get(allocation.cropId);
            const cropName = crop?.name || "Unknown";
            if (!consumptionByCrop[cropName]) {
              consumptionByCrop[cropName] = { cropName, consumed: 0, allocations: 0 };
            }
            consumptionByCrop[cropName].consumed += consumed;
            consumptionByCrop[cropName].allocations += 1;
          }
        }
        
        const daysInRange = args.startDate && args.endDate 
          ? Math.max(1, (args.endDate - args.startDate) / 86400000)
          : 30; // Default to 30 days
        
        const averageDailyUsage = totalConsumed / daysInRange;
        const daysUntilDepletion = resource.stockQuantity > 0 && averageDailyUsage > 0
          ? Math.floor(resource.stockQuantity / averageDailyUsage)
          : null;
        
        return {
          resourceId: resource._id,
          resourceName: resource.name,
          type: resource.type,
          currentStock: resource.stockQuantity,
          totalConsumed,
          averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
          daysUntilDepletion,
          status: daysUntilDepletion !== null && daysUntilDepletion < 7 
            ? "critical" 
            : daysUntilDepletion !== null && daysUntilDepletion < 30 
              ? "warning" 
              : resource.stockQuantity === 0 
                ? "depleted" 
                : "healthy",
          consumptionByCrop: Object.values(consumptionByCrop),
        };
      })
    );
    
    const summary = {
      totalResources: resources.length,
      fertilizers: resources.filter(r => r.type === "FERTILIZER").length,
      pesticides: resources.filter(r => r.type === "PESTICIDE").length,
      depleted: resourceUsage.filter(r => r.status === "depleted").length,
      critical: resourceUsage.filter(r => r.status === "critical").length,
      warning: resourceUsage.filter(r => r.status === "warning").length,
      healthy: resourceUsage.filter(r => r.status === "healthy").length,
      totalConsumed: resourceUsage.reduce((sum, r) => sum + r.totalConsumed, 0),
    };
    
    return {
      summary,
      resources: resourceUsage,
      dateRange: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      generatedAt: Date.now(),
    };
  },
});

// Crop performance report
export const getCropReport = query({
  args: {
    organizationId: v.id("organizations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const crops = await ctx.db
      .query("crops")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    // Get allocations for date range
    let allocations = await ctx.db
      .query("allocations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    allocations = allocations.filter((a) => {
      if (args.startDate && a.createdAt < args.startDate) return false;
      if (args.endDate && a.createdAt > args.endDate) return false;
      return true;
    });
    
    const cropPerformance = await Promise.all(
      crops.map(async (crop) => {
        const cropAllocations = allocations.filter(a => a.cropId === crop._id);
        const totalAllocated = cropAllocations.reduce((sum, a) => sum + a.allocatedQuantity, 0);
        const allocationCount = cropAllocations.length;
        const averageAllocation = allocationCount > 0 ? Math.round(totalAllocated / allocationCount) : 0;
        
        // Get resource requirements
        const resourceLinks = await ctx.db
          .query("cropResources")
          .withIndex("by_crop", (q) => q.eq("cropId", crop._id))
          .collect();
        
        const resourceRequirements = await Promise.all(
          resourceLinks.map(async (link) => {
            const resource = await ctx.db.get(link.resourceId);
            return {
              resourceName: resource?.name || "Unknown",
              requiredPerUnit: link.requiredQuantity,
              totalUsed: link.requiredQuantity * totalAllocated,
            };
          })
        );
        
        return {
          cropId: crop._id,
          cropName: crop.name,
          status: crop.status,
          totalQuantity: crop.quantity,
          totalAllocated,
          remainingQuantity: crop.quantity - totalAllocated,
          allocationCount,
          averageAllocation,
          allocationRate: crop.quantity > 0 ? Math.round((totalAllocated / crop.quantity) * 100) : 0,
          resourceRequirements,
        };
      })
    );
    
    // Group by status
    const byStatus: Record<string, number> = {
      PLANTED: 0,
      GROWING: 0,
      HARVESTED: 0,
      STORED: 0,
    };
    crops.forEach(crop => {
      byStatus[crop.status] = (byStatus[crop.status] || 0) + 1;
    });
    
    const summary = {
      totalCrops: crops.length,
      totalQuantity: crops.reduce((sum, c) => sum + c.quantity, 0),
      totalAllocated: cropPerformance.reduce((sum, c) => sum + c.totalAllocated, 0),
      byStatus,
    };
    
    return {
      summary,
      crops: cropPerformance,
      dateRange: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      generatedAt: Date.now(),
    };
  },
});

// Comprehensive dashboard summary
export const getDashboardSummary = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const [warehouses, crops, resources, allocations, auditLogs] = await Promise.all([
      ctx.db
        .query("warehouses")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect(),
      ctx.db
        .query("crops")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect(),
      ctx.db
        .query("resources")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect(),
      ctx.db
        .query("allocations")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect(),
      ctx.db
        .query("auditLogs")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .order("desc")
        .take(10),
    ]);
    
    // Calculate warehouse utilization
    const warehouseUtilization = warehouses.map(w => ({
      id: w._id,
      name: w.name,
      utilization: w.totalCapacity > 0 ? Math.round((w.usedCapacity / w.totalCapacity) * 100) : 0,
    }));
    
    // Allocation trend (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const recentAllocations = allocations.filter(a => a.createdAt >= thirtyDaysAgo);
    
    // Group by day
    const allocationTrend: Record<string, number> = {};
    recentAllocations.forEach(a => {
      const date = new Date(a.createdAt).toISOString().split('T')[0];
      allocationTrend[date] = (allocationTrend[date] || 0) + 1;
    });
    
    // Crop status distribution
    const cropStatusDistribution = {
      PLANTED: crops.filter(c => c.status === "PLANTED").length,
      GROWING: crops.filter(c => c.status === "GROWING").length,
      HARVESTED: crops.filter(c => c.status === "HARVESTED").length,
      STORED: crops.filter(c => c.status === "STORED").length,
    };

    const avgUtilization = warehouses.length > 0
      ? warehouses.reduce((sum, w) => sum + (w.totalCapacity > 0 ? (w.usedCapacity / w.totalCapacity) * 100 : 0), 0) / warehouses.length
      : 0;

    const resourceStatus = {
      inStock: resources.filter(r => r.stockQuantity >= 50).length,
      lowStock: resources.filter(r => r.stockQuantity > 0 && r.stockQuantity < 50).length,
      outOfStock: resources.filter(r => r.stockQuantity === 0).length,
    };

    return {
      summary: {
        totalWarehouses: warehouses.length,
        totalCrops: crops.length,
        totalAllocations: allocations.length,
        avgUtilization,
      },
      warehouseUtilization,
      resourceStatus,
      allocationTrend: Object.entries(allocationTrend)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      cropStatusDistribution,
      recentActivity: auditLogs,
      generatedAt: Date.now(),
    };
  },
});

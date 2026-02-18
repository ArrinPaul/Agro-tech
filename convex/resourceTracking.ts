import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Track resource usage event (called automatically during allocations)
export const trackResourceUsage = mutation({
  args: {
    resourceId: v.id("resources"),
    quantityUsed: v.number(),
    allocationId: v.id("allocations"),
    cropId: v.id("crops"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("resourceUsageHistory", {
      resourceId: args.resourceId,
      quantityUsed: args.quantityUsed,
      allocationId: args.allocationId,
      cropId: args.cropId,
      organizationId: args.organizationId,
      timestamp: Date.now(),
    });
    
    return true;
  },
});

// Get resource usage history for a specific resource
export const getResourceUsageHistory = query({
  args: {
    resourceId: v.id("resources"),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack || 90;
    const startDate = Date.now() - (daysBack * 86400000);
    
    // Get all allocations instead of usage history
    const allocations = await ctx.db.query("allocations").collect();
    
    // Filter allocations that used this resource
    const cropResourceLinks = await ctx.db
      .query("cropResources")
      .withIndex("by_resource", (q) => q.eq("resourceId", args.resourceId))
      .collect();
    
    const cropIds = cropResourceLinks.map(link => link.cropId);
    
    const relevantAllocations = allocations.filter(a => 
      cropIds.includes(a.cropId) && a.createdAt >= startDate
    );
    
    // Calculate usage from allocations
    const usage = await Promise.all(
      relevantAllocations.map(async (allocation) => {
        const link = cropResourceLinks.find(l => l.cropId === allocation.cropId);
        const crop = await ctx.db.get(allocation.cropId);
        
        return {
          timestamp: allocation.createdAt,
          quantityUsed: link ? link.requiredQuantity * allocation.allocatedQuantity : 0,
          allocationId: allocation._id,
          cropName: crop?.name || "Unknown",
        };
      })
    );
    
    return usage.sort((a, b) => a.timestamp - b.timestamp);
  },
});

// Calculate resource depletion prediction with historical data
export const predictResourceDepletion = query({
  args: { 
    resourceId: v.id("resources"),
    lookbackDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) {
      throw new Error("Resource not found");
    }
    
    const lookbackDays = args.lookbackDays || 30;
    const startDate = Date.now() - (lookbackDays * 86400000);
    
    // Get usage history
    const cropResourceLinks = await ctx.db
      .query("cropResources")
      .withIndex("by_resource", (q) => q.eq("resourceId", args.resourceId))
      .collect();
    
    const cropIds = cropResourceLinks.map(link => link.cropId);
    const allocations = await ctx.db.query("allocations").collect();
    
    const recentAllocations = allocations.filter(a => 
      cropIds.includes(a.cropId) && a.createdAt >= startDate
    );
    
    // Calculate total usage
    let totalUsage = 0;
    for (const allocation of recentAllocations) {
      const link = cropResourceLinks.find(l => l.cropId === allocation.cropId);
      if (link) {
        totalUsage += link.requiredQuantity * allocation.allocatedQuantity;
      }
    }
    
    // Calculate rates
    const days = Math.max(1, (Date.now() - startDate) / 86400000);
    const averageDailyUsage = totalUsage / days;
    const averageWeeklyUsage = averageDailyUsage * 7;
    const averageMonthlyUsage = averageDailyUsage * 30;
    
    // Predict depletion
    const daysUntilDepletion = averageDailyUsage > 0 
      ? Math.floor(resource.stockQuantity / averageDailyUsage) 
      : null;
    
    const depletionDate = daysUntilDepletion !== null
      ? Date.now() + (daysUntilDepletion * 86400000)
      : null;
    
    // Calculate trend (increasing, stable, decreasing usage)
    const midpoint = startDate + ((Date.now() - startDate) / 2);
    const firstHalfAllocations = recentAllocations.filter(a => a.createdAt < midpoint);
    const secondHalfAllocations = recentAllocations.filter(a => a.createdAt >= midpoint);
    
    let firstHalfUsage = 0;
    let secondHalfUsage = 0;
    
    for (const allocation of firstHalfAllocations) {
      const link = cropResourceLinks.find(l => l.cropId === allocation.cropId);
      if (link) firstHalfUsage += link.requiredQuantity * allocation.allocatedQuantity;
    }
    
    for (const allocation of secondHalfAllocations) {
      const link = cropResourceLinks.find(l => l.cropId === allocation.cropId);
      if (link) secondHalfUsage += link.requiredQuantity * allocation.allocatedQuantity;
    }
    
    const trend = secondHalfUsage > firstHalfUsage * 1.1 
      ? "increasing" 
      : secondHalfUsage < firstHalfUsage * 0.9 
        ? "decreasing" 
        : "stable";
    
    // Confidence level based on data points
    const confidence = recentAllocations.length >= 10 
      ? "high" 
      : recentAllocations.length >= 5 
        ? "medium" 
        : "low";
    
    return {
      resourceId: args.resourceId,
      resourceName: resource.name,
      currentStock: resource.stockQuantity,
      averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
      averageWeeklyUsage: Math.round(averageWeeklyUsage * 100) / 100,
      averageMonthlyUsage: Math.round(averageMonthlyUsage * 100) / 100,
      daysUntilDepletion,
      depletionDate,
      trend,
      confidence,
      dataPoints: recentAllocations.length,
      periodDays: Math.round(days),
      suggestion: daysUntilDepletion !== null && daysUntilDepletion < 7
        ? `Critical: Restock immediately! Only ${daysUntilDepletion} days remaining.`
        : daysUntilDepletion !== null && daysUntilDepletion < 30
          ? `Warning: Restock soon. ${daysUntilDepletion} days remaining.`
          : daysUntilDepletion !== null
            ? `Stock adequate for ${daysUntilDepletion} days.`
            : resource.stockQuantity === 0
              ? "Critical: Out of stock!"
              : "No usage data available for prediction.",
    };
  },
});

// Get depletion predictions for all resources in an organization
export const predictAllResourceDepletions = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    const predictions = await Promise.all(
      resources.map(async (resource) => {
        // Inline prediction logic for efficiency
        const cropResourceLinks = await ctx.db
          .query("cropResources")
          .withIndex("by_resource", (q) => q.eq("resourceId", resource._id))
          .collect();
        
        const cropIds = cropResourceLinks.map(link => link.cropId);
        const allocations = await ctx.db
          .query("allocations")
          .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
          .collect();
        
        const lookbackDays = 30;
        const startDate = Date.now() - (lookbackDays * 86400000);
        
        const recentAllocations = allocations.filter(a => 
          cropIds.includes(a.cropId) && a.createdAt >= startDate
        );
        
        let totalUsage = 0;
        for (const allocation of recentAllocations) {
          const link = cropResourceLinks.find(l => l.cropId === allocation.cropId);
          if (link) {
            totalUsage += link.requiredQuantity * allocation.allocatedQuantity;
          }
        }
        
        const days = Math.max(1, (Date.now() - startDate) / 86400000);
        const averageDailyUsage = totalUsage / days;
        const daysUntilDepletion = averageDailyUsage > 0 
          ? Math.floor(resource.stockQuantity / averageDailyUsage) 
          : null;
        
        return {
          resourceId: resource._id,
          resourceName: resource.name,
          type: resource.type,
          currentStock: resource.stockQuantity,
          averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
          daysUntilDepletion,
          status: daysUntilDepletion === null
            ? resource.stockQuantity === 0 ? "depleted" : "no-data"
            : daysUntilDepletion < 7
              ? "critical"
              : daysUntilDepletion < 30
                ? "warning"
                : "healthy",
        };
      })
    );
    
    return predictions.sort((a, b) => {
      // Sort by urgency
      const statusPriority: Record<string, number> = {
        depleted: 0,
        critical: 1,
        warning: 2,
        healthy: 3,
        "no-data": 4,
      };
      return (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5);
    });
  },
});

// Seasonal forecasting model (Phase 4.5)
export const getSeasonalForecast = query({
  args: {
    organizationId: v.id("organizations"),
    cropId: v.optional(v.id("crops")),
  },
  handler: async (ctx, args) => {
    const crops = args.cropId 
      ? [await ctx.db.get(args.cropId)].filter(c => c !== null)
      : await ctx.db
          .query("crops")
          .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
          .collect();
    
    const currentMonth = new Date().getMonth(); // 0-11
    
    // Define seasonal patterns (example for different crops)
    const seasonalPatterns: Record<string, number[]> = {
      // Multipliers for each month (Jan-Dec)
      "Wheat": [0.5, 0.7, 1.2, 1.5, 1.3, 0.8, 0.4, 0.3, 0.5, 0.9, 1.1, 0.8],
      "Rice": [0.3, 0.4, 0.6, 0.9, 1.3, 1.5, 1.4, 1.2, 0.9, 0.6, 0.4, 0.3],
      "Corn": [0.4, 0.5, 0.8, 1.1, 1.4, 1.5, 1.3, 1.0, 0.7, 0.5, 0.4, 0.4],
      "Soybean": [0.3, 0.4, 0.5, 0.7, 1.0, 1.3, 1.5, 1.4, 1.1, 0.8, 0.5, 0.4],
      "default": [0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 0.9, 0.8, 0.8],
    };
    
    const forecasts = await Promise.all(
      crops.map(async (crop) => {
        if (!crop) return null;
        
        // Get historical allocations
        const allocations = await ctx.db
          .query("allocations")
          .withIndex("by_crop", (q) => q.eq("cropId", crop._id))
          .collect();
        
        // Calculate baseline (last 90 days average)
        const ninetyDaysAgo = Date.now() - (90 * 86400000);
        const recentAllocations = allocations.filter(a => a.createdAt >= ninetyDaysAgo);
        const totalRecent = recentAllocations.reduce((sum, a) => sum + a.allocatedQuantity, 0);
        const avgDailyBaseline = totalRecent / 90;
        
        // Apply seasonal pattern
        const pattern = seasonalPatterns[crop.name] || seasonalPatterns["default"];
        const currentSeasonalMultiplier = pattern[currentMonth];
        
        // Forecast for next 3 months
        const forecasts = [];
        for (let i = 1; i <= 3; i++) {
          const futureMonth = (currentMonth + i) % 12;
          const multiplier = pattern[futureMonth];
          const monthName = new Date(2024, futureMonth, 1).toLocaleString('default', { month: 'long' });
          const forecastedDemand = Math.round(avgDailyBaseline * 30 * multiplier);
          
          forecasts.push({
            month: monthName,
            monthIndex: futureMonth,
            forecastedDemand,
            confidence: recentAllocations.length >= 10 ? "high" : recentAllocations.length >= 5 ? "medium" : "low",
          });
        }
        
        return {
          cropId: crop._id,
          cropName: crop.name,
          currentStock: crop.quantity,
          avgDailyDemand: Math.round(avgDailyBaseline * 100) / 100,
          currentSeasonalMultiplier,
          forecasts,
          dataPoints: recentAllocations.length,
        };
      })
    );
    
    return forecasts.filter(f => f !== null);
  },
});

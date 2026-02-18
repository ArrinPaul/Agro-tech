import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Cache TTL: 10 minutes (in ms)
const DEFAULT_CACHE_TTL = 10 * 60 * 1000;

// Get cached AI result
export const getCachedResult = query({
  args: {
    organizationId: v.id("organizations"),
    cacheKey: v.string(),
  },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("aiCache")
      .withIndex("by_org_key", (q) =>
        q.eq("organizationId", args.organizationId).eq("cacheKey", args.cacheKey)
      )
      .unique();

    if (!cached) return null;

    // Check expiry
    if (Date.now() > cached.expiresAt) {
      return null; // Expired
    }

    return cached.result;
  },
});

// Store AI calculation result in cache
export const setCachedResult = mutation({
  args: {
    organizationId: v.id("organizations"),
    cacheKey: v.string(),
    result: v.any(),
    ttlMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ttl = args.ttlMs ?? DEFAULT_CACHE_TTL;

    // Delete existing cache entry
    const existing = await ctx.db
      .query("aiCache")
      .withIndex("by_org_key", (q) =>
        q.eq("organizationId", args.organizationId).eq("cacheKey", args.cacheKey)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    await ctx.db.insert("aiCache", {
      organizationId: args.organizationId,
      cacheKey: args.cacheKey,
      result: args.result,
      computedAt: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  },
});

// Clear cache for organization
export const clearOrgCache = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("aiCache")
      .withIndex("by_org_key", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }

    return entries.length;
  },
});

// Clean up expired cache entries (run periodically)
export const cleanupExpiredCache = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("aiCache")
      .withIndex("by_expiry")
      .collect();

    let deleted = 0;
    for (const entry of expired) {
      if (entry.expiresAt < now) {
        await ctx.db.delete(entry._id);
        deleted++;
      }
    }

    return deleted;
  },
});

// Cached AI predictions - warehouse optimization
export const getCachedWarehouseOptimization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Check cache first
    const cached = await ctx.db
      .query("aiCache")
      .withIndex("by_org_key", (q) =>
        q.eq("organizationId", args.organizationId).eq("cacheKey", "warehouse_optimization")
      )
      .unique();

    if (cached && Date.now() < cached.expiresAt) {
      return { ...cached.result, fromCache: true, cachedAt: cached.computedAt };
    }

    // Compute fresh
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const suggestions = [];
    const overloaded = [];
    const underutilized = [];

    for (const wh of warehouses) {
      const util = wh.totalCapacity > 0 ? (wh.usedCapacity / wh.totalCapacity) * 100 : 0;
      const whAllocations = allocations.filter(a => a.warehouseId === wh._id);

      if (util > 90) {
        overloaded.push({ id: wh._id, name: wh.name, utilization: util });
        suggestions.push({
          type: "CRITICAL",
          title: `${wh.name} at ${util.toFixed(1)}% capacity`,
          message: `Consider redistributing ${whAllocations.length} allocations to lower-utilized warehouses.`,
          severity: "critical",
        });
      } else if (util < 20 && wh.usedCapacity > 0) {
        underutilized.push({ id: wh._id, name: wh.name, utilization: util, freeCapacity: wh.totalCapacity - wh.usedCapacity });
      }
    }

    // Redistribution recommendations
    if (overloaded.length > 0 && underutilized.length > 0) {
      for (const over of overloaded) {
        const targets = underutilized
          .sort((a, b) => a.utilization - b.utilization)
          .slice(0, 3);
        suggestions.push({
          type: "OPTIMIZATION",
          title: `Redistribute from ${over.name}`,
          message: `Move stock to: ${targets.map(t => `${t.name} (${t.freeCapacity} units free)`).join(", ")}`,
          severity: "warning",
          data: { source: over.id, targets: targets.map(t => t.id) },
        });
      }
    }

    // Capacity planning: calculate growth trend
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const recentAllocations = allocations.filter(a => a.createdAt >= thirtyDaysAgo);
    const totalRecentAllocated = recentAllocations.reduce((sum, a) => sum + a.allocatedQuantity, 0);
    const dailyGrowthRate = totalRecentAllocated / 30;
    const totalFreeCapacity = warehouses.reduce((sum, w) => sum + (w.totalCapacity - w.usedCapacity), 0);
    const daysUntilFull = dailyGrowthRate > 0 ? Math.floor(totalFreeCapacity / dailyGrowthRate) : null;

    if (daysUntilFull !== null && daysUntilFull < 30) {
      suggestions.push({
        type: "FORECAST",
        title: "Capacity limit approaching",
        message: `At current allocation rate (${dailyGrowthRate.toFixed(1)} units/day), total capacity will be reached in ~${daysUntilFull} days.`,
        severity: daysUntilFull < 7 ? "critical" : "warning",
      });
    }

    const result = {
      suggestions,
      metrics: {
        totalWarehouses: warehouses.length,
        overloadedCount: overloaded.length,
        underutilizedCount: underutilized.length,
        averageUtilization: warehouses.length > 0
          ? warehouses.reduce((sum, w) => sum + (w.totalCapacity > 0 ? (w.usedCapacity / w.totalCapacity) * 100 : 0), 0) / warehouses.length
          : 0,
        dailyGrowthRate,
        daysUntilFull,
        totalFreeCapacity,
      },
      fromCache: false,
      cachedAt: Date.now(),
    };

    return result;
  },
});

// Cached AI predictions - resource depletion forecast
export const getCachedResourceForecast = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Check cache
    const cached = await ctx.db
      .query("aiCache")
      .withIndex("by_org_key", (q) =>
        q.eq("organizationId", args.organizationId).eq("cacheKey", "resource_forecast")
      )
      .unique();

    if (cached && Date.now() < cached.expiresAt) {
      return { ...cached.result, fromCache: true, cachedAt: cached.computedAt };
    }

    // Compute resource forecast
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const forecasts = await Promise.all(
      resources.map(async (resource) => {
        const cropResourceLinks = await ctx.db
          .query("cropResources")
          .withIndex("by_resource", (q) => q.eq("resourceId", resource._id))
          .collect();

        const cropIds = cropResourceLinks.map(l => l.cropId);
        const thirtyDaysAgo = Date.now() - 30 * 86400000;
        const recentAllocations = allocations.filter(
          a => cropIds.includes(a.cropId) && a.createdAt >= thirtyDaysAgo
        );

        let totalUsage = 0;
        for (const alloc of recentAllocations) {
          const link = cropResourceLinks.find(l => l.cropId === alloc.cropId);
          if (link) totalUsage += link.requiredQuantity * alloc.allocatedQuantity;
        }

        const avgDailyUsage = totalUsage / 30;
        const daysUntilDepletion = avgDailyUsage > 0 ? Math.floor(resource.stockQuantity / avgDailyUsage) : null;

        // Weighted moving average for trend
        const weeklyUsage = [];
        for (let w = 0; w < 4; w++) {
          const weekStart = Date.now() - (w + 1) * 7 * 86400000;
          const weekEnd = Date.now() - w * 7 * 86400000;
          const weekAllocs = recentAllocations.filter(a => a.createdAt >= weekStart && a.createdAt < weekEnd);
          let weekUsage = 0;
          for (const alloc of weekAllocs) {
            const link = cropResourceLinks.find(l => l.cropId === alloc.cropId);
            if (link) weekUsage += link.requiredQuantity * alloc.allocatedQuantity;
          }
          weeklyUsage.push(weekUsage);
        }

        // Exponential weighted average (recent weeks weighted more)
        const weights = [0.4, 0.3, 0.2, 0.1];
        const weightedAvg = weeklyUsage.reduce((sum, usage, i) => sum + usage * weights[i], 0);
        const projectedWeeklyUsage = weightedAvg;
        const projectedMonthlyUsage = projectedWeeklyUsage * 4.3;

        // Trend detection
        const recentAvg = (weeklyUsage[0] + weeklyUsage[1]) / 2;
        const olderAvg = (weeklyUsage[2] + weeklyUsage[3]) / 2;
        const trend = olderAvg > 0
          ? recentAvg > olderAvg * 1.15 ? "increasing" : recentAvg < olderAvg * 0.85 ? "decreasing" : "stable"
          : recentAllocations.length > 0 ? "new_usage" : "no_data";

        return {
          resourceId: resource._id,
          resourceName: resource.name,
          type: resource.type,
          currentStock: resource.stockQuantity,
          avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
          projectedWeeklyUsage: Math.round(projectedWeeklyUsage * 100) / 100,
          projectedMonthlyUsage: Math.round(projectedMonthlyUsage * 100) / 100,
          daysUntilDepletion,
          trend,
          weeklyUsageHistory: weeklyUsage,
          confidence: recentAllocations.length >= 10 ? "high" : recentAllocations.length >= 5 ? "medium" : "low",
          severity: daysUntilDepletion !== null && daysUntilDepletion < 7
            ? "critical"
            : daysUntilDepletion !== null && daysUntilDepletion < 30
              ? "warning"
              : "healthy",
        };
      })
    );

    const result = {
      forecasts,
      summary: {
        critical: forecasts.filter(f => f.severity === "critical").length,
        warning: forecasts.filter(f => f.severity === "warning").length,
        healthy: forecasts.filter(f => f.severity === "healthy").length,
        totalResources: forecasts.length,
      },
      fromCache: false,
      cachedAt: Date.now(),
    };

    return result;
  },
});

// Cached demand forecast with ML-like seasonal analysis
export const getCachedDemandForecast = query({
  args: {
    organizationId: v.id("organizations"),
    cropId: v.optional(v.id("crops")),
  },
  handler: async (ctx, args) => {
    const cacheKey = args.cropId ? `demand_forecast_${args.cropId}` : "demand_forecast_all";

    const cached = await ctx.db
      .query("aiCache")
      .withIndex("by_org_key", (q) =>
        q.eq("organizationId", args.organizationId).eq("cacheKey", cacheKey)
      )
      .unique();

    if (cached && Date.now() < cached.expiresAt) {
      return { ...cached.result, fromCache: true };
    }

    const crops = args.cropId
      ? await ctx.db.get(args.cropId).then(c => c ? [c] : [])
      : await ctx.db.query("crops")
          .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
          .collect();

    const allocations = await ctx.db
      .query("allocations")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Seasonal multipliers based on Indian agricultural seasons
    const SEASONAL_MULTIPLIERS: Record<string, Record<number, number>> = {
      Wheat: { 0: 0.3, 1: 0.2, 2: 0.5, 3: 1.2, 4: 1.5, 5: 0.8, 6: 0.4, 7: 0.3, 8: 0.4, 9: 0.8, 10: 1.2, 11: 0.6 },
      Rice:  { 0: 0.3, 1: 0.3, 2: 0.4, 3: 0.5, 4: 0.7, 5: 1.2, 6: 1.5, 7: 1.3, 8: 1.0, 9: 0.8, 10: 0.5, 11: 0.3 },
      Corn:  { 0: 0.4, 1: 0.5, 2: 0.8, 3: 1.0, 4: 1.3, 5: 1.5, 6: 1.2, 7: 0.9, 8: 0.7, 9: 0.5, 10: 0.4, 11: 0.4 },
      Soybean: { 0: 0.3, 1: 0.3, 2: 0.4, 3: 0.5, 4: 0.8, 5: 1.3, 6: 1.5, 7: 1.4, 8: 1.1, 9: 0.7, 10: 0.4, 11: 0.3 },
    };

    const DEFAULT_SEASONAL: Record<number, number> = { 0: 0.6, 1: 0.7, 2: 0.9, 3: 1.0, 4: 1.2, 5: 1.3, 6: 1.1, 7: 1.0, 8: 0.9, 9: 0.8, 10: 0.7, 11: 0.6 };

    const forecasts = crops.map(crop => {
      const cropAllocations = allocations
        .filter(a => a.cropId === crop._id)
        .sort((a, b) => a.createdAt - b.createdAt);

      if (cropAllocations.length < 2) {
        return {
          cropId: crop._id,
          cropName: crop.name,
          status: crop.status,
          historicalDataPoints: cropAllocations.length,
          forecast: null,
          confidence: "insufficient_data",
        };
      }

      // Calculate daily rate
      const totalAllocated = cropAllocations.reduce((sum, a) => sum + a.allocatedQuantity, 0);
      const daySpan = Math.max(1, (cropAllocations[cropAllocations.length - 1].createdAt - cropAllocations[0].createdAt) / 86400000);
      const baseDailyRate = totalAllocated / daySpan;

      // Apply seasonal multipliers
      const seasonalPattern = SEASONAL_MULTIPLIERS[crop.name] || DEFAULT_SEASONAL;
      const currentMonth = new Date().getMonth();

      const monthlyForecasts = [];
      for (let i = 0; i < 6; i++) {
        const targetMonth = (currentMonth + i + 1) % 12;
        const seasonalMultiplier = seasonalPattern[targetMonth] ?? 1.0;
        const projectedDailyDemand = baseDailyRate * seasonalMultiplier;
        const daysInMonth = new Date(new Date().getFullYear(), targetMonth + 1, 0).getDate();
        const projectedMonthlyDemand = Math.round(projectedDailyDemand * daysInMonth);

        monthlyForecasts.push({
          month: targetMonth,
          monthName: new Date(2024, targetMonth).toLocaleString("en-US", { month: "long" }),
          projectedDemand: projectedMonthlyDemand,
          seasonalMultiplier,
          dailyRate: Math.round(projectedDailyDemand * 100) / 100,
        });
      }

      // Trend analysis
      const midpoint = cropAllocations.length >> 1;
      const firstHalf = cropAllocations.slice(0, midpoint);
      const secondHalf = cropAllocations.slice(midpoint);
      const firstTotal = firstHalf.reduce((s, a) => s + a.allocatedQuantity, 0);
      const secondTotal = secondHalf.reduce((s, a) => s + a.allocatedQuantity, 0);
      const trend = secondTotal > firstTotal * 1.1 ? "increasing" : secondTotal < firstTotal * 0.9 ? "decreasing" : "stable";

      return {
        cropId: crop._id,
        cropName: crop.name,
        status: crop.status,
        historicalDataPoints: cropAllocations.length,
        baseDailyRate: Math.round(baseDailyRate * 100) / 100,
        trend,
        forecast: monthlyForecasts,
        totalForecast6M: monthlyForecasts.reduce((s, f) => s + f.projectedDemand, 0),
        confidence: cropAllocations.length >= 10 ? "high" : cropAllocations.length >= 5 ? "medium" : "low",
      };
    });

    return {
      forecasts,
      generatedAt: Date.now(),
      fromCache: false,
    };
  },
});

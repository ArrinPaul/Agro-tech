import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "allocate": { maxAttempts: 10, windowMs: RATE_LIMIT_WINDOW_MS },
  "deallocate": { maxAttempts: 10, windowMs: RATE_LIMIT_WINDOW_MS },
  "create_warehouse": { maxAttempts: 5, windowMs: RATE_LIMIT_WINDOW_MS },
  "create_crop": { maxAttempts: 10, windowMs: RATE_LIMIT_WINDOW_MS },
  "create_resource": { maxAttempts: 10, windowMs: RATE_LIMIT_WINDOW_MS },
  "delete_warehouse": { maxAttempts: 5, windowMs: RATE_LIMIT_WINDOW_MS },
  "delete_crop": { maxAttempts: 5, windowMs: RATE_LIMIT_WINDOW_MS },
  "delete_resource": { maxAttempts: 5, windowMs: RATE_LIMIT_WINDOW_MS },
  "bulk_operation": { maxAttempts: 3, windowMs: 5 * RATE_LIMIT_WINDOW_MS },
  "seed_data": { maxAttempts: 1, windowMs: 10 * RATE_LIMIT_WINDOW_MS },
};

// Check and enforce rate limit
export const checkRateLimit = mutation({
  args: {
    operation: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const config = RATE_LIMITS[args.operation] || { maxAttempts: 20, windowMs: RATE_LIMIT_WINDOW_MS };
    const key = `${args.operation}:${args.userId}`;
    const now = Date.now();

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (existing) {
      // Check if window has expired
      if (now > existing.windowEnd) {
        // Reset window
        await ctx.db.patch(existing._id, {
          attempts: 1,
          windowStart: now,
          windowEnd: now + config.windowMs,
        });
        return { allowed: true, remaining: config.maxAttempts - 1, resetAt: now + config.windowMs };
      }

      // Check if limit exceeded
      if (existing.attempts >= config.maxAttempts) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: existing.windowEnd,
          retryAfterMs: existing.windowEnd - now,
        };
      }

      // Increment attempts
      await ctx.db.patch(existing._id, {
        attempts: existing.attempts + 1,
      });
      return {
        allowed: true,
        remaining: config.maxAttempts - existing.attempts - 1,
        resetAt: existing.windowEnd,
      };
    }

    // First attempt
    await ctx.db.insert("rateLimits", {
      key,
      attempts: 1,
      windowStart: now,
      windowEnd: now + config.windowMs,
    });

    return { allowed: true, remaining: config.maxAttempts - 1, resetAt: now + config.windowMs };
  },
});

// Query rate limit status (read-only)
export const getRateLimitStatus = query({
  args: {
    operation: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const config = RATE_LIMITS[args.operation] || { maxAttempts: 20, windowMs: RATE_LIMIT_WINDOW_MS };
    const key = `${args.operation}:${args.userId}`;
    const now = Date.now();

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (!existing || now > existing.windowEnd) {
      return { remaining: config.maxAttempts, resetAt: now + config.windowMs, limited: false };
    }

    const remaining = Math.max(0, config.maxAttempts - existing.attempts);
    return {
      remaining,
      resetAt: existing.windowEnd,
      limited: remaining === 0,
      retryAfterMs: remaining === 0 ? existing.windowEnd - now : 0,
    };
  },
});

// Clean up expired rate limit entries
export const cleanupExpiredRateLimits = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db.query("rateLimits").collect();

    let deleted = 0;
    for (const entry of all) {
      if (now > entry.windowEnd + 60000) { // 1 min grace period after window
        await ctx.db.delete(entry._id);
        deleted++;
      }
    }

    return deleted;
  },
});

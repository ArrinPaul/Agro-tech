// Performance optimization utilities for AgroTech platform

/**
 * Pagination helper for large datasets
 * @param items - Array of items to paginate
 * @param page - Current page (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated items and metadata
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 25
): {
  items: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    items: items.slice(startIndex, endIndex),
    totalPages,
    currentPage,
    totalItems,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

/**
 * Debounce function for search inputs
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for scroll/resize events
 * @param func - Function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 100
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Cache expensive calculations with expiry
 */
export class Cache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private ttl: number;

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
  }

  set(key: string, value: T): void {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

/**
 * Lazy load component with suspense
 * @param importFunc - Dynamic import function
 * @returns Lazy-loaded component
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(importFunc);
}

/**
 * Batch multiple similar operations
 * @param operations - Array of operations to batch
 * @param batchSize - Number of operations per batch
 * @param delay - Delay between batches in milliseconds
 * @returns Promise that resolves when all operations complete
 */
export async function batchOperations<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 5,
  delay: number = 100
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((op) => op()));
    results.push(...batchResults);

    // Add delay between batches
    if (i + batchSize < operations.length) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
}

/**
 * Memoize expensive function calls
 * @param fn - Function to memoize
 * @returns Memoized function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): T & { cache: Map<string, ReturnType<T>> } {
  const cache = new Map<string, ReturnType<T>>();

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T & { cache: Map<string, ReturnType<T>> };

  memoized.cache = cache;
  return memoized;
}

import React from "react";

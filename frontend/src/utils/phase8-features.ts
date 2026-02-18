// Phase 8 Advanced Features - Notifications & Bulk Operations

import { useState, useEffect, useCallback } from "react";
import { useToast } from "../components/Toast";

// Notification types for Phase 8
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: number;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: "primary" | "secondary" | "danger";
  }>;
}

// Real-time notification manager
export class NotificationManager {
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private notifications: Notification[] = [];

  constructor() {
    // Load from localStorage on init
    const saved = localStorage.getItem("agrotech_notifications");
    if (saved) {
      try {
        this.notifications = JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load notifications from storage");
      }
    }
  }

  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.notifications); // Send initial state
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback([...this.notifications]));
    // Persist to localStorage
    localStorage.setItem("agrotech_notifications", JSON.stringify(this.notifications));
  }

  addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false,
    };
    
    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    
    this.notifyListeners();
    return id;
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}

// Global notification manager instance
export const notificationManager = new NotificationManager();

// React hook for notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    return notificationManager.addNotification(notification);
  }, []);

  return {
    notifications,
    unreadCount: notificationManager.getUnreadCount(),
    addNotification,
    markAsRead: notificationManager.markAsRead,
    markAllAsRead: notificationManager.markAllAsRead,
    removeNotification: notificationManager.removeNotification,
    clearAll: notificationManager.clearAll,
  };
}

// CSV Import/Export utilities
export interface CSVImportResult<T> {
  success: T[];
  errors: Array<{ row: number; error: string; data: any }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export async function parseCSVFile<T>(
  file: File,
  validator: (row: any, index: number) => { isValid: boolean; data?: T; error?: string },
  expectedHeaders?: string[]
): Promise<CSVImportResult<T>> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  if (expectedHeaders) {
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
  }

  const success: T[] = [];
  const errors: Array<{ row: number; error: string; data: any }> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const rowData: any = {};
    
    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });

    const validation = validator(rowData, i);
    if (validation.isValid && validation.data) {
      success.push(validation.data);
    } else {
      errors.push({
        row: i + 1,
        error: validation.error || "Validation failed",
        data: rowData
      });
    }
  }

  return {
    success,
    errors,
    summary: {
      total: lines.length - 1,
      successful: success.length,
      failed: errors.length
    }
  };
}

// Bulk operations queue
export interface BulkOperation {
  id: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  total: number;
  result?: any;
  error?: string;
  createdAt: number;
}

export class BulkOperationManager {
  private operations: Map<string, BulkOperation> = new Map();
  private listeners: Set<(operations: BulkOperation[]) => void> = new Set();

  subscribe(callback: (operations: BulkOperation[]) => void): () => void {
    this.listeners.add(callback);
    callback(Array.from(this.operations.values()));
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const operations = Array.from(this.operations.values())
      .sort((a, b) => b.createdAt - a.createdAt);
    this.listeners.forEach(callback => callback(operations));
  }

  createOperation(type: string, total: number): string {
    const id = `bulk_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const operation: BulkOperation = {
      id,
      type,
      status: "pending",
      progress: 0,
      total,
      createdAt: Date.now(),
    };
    
    this.operations.set(id, operation);
    this.notifyListeners();
    return id;
  }

  updateProgress(id: string, progress: number) {
    const operation = this.operations.get(id);
    if (operation) {
      operation.progress = progress;
      operation.status = progress >= operation.total ? "completed" : "running";
      this.notifyListeners();
    }
  }

  setError(id: string, error: string) {
    const operation = this.operations.get(id);
    if (operation) {
      operation.status = "failed";
      operation.error = error;
      this.notifyListeners();
    }
  }

  setResult(id: string, result: any) {
    const operation = this.operations.get(id);
    if (operation) {
      operation.status = "completed";
      operation.result = result;
      this.notifyListeners();
    }
  }

  removeOperation(id: string) {
    this.operations.delete(id);
    this.notifyListeners();
  }
}

export const bulkOperationManager = new BulkOperationManager();

// React hook for bulk operations
export function useBulkOperations() {
  const [operations, setOperations] = useState<BulkOperation[]>([]);

  useEffect(() => {
    const unsubscribe = bulkOperationManager.subscribe(setOperations);
    return unsubscribe;
  }, []);

  return {
    operations,
    createOperation: bulkOperationManager.createOperation.bind(bulkOperationManager),
    updateProgress: bulkOperationManager.updateProgress.bind(bulkOperationManager),
    setError: bulkOperationManager.setError.bind(bulkOperationManager),
    setResult: bulkOperationManager.setResult.bind(bulkOperationManager),
    removeOperation: bulkOperationManager.removeOperation.bind(bulkOperationManager),
  };
}

// Auto-notification triggers for common events
export function createAutoNotifications() {
  const { addToast } = useToast();

  // Critical capacity warnings
  const checkWarehouseCapacity = (warehouses: any[]) => {
    warehouses.forEach(warehouse => {
      const utilizationPct = (warehouse.usedCapacity / warehouse.totalCapacity) * 100;
      
      if (utilizationPct >= 95) {
        notificationManager.addNotification({
          title: "Critical Capacity Warning",
          message: `Warehouse "${warehouse.name}" is ${utilizationPct.toFixed(1)}% full`,
          type: "error",
          actions: [
            {
              label: "View Warehouse",
              action: () => window.location.href = `/warehouses?id=${warehouse._id}`,
              style: "primary"
            },
            {
              label: "View Suggestions", 
              action: () => window.location.href = "/ai-insights",
              style: "secondary"
            }
          ]
        });
      } else if (utilizationPct >= 85) {
        notificationManager.addNotification({
          title: "High Capacity Warning",
          message: `Warehouse "${warehouse.name}" is ${utilizationPct.toFixed(1)}% full`,
          type: "warning",
          actions: [
            {
              label: "View Details",
              action: () => window.location.href = `/warehouses?id=${warehouse._id}`,
              style: "secondary"
            }
          ]
        });
      }
    });
  };

  // Resource depletion warnings
  const checkResourceDepletion = (resources: any[]) => {
    resources.forEach(resource => {
      if (resource.stockQuantity <= 10) {
        notificationManager.addNotification({
          title: "Low Stock Alert",
          message: `${resource.name} has only ${resource.stockQuantity} units remaining`,
          type: resource.stockQuantity <= 5 ? "error" : "warning",
          actions: [
            {
              label: "Reorder",
              action: () => window.location.href = `/resources?id=${resource._id}`,
              style: "primary"
            }
          ]
        });
      }
    });
  };

  return {
    checkWarehouseCapacity,
    checkResourceDepletion,
  };
}

// Advanced search and filtering
export function useAdvancedSearch<T>(
  data: T[],
  searchFields: (keyof T)[],
  filterFields?: Partial<Record<keyof T, any>>
) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Partial<Record<keyof T, any>>>(filterFields || {});

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Text search
      const textMatch = !query || searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(query.toLowerCase());
      });

      // Filters
      const filterMatch = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = item[key as keyof T];
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        return itemValue === value;
      });

      return textMatch && filterMatch;
    });
  }, [data, query, filters, searchFields]);

  return {
    query,
    setQuery,
    filters,
    setFilter: (key: keyof T, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    clearFilters: () => setFilters({}),
    filteredData,
  };
}

// Cache management for expensive operations
export class CacheManager {
  private cache = new Map<string, { value: any; expiry: number; lastAccessed: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, value: any, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      lastAccessed: Date.now(),
    });
  }

  get(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    cached.lastAccessed = Date.now();
    return cached.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    let totalSize = 0;

    for (const [key, cached] of this.cache.entries()) {
      totalSize += JSON.stringify(cached.value).length;
      if (now > cached.expiry) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries: valid,
      expiredEntries: expired,
      totalSizeBytes: totalSize,
    };
  }
}

export const globalCache = new CacheManager();

// Auto-cleanup cache every 10 minutes
setInterval(() => {
  globalCache.cleanup();
}, 10 * 60 * 1000);
export type Role = "ADMIN" | "MANAGER" | "OPERATOR";
export type CropStatus = "PLANTED" | "GROWING" | "HARVESTED" | "STORED";
export type ResourceType = "FERTILIZER" | "PESTICIDE";
export type SuggestionSeverity = "info" | "warning" | "critical";
export type SuggestionType = "OPTIMIZATION" | "DEPLETION_WARNING" | "RECOMMENDATION" | "FORECAST";

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  role: Role;
  organizationId?: string;
  createdAt: number;
}

export interface Organization {
  _id: string;
  name: string;
  createdAt: number;
}

export interface Warehouse {
  _id: string;
  name: string;
  location: string;
  totalCapacity: number;
  usedCapacity: number;
  organizationId: string;
  createdAt: number;
}

export interface Crop {
  _id: string;
  name: string;
  quantity: number;
  status: CropStatus;
  organizationId: string;
  createdAt: number;
}

export interface Resource {
  _id: string;
  name: string;
  type: ResourceType;
  stockQuantity: number;
  organizationId: string;
}

export interface CropResource {
  _id: string;
  cropId: string;
  resourceId: string;
  requiredQuantity: number;
}

export interface Allocation {
  _id: string;
  cropId: string;
  warehouseId: string;
  allocatedQuantity: number;
  createdBy: string;
  organizationId: string;
  createdAt: number;
  cropName?: string;
  warehouseName?: string;
  createdByName?: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performedByName?: string;
  timestamp: number;
}

export interface Suggestion {
  type: SuggestionType;
  title: string;
  message: string;
  severity: SuggestionSeverity;
  data?: Record<string, unknown>;
}

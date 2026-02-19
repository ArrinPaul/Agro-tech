// Convex error types for allocation validation

export type AllocationErrorType =
  | "INSUFFICIENT_CAPACITY"
  | "INSUFFICIENT_RESOURCES"
  | "WAREHOUSE_NOT_FOUND"
  | "CROP_NOT_FOUND"
  | "UNAUTHORIZED"
  | "INVALID_QUANTITY"
  | "ORGANIZATION_MISMATCH";

export class AllocationError extends Error {
  type: AllocationErrorType;
  details?: any;
  constructor(
    type: AllocationErrorType,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = "AllocationError";
    this.type = type;
    this.details = details;
  }
}

// Helper to create structured errors
export function createAllocationError(
  type: AllocationErrorType,
  message: string,
  details?: any
): AllocationError {
  return new AllocationError(type, message, details);
}

// Frontend error type guards
export function isAllocationError(error: any): error is AllocationError {
  return error instanceof AllocationError || error?.name === "AllocationError";
}

// Extract error message from Convex responses
export function extractErrorMessage(error: any): string {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.toString) return error.toString();
  return "An unknown error occurred";
}

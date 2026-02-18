// Security utilities for AgroTech platform

/**
 * Input validation utilities
 */

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength: number = 1,
  maxLength: number = 255,
  fieldName: string = "Field"
): { valid: boolean; error?: string } {
  if (value.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }
  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${maxLength} characters`,
    };
  }
  return { valid: true };
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
  fieldName: string = "Value"
): { valid: boolean; error?: string } {
  if (isNaN(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  if (value < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }
  if (value > max) {
    return { valid: false, error: `${fieldName} must not exceed ${max}` };
  }
  return { valid: true };
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Rate limiter for client-side operations
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMinutes: number = 1) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  /**
   * Check if an operation is allowed
   * @param key - Unique identifier for the operation (e.g., userId, endpoint)
   * @returns True if allowed, false if rate limit exceeded
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get attempts for this key
    let attempts = this.attempts.get(key) || [];

    // Filter out old attempts
    attempts = attempts.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (attempts.length >= this.maxAttempts) {
      return false;
    }

    // Add current attempt
    attempts.push(now);
    this.attempts.set(key, attempts);

    return true;
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter((t) => t > windowStart);
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  /**
   * Clear attempts for a key
   */
  clear(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all attempts
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

/**
 * Validate organization access
 */
export function validateOrganizationAccess(
  entityOrgId: string,
  userOrgId: string | null | undefined
): { valid: boolean; error?: string } {
  if (!userOrgId) {
    return { valid: false, error: "No organization selected" };
  }
  if (entityOrgId !== userOrgId) {
    return {
      valid: false,
      error: "Access denied: Entity belongs to different organization",
    };
  }
  return { valid: true };
}

/**
 * Validate role permissions
 */
export function hasPermission(
  userRole: "ADMIN" | "MANAGER" | "OPERATOR",
  requiredRoles: ("ADMIN" | "MANAGER" | "OPERATOR")[]
): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Secure comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate CSRF token (for future API calls)
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Validate and sanitize file names
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 255);
}

/**
 * Check for SQL injection patterns (basic)
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bOR\b|\bAND\b).*[=<>]/i,
    /UNION.*SELECT/i,
    /DROP.*TABLE/i,
    /INSERT.*INTO/i,
    /DELETE.*FROM/i,
    /UPDATE.*SET/i,
    /--/,
    /;.*--/,
    /\/\*.*\*\//,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Audit log entry creator
 */
export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: number;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export function createAuditLogEntry(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  details?: Record<string, any>
): Omit<AuditLogEntry, "timestamp"> {
  return {
    action,
    entityType,
    entityId,
    userId,
    details,
  };
}

/**
 * Content Security Policy headers helper
 */
export const CSPDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  imgSrc: ["'self'", "data:", "https:"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  connectSrc: ["'self'", "https://*.convex.cloud", "https://*.clerk.com"],
  frameSrc: ["'self'"],
  objectSrc: ["'none'"],
  upgradeInsecureRequests: [],
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSPDirectives)
    .map(([directive, sources]) => {
      const kebabCase = directive.replace(
        /[A-Z]/g,
        (m) => `-${m.toLowerCase()}`
      );
      return sources.length > 0
        ? `${kebabCase} ${sources.join(" ")}`
        : kebabCase;
    })
    .join("; ");
}

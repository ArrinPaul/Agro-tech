// Frontend utility to handle Convex errors with user-friendly messages

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  
  if (error && typeof error === "object") {
    // Convex error format
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
    
    // Standard Error
    if (error instanceof Error) {
      return error.message;
    }
  }
  
  return "An unexpected error occurred";
}

// User-friendly error messages for common scenarios
export const ERROR_MESSAGES = {
  NETWORK: "Unable to connect. Please check your internet connection.",
  AUTH: "You must be logged in to perform this action.",
  PERMISSION: "You don't have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION: "Please check your input and try again.",
  UNKNOWN: "Something went wrong. Please try again later.",
};

// Map Convex errors to user-friendly messages
export function getFriendlyErrorMessage(error: unknown): string {
  const message = getErrorMessage(error);
  
  // Check for specific error patterns
  if (message.toLowerCase().includes("not authenticated")) {
    return ERROR_MESSAGES.AUTH;
  }
  
  if (message.toLowerCase().includes("not found")) {
    return ERROR_MESSAGES.NOT_FOUND;
  }
  
  if (message.toLowerCase().includes("permission") || message.toLowerCase().includes("unauthorized")) {
    return ERROR_MESSAGES.PERMISSION;
  }
  
  if (message.toLowerCase().includes("insufficient")) {
    return message; // These are already user-friendly
  }
  
  // Return original message if it looks user-friendly (not a code error)
  if (message.length < 100 && !message.includes("Error:") && !message.includes("at ")) {
    return message;
  }
  
  return ERROR_MESSAGES.UNKNOWN;
}

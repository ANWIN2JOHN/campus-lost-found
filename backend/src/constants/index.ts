/**
 * Application Constants
 */

export const ITEM_STATUS = {
  NOT_RETURNED: "Not Returned",
  RETURNED: "Returned",
} as const;

export const ITEM_TYPE = {
  LOST: "Lost",
  FOUND: "Found",
} as const;

export const COUNTDOWN_STATUS = {
  ACTIVE: "active",
  EXPIRING: "expiring",
  LAST_10: "last10",
  EXPIRED: "expired",
} as const;

export const CONTACT_TYPE = {
  STUDENT: "student",
  STAFF: "staff",
} as const;

export const CATEGORIES = [
  { name: "Bags & Backpacks", icon: "" },
  { name: "Water Bottles", icon: "" },
  { name: "Electronics", icon: "" },
  { name: "Books & Notebooks", icon: "" },
  { name: "Keys & Keychains", icon: "" },
  { name: "Accessories", icon: "" },
  { name: "Eyewear", icon: "" },
  { name: "Others", icon: "" },
] as const;

export const COLLECT_FROM_OPTIONS = [
  "Admin Reception",
  "Main Reception",
  "Humanities Reception",
] as const;

export const SOCIAL_CLUBS = [
  "NSS",
  "KCDC",
  "NCC",
  "Other",
] as const;

export const CLAIM_PERIOD_DAYS = 60;

export const PAGINATION = {
  BROWSE_PAGE_SIZE: 6,
  ADMIN_DEFAULT_ROWS: 10,
  ADMIN_ROWS_OPTIONS: [10, 25, 50, 100],
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation failed",
  SERVER_ERROR: "Internal server error",
  ITEM_NOT_FOUND: "Item not found",
  ITEM_EXPIRED: "Item claim period has expired",
  DUPLICATE_EMAIL: "Email already in use",
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  ITEM_CREATED: "Item reported successfully",
  ITEM_UPDATED: "Item updated successfully",
  ITEM_DELETED: "Item deleted successfully",
  ITEM_RETURNED: "Item marked as returned",
  ITEM_DISPOSED: "Item marked as disposed",
} as const;

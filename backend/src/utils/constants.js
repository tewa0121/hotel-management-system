// ============================================
// APPLICATION CONSTANTS
// ============================================

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  HOUSEKEEPING: 'housekeeping',
  MAINTENANCE: 'maintenance',
  ACCOUNTANT: 'accountant'
};

// Room Statuses
const ROOM_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  OCCUPIED: 'occupied',
  DIRTY: 'dirty',
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
  OUT_OF_SERVICE: 'out_of_service'
};

// Reservation Statuses
const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

// Payment Statuses
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Payment Methods
const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  MOBILE_MONEY: 'mobile_money',
  OTHER: 'other'
};

// Invoice Statuses
const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

// Housekeeping Statuses
const HOUSEKEEPING_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  CLEANING: 'cleaning',
  COMPLETED: 'completed',
  INSPECTED: 'inspected'
};

// Maintenance Statuses
const MAINTENANCE_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Reservation Sources
const RESERVATION_SOURCES = {
  DIRECT: 'direct',
  WEBSITE: 'website',
  PHONE: 'phone',
  WALK_IN: 'walk_in',
  TRAVEL_AGENT: 'travel_agent',
  BOOKING_PLATFORM: 'booking_platform',
  CORPORATE: 'corporate',
  OTHER: 'other'
};

// Maintenance Categories
const MAINTENANCE_CATEGORIES = {
  PLUMBING: 'plumbing',
  ELECTRICAL: 'electrical',
  HVAC: 'hvac',
  FURNITURE: 'furniture',
  BATHROOM: 'bathroom',
  INTERNET: 'internet',
  APPLIANCE: 'appliance',
  STRUCTURAL: 'structural',
  OTHER: 'other'
};

// Priority Levels
const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
  URGENT: 'urgent',
  NORMAL: 'normal'
};

// Expense Categories
const EXPENSE_CATEGORIES = {
  UTILITIES: 'utilities',
  SALARIES: 'salaries',
  MAINTENANCE: 'maintenance',
  SUPPLIES: 'supplies',
  CLEANING: 'cleaning',
  FOOD: 'food',
  TRANSPORTATION: 'transportation',
  MARKETING: 'marketing',
  OTHER: 'other'
};

// Currencies
const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  ETB: 'ETB'
};

// Allowed MIME types for file uploads
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf'
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Date formats
const DATE_FORMATS = {
  DB: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
  TIME: 'HH:mm'
};

// API response messages
const MESSAGES = {
  // Success messages
  SUCCESS: {
    CREATED: 'Record created successfully',
    UPDATED: 'Record updated successfully',
    DELETED: 'Record deleted successfully',
    FETCHED: 'Data fetched successfully',
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful'
  },
  // Error messages
  ERROR: {
    NOT_FOUND: 'Record not found',
    DUPLICATE: 'Duplicate entry found',
    INVALID: 'Invalid data provided',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    SERVER: 'Internal server error',
    VALIDATION: 'Validation error'
  }
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

module.exports = {
  USER_ROLES,
  ROOM_STATUS,
  RESERVATION_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  INVOICE_STATUS,
  HOUSEKEEPING_STATUS,
  MAINTENANCE_STATUS,
  RESERVATION_SOURCES,
  MAINTENANCE_CATEGORIES,
  PRIORITY,
  EXPENSE_CATEGORIES,
  CURRENCIES,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  DATE_FORMATS,
  MESSAGES,
  PAGINATION
};
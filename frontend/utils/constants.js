// ============================================
// FRONTEND CONSTANTS
// ============================================

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  HOUSEKEEPING: 'housekeeping',
  MAINTENANCE: 'maintenance',
  ACCOUNTANT: 'accountant'
};

// Room Statuses
export const ROOM_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  OCCUPIED: 'occupied',
  DIRTY: 'dirty',
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
  OUT_OF_SERVICE: 'out_of_service'
};

// Reservation Statuses
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

// Payment Statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Invoice Statuses
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

// Payment Methods (for dropdown)
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💰' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'debit_card', label: 'Debit Card', icon: '💳' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { value: 'other', label: 'Other', icon: '💵' }
];

// Maintenance Categories (for dropdown)
export const MAINTENANCE_CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing', icon: '🚿' },
  { value: 'electrical', label: 'Electrical', icon: '💡' },
  { value: 'hvac', label: 'HVAC', icon: '❄️' },
  { value: 'furniture', label: 'Furniture', icon: '🪑' },
  { value: 'bathroom', label: 'Bathroom', icon: '🚽' },
  { value: 'internet', label: 'Internet', icon: '📶' },
  { value: 'appliance', label: 'Appliance', icon: '🔌' },
  { value: 'structural', label: 'Structural', icon: '🏗️' },
  { value: 'other', label: 'Other', icon: '🔧' }
];

// Reservation Sources (for dropdown)
export const RESERVATION_SOURCES = [
  { value: 'direct', label: 'Direct' },
  { value: 'website', label: 'Website' },
  { value: 'phone', label: 'Phone' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'travel_agent', label: 'Travel Agent' },
  { value: 'booking_platform', label: 'Booking Platform' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'other', label: 'Other' }
];

// Priority Levels (for dropdown)
export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
];

// Housekeeping Priority Levels
export const HOUSEKEEPING_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

// Room Status Options (for dropdown)
export const ROOM_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'dirty', label: 'Dirty' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'out_of_service', label: 'Out of Service' }
];

// Bed Types
export const BED_TYPES = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'queen', label: 'Queen' },
  { value: 'king', label: 'King' },
  { value: 'twin', label: 'Twin' }
];

// ID Types
export const ID_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'driver_license', label: 'Driver\'s License' },
  { value: 'other', label: 'Other' }
];

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

// Expense Categories
export const EXPENSE_CATEGORIES = [
  { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' }
];

// Currencies
export const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'ETB', label: 'ETB - Ethiopian Birr', symbol: 'Br' }
];

// Timezones
export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Africa/Addis_Ababa', label: 'East Africa Time' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Tokyo', label: 'Tokyo' }
];

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: '/auth',
  GUESTS: '/guests',
  ROOMS: '/rooms',
  RESERVATIONS: '/reservations',
  PAYMENTS: '/payments',
  INVOICES: '/invoices',
  HOUSEKEEPING: '/housekeeping',
  MAINTENANCE: '/maintenance',
  REPORTS: '/reports',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings'
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Hotel Management System',
  APP_VERSION: '1.0.0',
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm'
};

// Toast Messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    CREATED: 'Record created successfully',
    UPDATED: 'Record updated successfully',
    DELETED: 'Record deleted successfully',
    SAVED: 'Changes saved successfully'
  },
  ERROR: {
    FETCH: 'Failed to fetch data',
    CREATE: 'Failed to create record',
    UPDATE: 'Failed to update record',
    DELETE: 'Failed to delete record',
    NETWORK: 'Network error. Please check your connection'
  }
};

// Navigation Items
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'FaHome' },
  { path: '/guests', label: 'Guests', icon: 'FaUsers' },
  { path: '/rooms', label: 'Rooms', icon: 'FaBed' },
  { path: '/reservations', label: 'Reservations', icon: 'FaCalendarCheck' },
  { path: '/payments', label: 'Payments', icon: 'FaCreditCard' },
  { path: '/invoices', label: 'Invoices', icon: 'FaFileInvoice' },
  { path: '/housekeeping', label: 'Housekeeping', icon: 'FaBroom' },
  { path: '/maintenance', label: 'Maintenance', icon: 'FaTools' },
  { path: '/reports', label: 'Reports', icon: 'FaChartBar' }
];
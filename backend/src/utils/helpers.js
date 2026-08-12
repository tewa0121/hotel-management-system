// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique IDs with optional prefix
const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Calculate nights between two dates
const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Validate email format
const isValidEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone number
const isValidPhone = (phone) => {
  if (!phone) return false;
  const re = /^\+?[\d\s-()]{10,}$/;
  return re.test(phone);
};

// Get pagination parameters
const getPagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const offset = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, offset };
};

// Get date range
const getDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();
  return { start, end };
};

// Generate random number between min and max
const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Sleep/Delay function
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Get today's date in YYYY-MM-DD format
const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

// Format date to YYYY-MM-DD
const formatDateDB = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Check if a string is empty or null
const isEmpty = (str) => {
  return !str || str.trim().length === 0;
};

// Capitalize first letter of each word
const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

// Truncate text
const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Parse JSON safely
const safeJsonParse = (json) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
};

// Get current timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

module.exports = {
  generateId,
  formatCurrency,
  calculateNights,
  isValidEmail,
  isValidPhone,
  getPagination,
  getDateRange,
  randomBetween,
  sleep,
  getToday,
  formatDateDB,
  isEmpty,
  capitalizeWords,
  truncateText,
  safeJsonParse,
  getTimestamp
};
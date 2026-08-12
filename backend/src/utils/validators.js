// ============================================
// VALIDATORS - COMPLETE FILE
// ============================================

const { isValidEmail, isValidPhone } = require('./helpers');

// ✅ NEW: Validate Ethiopian phone number (starts with 09)
const isValidEthiopianPhone = (phone) => {
    if (!phone) return false;
    // Remove any spaces, dashes, or special characters
    const cleaned = phone.replace(/[\s\-()]/g, '');
    // Check if it starts with 09 and has 10 digits total
    return /^09\d{8}$/.test(cleaned);
};

// ✅ NEW: Validate Gmail email
const isGmailEmail = (email) => {
    if (!email) return false;
    // Check if email ends with @gmail.com
    return email.toLowerCase().endsWith('@gmail.com');
};

// Validate Guest Data
const validateGuest = (data) => {
    const errors = [];

    // Required fields
    if (!data.first_name || data.first_name.length < 2) {
        errors.push('First name is required (minimum 2 characters)');
    }

    if (!data.last_name || data.last_name.length < 2) {
        errors.push('Last name is required (minimum 2 characters)');
    }

    // ✅ UPDATED: Phone validation - must start with 09
    if (!data.phone) {
        errors.push('Phone number is required');
    } else if (!isValidEthiopianPhone(data.phone)) {
        errors.push('Phone number must start with 09 and be 10 digits (e.g., 0912345678)');
    }

    // ✅ UPDATED: Email validation - must be Gmail
    if (!data.email) {
        errors.push('Email is required');
    } else if (!isValidEmail(data.email)) {
        errors.push('Invalid email format');
    } else if (!isGmailEmail(data.email)) {
        errors.push('Email must be a Gmail address (@gmail.com)');
    }

    if (data.date_of_birth) {
        const dob = new Date(data.date_of_birth);
        if (isNaN(dob.getTime())) {
            errors.push('Invalid date of birth');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Validate Reservation Data
const validateReservation = (data) => {
    const errors = [];

    if (!data.guest_id) {
        errors.push('Guest ID is required');
    }

    if (!data.room_id) {
        errors.push('Room ID is required');
    }

    if (!data.check_in_date) {
        errors.push('Check-in date is required');
    }

    if (!data.check_out_date) {
        errors.push('Check-out date is required');
    }

    if (data.check_in_date && data.check_out_date) {
        const checkIn = new Date(data.check_in_date);
        const checkOut = new Date(data.check_out_date);

        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            errors.push('Invalid date format');
        }

        if (checkOut <= checkIn) {
            errors.push('Check-out date must be after check-in date');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (checkIn < today) {
            errors.push('Check-in date cannot be in the past');
        }
    }

    if (data.adults && parseInt(data.adults) < 1) {
        errors.push('At least 1 adult is required');
    }

    if (data.children && parseInt(data.children) < 0) {
        errors.push('Children count cannot be negative');
    }

    if (data.rate && parseFloat(data.rate) < 0) {
        errors.push('Rate cannot be negative');
    }

    if (data.total_amount && parseFloat(data.total_amount) < 0) {
        errors.push('Total amount cannot be negative');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Validate Payment Data
const validatePayment = (data) => {
    const errors = [];

    if (!data.reservation_id) {
        errors.push('Reservation ID is required');
    }

    if (!data.guest_id) {
        errors.push('Guest ID is required');
    }

    if (!data.amount || parseFloat(data.amount) <= 0) {
        errors.push('Valid amount greater than 0 is required');
    }

    if (!data.payment_method) {
        errors.push('Payment method is required');
    }

    const validMethods = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_money', 'other'];
    if (data.payment_method && !validMethods.includes(data.payment_method)) {
        errors.push('Invalid payment method');
    }

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (data.status && !validStatuses.includes(data.status)) {
        errors.push('Invalid payment status');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Validate Room Data
const validateRoom = (data) => {
    const errors = [];

    if (!data.room_number) {
        errors.push('Room number is required');
    }

    if (!data.room_type_id) {
        errors.push('Room type is required');
    }

    if (data.price_override && parseFloat(data.price_override) < 0) {
        errors.push('Price override cannot be negative');
    }

    const validStatuses = ['available', 'reserved', 'occupied', 'dirty', 'cleaning', 'maintenance', 'out_of_service'];
    if (data.status && !validStatuses.includes(data.status)) {
        errors.push('Invalid room status');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Validate User Data
const validateUser = (data) => {
    const errors = [];

    if (!data.name || data.name.length < 2) {
        errors.push('Name is required (minimum 2 characters)');
    }

    // ✅ UPDATED: Email must be Gmail
    if (!data.email) {
        errors.push('Email is required');
    } else if (!isValidEmail(data.email)) {
        errors.push('Invalid email format');
    } else if (!isGmailEmail(data.email)) {
        errors.push('Email must be a Gmail address (@gmail.com)');
    }

    if (data.password && data.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    const validRoles = ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'accountant'];
    if (data.role && !validRoles.includes(data.role)) {
        errors.push('Invalid user role');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Validate Maintenance Data
const validateMaintenance = (data) => {
    const errors = [];

    if (!data.room_id) {
        errors.push('Room ID is required');
    }

    if (!data.category) {
        errors.push('Category is required');
    }

    if (!data.description || data.description.length < 3) {
        errors.push('Description is required (minimum 3 characters)');
    }

    const validCategories = ['plumbing', 'electrical', 'hvac', 'furniture', 'bathroom', 'internet', 'appliance', 'structural', 'other'];
    if (data.category && !validCategories.includes(data.category)) {
        errors.push('Invalid maintenance category');
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (data.priority && !validPriorities.includes(data.priority)) {
        errors.push('Invalid priority');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Validate Housekeeping Data
const validateHousekeeping = (data) => {
    const errors = [];

    if (!data.room_id) {
        errors.push('Room ID is required');
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (data.priority && !validPriorities.includes(data.priority)) {
        errors.push('Invalid priority');
    }

    const validStatuses = ['pending', 'assigned', 'cleaning', 'completed', 'inspected'];
    if (data.status && !validStatuses.includes(data.status)) {
        errors.push('Invalid status');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Generic validation function
const validate = (data, rules) => {
    const errors = {};

    Object.keys(rules).forEach((field) => {
        const value = data[field];
        const rule = rules[field];

        // Required check
        if (rule.required && !value) {
            errors[field] = `${field} is required`;
            return;
        }

        // If value is empty and not required, skip other validations
        if (!value) return;

        // Type checks
        if (rule.type === 'email' && !isValidEmail(value)) {
            errors[field] = 'Invalid email format';
        }

        if (rule.type === 'number' && isNaN(value)) {
            errors[field] = 'Must be a number';
        }

        if (rule.type === 'phone' && !isValidPhone(value)) {
            errors[field] = 'Invalid phone number';
        }

        // Length checks
        if (rule.min && value.length < rule.min) {
            errors[field] = `Minimum ${rule.min} characters required`;
        }

        if (rule.max && value.length > rule.max) {
            errors[field] = `Maximum ${rule.max} characters allowed`;
        }

        // Custom validation
        if (rule.custom && typeof rule.custom === 'function') {
            const result = rule.custom(value);
            if (result !== true) {
                errors[field] = result;
            }
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

module.exports = {
    validateGuest,
    validateReservation,
    validatePayment,
    validateRoom,
    validateUser,
    validateMaintenance,
    validateHousekeeping,
    validate,
    isValidEthiopianPhone,
    isGmailEmail
};
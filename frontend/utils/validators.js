// ============================================
// FRONTEND VALIDATORS
// ============================================

// ✅ Validate Ethiopian phone number (starts with 09)
export const isValidEthiopianPhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-()]/g, '');
    return /^09\d{8}$/.test(cleaned);
};

// ✅ Validate Gmail email
export const isGmailEmail = (email) => {
    if (!email) return false;
    return email.toLowerCase().endsWith('@gmail.com');
};

// Email validation
export const isValidEmail = (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Phone validation
export const isValidPhone = (phone) => {
    if (!phone) return false;
    const re = /^\+?[\d\s-()]{10,}$/;
    return re.test(phone);
};

// Required field
export const isRequired = (value) => {
    return value !== undefined && value !== null && value.toString().trim().length > 0;
};

// Minimum length
export const minLength = (value, min) => {
    if (!value) return false;
    return value.length >= min;
};

// Maximum length
export const maxLength = (value, max) => {
    if (!value) return true;
    return value.length <= max;
};

// Number validation
export const isNumber = (value) => {
    return !isNaN(value) && value !== '' && value !== null;
};

// Positive number
export const isPositiveNumber = (value) => {
    return isNumber(value) && parseFloat(value) > 0;
};

// Integer validation
export const isInteger = (value) => {
    return isNumber(value) && Number.isInteger(parseFloat(value));
};

// Date validation
export const isValidDate = (date) => {
    if (!date) return false;
    const d = new Date(date);
    return !isNaN(d.getTime());
};

// Date range validation
export const isValidDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end > start;
};

// Future date validation
export const isFutureDate = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
};

// Past date validation
export const isPastDate = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
};

// URL validation
export const isValidUrl = (url) => {
    if (!url) return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Password strength validation
export const isStrongPassword = (password) => {
    if (!password || password.length < 8) return false;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

// Confirm password match
export const passwordsMatch = (password, confirmPassword) => {
    return password === confirmPassword;
};

// Zip code validation (US)
export const isValidZipCode = (zip) => {
    if (!zip) return false;
    const re = /^\d{5}(-\d{4})?$/;
    return re.test(zip);
};

// Credit card validation (Luhn algorithm)
export const isValidCreditCard = (cardNumber) => {
    if (!cardNumber) return false;
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]);
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
    }
    return sum % 10 === 0;
};

// Form validation helper
export const validateForm = (data, rules) => {
    const errors = {};

    Object.keys(rules).forEach((field) => {
        const value = data[field];
        const rule = rules[field];

        if (rule.required && !isRequired(value)) {
            errors[field] = `${field.replace(/_/g, ' ')} is required`;
            return;
        }

        if (!rule.required && !isRequired(value)) return;

        if (rule.email && !isValidEmail(value)) {
            errors[field] = 'Invalid email format';
        }

        if (rule.gmail && !isGmailEmail(value)) {
            errors[field] = 'Email must be a Gmail address (@gmail.com)';
        }

        if (rule.phone && !isValidPhone(value)) {
            errors[field] = 'Invalid phone number';
        }

        if (rule.ethiopianPhone && !isValidEthiopianPhone(value)) {
            errors[field] = 'Phone must start with 09 and be 10 digits (e.g., 0912345678)';
        }

        if (rule.number && !isNumber(value)) {
            errors[field] = 'Must be a number';
        }

        if (rule.positive && !isPositiveNumber(value)) {
            errors[field] = 'Must be a positive number';
        }

        if (rule.integer && !isInteger(value)) {
            errors[field] = 'Must be a whole number';
        }

        if (rule.minLength && !minLength(value, rule.minLength)) {
            errors[field] = `Minimum ${rule.minLength} characters required`;
        }

        if (rule.maxLength && !maxLength(value, rule.maxLength)) {
            errors[field] = `Maximum ${rule.maxLength} characters allowed`;
        }

        if (rule.url && !isValidUrl(value)) {
            errors[field] = 'Invalid URL format';
        }

        if (rule.date && !isValidDate(value)) {
            errors[field] = 'Invalid date';
        }

        if (rule.future && !isFutureDate(value)) {
            errors[field] = 'Date must be in the future';
        }

        if (rule.past && !isPastDate(value)) {
            errors[field] = 'Date must be in the past';
        }

        if (rule.password && !isStrongPassword(value)) {
            errors[field] = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
        }

        if (rule.custom && typeof rule.custom === 'function') {
            const result = rule.custom(value, data);
            if (result !== true) {
                errors[field] = result;
            }
        }
    });

    if (rules.confirmPassword && data.password && data.confirmPassword) {
        if (!passwordsMatch(data.password, data.confirmPassword)) {
            errors.confirmPassword = 'Passwords do not match';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Validation rules for common forms
export const validationRules = {
    guest: {
        first_name: { required: true, minLength: 2, maxLength: 50 },
        last_name: { required: true, minLength: 2, maxLength: 50 },
        email: { 
            required: true, 
            email: true,
            gmail: true
        },
        phone: { 
            required: true, 
            ethiopianPhone: true
        }
    },
    user: {
        name: { required: true, minLength: 2, maxLength: 100 },
        email: { 
            required: true, 
            email: true,
            gmail: true
        },
        password: { required: true, password: true, minLength: 6 }
    },
    reservation: {
        guest_id: { required: true },
        room_id: { required: true },
        check_in_date: { required: true, date: true, future: true },
        check_out_date: { required: true, date: true }
    },
    payment: {
        amount: { required: true, positive: true },
        payment_method: { required: true }
    }
};
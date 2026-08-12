-- Hotel Management System Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS hotel_management;
USE hotel_management;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'accountant') DEFAULT 'receptionist',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. GUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50),
    id_type ENUM('passport', 'national_id', 'driver_license', 'other') DEFAULT 'passport',
    id_number VARCHAR(50),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other') DEFAULT 'other',
    nationality VARCHAR(50),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    total_stays INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_id_number (id_number),
    INDEX idx_name (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ROOM TYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS room_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(10) UNIQUE,
    description TEXT,
    max_occupancy INT DEFAULT 2,
    base_price DECIMAL(10,2) NOT NULL,
    weekend_price DECIMAL(10,2),
    extra_guest_price DECIMAL(10,2) DEFAULT 0.00,
    bed_type ENUM('single', 'double', 'queen', 'king', 'twin') DEFAULT 'double',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_base_price (base_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_number VARCHAR(10) NOT NULL UNIQUE,
    room_type_id INT NOT NULL,
    floor INT DEFAULT 1,
    building VARCHAR(50) DEFAULT 'Main',
    status ENUM('available', 'reserved', 'occupied', 'dirty', 'cleaning', 'maintenance', 'out_of_service') DEFAULT 'available',
    housekeeping_status ENUM('clean', 'dirty', 'cleaning', 'inspected') DEFAULT 'clean',
    price_override DECIMAL(10,2),
    amenities TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT,
    INDEX idx_room_number (room_number),
    INDEX idx_status (status),
    INDEX idx_housekeeping_status (housekeeping_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. RESERVATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_number VARCHAR(20) NOT NULL UNIQUE,
    guest_id INT NOT NULL,
    room_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    adults INT DEFAULT 1,
    children INT DEFAULT 0,
    total_rooms INT DEFAULT 1,
    rate DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0.00,
    tax DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    deposit_paid DECIMAL(10,2) DEFAULT 0.00,
    balance DECIMAL(10,2) DEFAULT 0.00,
    payment_status ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending',
    reservation_status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show') DEFAULT 'pending',
    source ENUM('direct', 'website', 'phone', 'walk_in', 'travel_agent', 'booking_platform', 'corporate', 'other') DEFAULT 'direct',
    special_requests TEXT,
    notes TEXT,
    checked_in_at TIMESTAMP NULL,
    checked_out_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE RESTRICT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    INDEX idx_reservation_number (reservation_number),
    INDEX idx_check_in (check_in_date),
    INDEX idx_check_out (check_out_date),
    INDEX idx_status (reservation_status),
    INDEX idx_dates (check_in_date, check_out_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_id INT NOT NULL,
    guest_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method ENUM('cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_money', 'other') NOT NULL,
    reference_number VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
    received_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE RESTRICT,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE RESTRICT,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reservation (reservation_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(20) NOT NULL UNIQUE,
    reservation_id INT NOT NULL,
    guest_id INT NOT NULL,
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0.00,
    discount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    balance DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    created_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE RESTRICT,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. HOUSEKEEPING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS housekeeping (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    assigned_to INT,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    status ENUM('pending', 'assigned', 'cleaning', 'completed', 'inspected') DEFAULT 'pending',
    start_time TIMESTAMP NULL,
    completion_time TIMESTAMP NULL,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_room (room_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. MAINTENANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    category ENUM('plumbing', 'electrical', 'hvac', 'furniture', 'bathroom', 'internet', 'appliance', 'structural', 'other') NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    assigned_to INT,
    status ENUM('open', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'open',
    start_date TIMESTAMP NULL,
    completion_date TIMESTAMP NULL,
    cost DECIMAL(10,2),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_room (room_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category ENUM('utilities', 'salaries', 'maintenance', 'supplies', 'cleaning', 'food', 'transportation', 'marketing', 'other') NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method ENUM('cash', 'credit_card', 'bank_transfer', 'check', 'other') DEFAULT 'cash',
    vendor VARCHAR(100),
    reference VARCHAR(100),
    receipt_image VARCHAR(255),
    created_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id INT,
    previous_data JSON,
    new_data JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    hotel_name VARCHAR(100) DEFAULT 'Hotel Management System',
    hotel_address TEXT,
    hotel_phone VARCHAR(20),
    hotel_email VARCHAR(100),
    hotel_logo VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    check_in_time VARCHAR(10) DEFAULT '14:00',
    check_out_time VARCHAR(10) DEFAULT '11:00',
    tax_rate DECIMAL(5,2) DEFAULT 12.00,
    service_charge DECIMAL(5,2) DEFAULT 5.00,
    default_currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Default Settings
INSERT INTO settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id=1;

-- Default Users (password: admin123, manager123, reception123, house123, maintenance123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@hotel.com', '$2a$10$rT6XwGX3nQnG3nQnG3nQnG3nQnG3nQnG3nQnG3', 'admin'),
('Manager User', 'manager@hotel.com', '$2a$10$rT6XwGX3nQnG3nQnG3nQnG3nQnG3nQnG3nQnG3', 'manager'),
('Receptionist', 'reception@hotel.com', '$2a$10$rT6XwGX3nQnG3nQnG3nQnG3nQnG3nQnG3nQnG3', 'receptionist'),
('Housekeeping Staff', 'housekeeping@hotel.com', '$2a$10$rT6XwGX3nQnG3nQnG3nQnG3nQnG3nQnG3nQnG3', 'housekeeping'),
('Maintenance Staff', 'maintenance@hotel.com', '$2a$10$rT6XwGX3nQnG3nQnG3nQnG3nQnG3nQnG3nQnG3', 'maintenance');

-- Room Types
INSERT INTO room_types (name, code, description, max_occupancy, base_price, weekend_price, bed_type) VALUES
('Standard Single', 'SS', 'Comfortable single room with all amenities', 1, 80.00, 95.00, 'single'),
('Standard Double', 'SD', 'Spacious double room perfect for couples', 2, 120.00, 140.00, 'double'),
('Deluxe', 'DLX', 'Luxury room with premium amenities', 2, 180.00, 210.00, 'queen'),
('Executive Suite', 'EXE', 'Executive suite with separate living area', 2, 250.00, 290.00, 'king'),
('Family Suite', 'FAM', 'Spacious suite perfect for families', 4, 220.00, 260.00, 'twin');

-- Rooms (30 rooms)
INSERT INTO rooms (room_number, room_type_id, floor, building, status) VALUES
('101', 1, 1, 'Main', 'available'),
('102', 1, 1, 'Main', 'available'),
('103', 1, 1, 'Main', 'available'),
('104', 1, 1, 'Main', 'available'),
('105', 2, 1, 'Main', 'available'),
('106', 2, 1, 'Main', 'available'),
('107', 2, 1, 'Main', 'available'),
('108', 2, 1, 'Main', 'available'),
('109', 3, 1, 'Main', 'available'),
('110', 3, 1, 'Main', 'available'),
('201', 1, 2, 'Main', 'available'),
('202', 1, 2, 'Main', 'available'),
('203', 1, 2, 'Main', 'available'),
('204', 1, 2, 'Main', 'available'),
('205', 2, 2, 'Main', 'available'),
('206', 2, 2, 'Main', 'available'),
('207', 2, 2, 'Main', 'available'),
('208', 2, 2, 'Main', 'available'),
('209', 3, 2, 'Main', 'available'),
('210', 3, 2, 'Main', 'available'),
('301', 1, 3, 'Main', 'available'),
('302', 1, 3, 'Main', 'available'),
('303', 1, 3, 'Main', 'available'),
('304', 1, 3, 'Main', 'available'),
('305', 4, 3, 'Main', 'available'),
('306', 4, 3, 'Main', 'available'),
('307', 5, 3, 'Main', 'available'),
('308', 5, 3, 'Main', 'available'),
('309', 5, 3, 'Main', 'available'),
('310', 5, 3, 'Main', 'available');

-- Sample Guests
INSERT INTO guests (first_name, last_name, email, phone, country, city) VALUES
('John', 'Smith', 'john.smith@email.com', '+1234567890', 'USA', 'New York'),
('Maria', 'Garcia', 'maria.garcia@email.com', '+9876543210', 'Spain', 'Madrid'),
('David', 'Chen', 'david.chen@email.com', '+5551234567', 'China', 'Beijing'),
('Sarah', 'Johnson', 'sarah.johnson@email.com', '+4449876543', 'UK', 'London'),
('Michael', 'Brown', 'michael.brown@email.com', '+7775551234', 'Canada', 'Toronto');
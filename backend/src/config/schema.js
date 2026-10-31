const { pool } = require('./db');

const TABLE_OPTIONS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

// Order matters: a table must be created AFTER every table its foreign keys point to.
const tables = [
    {
        name: 'users',
        sql: `
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
            )`
    },
    {
        name: 'guests',
        sql: `
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
                password VARCHAR(255) NULL,
                is_guest BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_phone (phone),
                INDEX idx_id_number (id_number),
                INDEX idx_name (first_name, last_name)
            )`
    },
    {
        name: 'room_types',
        sql: `
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
            )`
    },
    {
        name: 'rooms',
        sql: `
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
                INDEX idx_housekeeping_status (housekeeping_status),
                INDEX idx_room_type (room_type_id)
            )`
    },
    {
        name: 'reservations',
        sql: `
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
                INDEX idx_guest (guest_id),
                INDEX idx_room (room_id),
                INDEX idx_check_in (check_in_date),
                INDEX idx_check_out (check_out_date),
                INDEX idx_status (reservation_status),
                INDEX idx_payment_status (payment_status),
                INDEX idx_dates (check_in_date, check_out_date)
            )`
    },
    {
        name: 'payments',
        sql: `
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
                INDEX idx_guest (guest_id),
                INDEX idx_status (status),
                INDEX idx_payment_date (payment_date)
            )`
    },
    {
        name: 'invoices',
        sql: `
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
                INDEX idx_reservation (reservation_id),
                INDEX idx_guest (guest_id),
                INDEX idx_status (status)
            )`
    },
    {
        name: 'housekeeping',
        sql: `
            CREATE TABLE IF NOT EXISTS housekeeping (
                id INT PRIMARY KEY AUTO_INCREMENT,
                room_id INT NOT NULL,
                assigned_to INT,
                priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
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
                INDEX idx_status (status),
                INDEX idx_assigned_to (assigned_to)
            )`
    },
    {
        name: 'maintenance',
        sql: `
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
                INDEX idx_status (status),
                INDEX idx_priority (priority)
            )`
    },
    {
        name: 'expenses',
        sql: `
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
            )`
    },
    {
        name: 'audit_logs',
        sql: `
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
                INDEX idx_entity (entity),
                INDEX idx_created_at (created_at)
            )`
    },
    {
        name: 'food_categories',
        sql: `
            CREATE TABLE IF NOT EXISTS food_categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_name (name)
            )`
    },
    {
        name: 'food_items',
        sql: `
            CREATE TABLE IF NOT EXISTS food_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                category_id INT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                is_available BOOLEAN DEFAULT TRUE,
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES food_categories(id) ON DELETE SET NULL,
                INDEX idx_category (category_id),
                INDEX idx_name (name),
                INDEX idx_available (is_available)
            )`
    },
    {
        name: 'food_orders',
        sql: `
            CREATE TABLE IF NOT EXISTS food_orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                reservation_id INT NULL,
                guest_id INT NOT NULL,
                room_id INT NULL,
                order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
                total_amount DECIMAL(10,2) NOT NULL,
                notes TEXT,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL,
                FOREIGN KEY (guest_id) REFERENCES guests(id),
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_reservation (reservation_id),
                INDEX idx_guest (guest_id),
                INDEX idx_room (room_id),
                INDEX idx_status (status),
                INDEX idx_order_date (order_date)
            )`
    },
    {
        name: 'food_order_items',
        sql: `
            CREATE TABLE IF NOT EXISTS food_order_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_id INT NOT NULL,
                food_item_id INT NOT NULL,
                quantity INT NOT NULL CHECK (quantity > 0),
                unit_price DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES food_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (food_item_id) REFERENCES food_items(id),
                INDEX idx_order (order_id),
                INDEX idx_item (food_item_id)
            )`
    }
];

// Create all tables
const createTables = async () => {
    try {
        for (const table of tables) {
            await pool.execute(`${table.sql} ${TABLE_OPTIONS}`);
            console.log(`✅ ${table.name} table ready`);
        }

        console.log('✅ All tables created successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        return false;
    }
};

module.exports = {
    tables,
    createTables
};
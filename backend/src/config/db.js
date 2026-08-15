const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 8889,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'hotel_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify pool for async/await
const promisePool = pool.promise();

// Test connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Database connected successfully on port 8889');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Please make sure MAMP is running on port 8889');
        return false;
    }
};

// Create all tables
const createTables = async () => {
    try {
        // 1. Users Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Users table created');

        // 2. Guests Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Guests table created');

        // 3. Room Types Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Room types table created');

        // 4. Rooms Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Rooms table created');

        // 5. Reservations Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Reservations table created');

        // 6. Payments Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Payments table created');

        // 7. Invoices Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Invoices table created');

        // 8. Housekeeping Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Housekeeping table created');

        // 9. Maintenance Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Maintenance table created');

        // 10. Expenses Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Expenses table created');

        // 11. Audit Logs Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Audit logs table created');

        // ============================================
        // 🆕 FOOD MODULE TABLES
        // ============================================

        // 12. Food Categories Table
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS food_categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Food categories table created');

        // 13. Food Items Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Food items table created');

        // 14. Food Orders Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Food orders table created');

        // 15. Food Order Items Table
        await promisePool.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Food order items table created');

        console.log('✅ All tables created successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        return false;
    }
};

// Insert seed data
const seedData = async () => {
    try {
        // Check if users exist
        const [users] = await promisePool.execute('SELECT COUNT(*) as count FROM users');
        if (users[0].count > 0) {
            console.log('ℹ️ Seed data already exists, skipping...');
            return true;
        }

        const bcrypt = require('bcryptjs');
        const saltRounds = 10;

        // Create default users with hashed passwords
        const defaultUsers = [
            { name: 'Admin User', email: 'admin@hotel.com', password: await bcrypt.hash('admin123', saltRounds), role: 'admin' },
            { name: 'Manager User', email: 'manager@hotel.com', password: await bcrypt.hash('manager123', saltRounds), role: 'manager' },
            { name: 'Receptionist User', email: 'reception@hotel.com', password: await bcrypt.hash('reception123', saltRounds), role: 'receptionist' },
            { name: 'Housekeeping Staff', email: 'housekeeping@hotel.com', password: await bcrypt.hash('house123', saltRounds), role: 'housekeeping' },
            { name: 'Maintenance Staff', email: 'maintenance@hotel.com', password: await bcrypt.hash('maintenance123', saltRounds), role: 'maintenance' },
            { name: 'Accountant User', email: 'accountant@hotel.com', password: await bcrypt.hash('accountant123', saltRounds), role: 'accountant' }
        ];

        for (const user of defaultUsers) {
            await promisePool.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [user.name, user.email, user.password, user.role]
            );
        }
        console.log('✅ Default users created');

        // Create room types
        const roomTypes = [
            { name: 'Standard Single', code: 'SS', description: 'Comfortable single room', base_price: 80, max_occupancy: 1, bed_type: 'single', weekend_price: 95 },
            { name: 'Standard Double', code: 'SD', description: 'Spacious double room', base_price: 120, max_occupancy: 2, bed_type: 'double', weekend_price: 140 },
            { name: 'Deluxe', code: 'DLX', description: 'Luxury deluxe room', base_price: 180, max_occupancy: 2, bed_type: 'queen', weekend_price: 210 },
            { name: 'Executive Suite', code: 'EXE', description: 'Executive suite with living area', base_price: 250, max_occupancy: 2, bed_type: 'king', weekend_price: 290 },
            { name: 'Family Suite', code: 'FAM', description: 'Perfect for families', base_price: 220, max_occupancy: 4, bed_type: 'twin', weekend_price: 260 }
        ];

        for (const type of roomTypes) {
            await promisePool.execute(
                'INSERT INTO room_types (name, code, description, base_price, max_occupancy, bed_type, weekend_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [type.name, type.code, type.description, type.base_price, type.max_occupancy, type.bed_type, type.weekend_price]
            );
        }
        console.log('✅ Room types created');

        // Get room types for room creation
        const [types] = await promisePool.execute('SELECT id, name FROM room_types');
        const roomTypeMap = {};
        types.forEach(t => roomTypeMap[t.name] = t.id);

        // Create rooms (30 rooms)
        const floors = [1, 2, 3];
        const buildings = ['Main', 'East Wing', 'West Wing'];
        const statuses = ['available', 'available', 'available', 'available', 'occupied', 'dirty', 'cleaning'];
        
        const roomTypeAssignments = [];
        for (let i = 1; i <= 30; i++) {
            if (i <= 8) roomTypeAssignments.push('Standard Single');
            else if (i <= 16) roomTypeAssignments.push('Standard Double');
            else if (i <= 22) roomTypeAssignments.push('Deluxe');
            else if (i <= 26) roomTypeAssignments.push('Executive Suite');
            else roomTypeAssignments.push('Family Suite');
        }

        for (let i = 0; i < 30; i++) {
            const floor = floors[i % floors.length];
            const building = buildings[i % buildings.length];
            const status = statuses[i % statuses.length];
            const typeName = roomTypeAssignments[i];
            const roomTypeId = roomTypeMap[typeName];
            
            await promisePool.execute(
                'INSERT INTO rooms (room_number, room_type_id, floor, building, status, housekeeping_status) VALUES (?, ?, ?, ?, ?, ?)',
                [String(100 + i + 1), roomTypeId, floor, building, status, status === 'occupied' ? 'dirty' : 'clean']
            );
        }
        console.log('✅ 30 rooms created');

        // Create sample guests
        const sampleGuests = [
            { first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com', phone: '+1234567890', id_type: 'passport', id_number: 'P123456', country: 'USA', city: 'New York' },
            { first_name: 'Maria', last_name: 'Garcia', email: 'maria.garcia@example.com', phone: '+9876543210', id_type: 'passport', id_number: 'P789012', country: 'Spain', city: 'Madrid' },
            { first_name: 'David', last_name: 'Chen', email: 'david.chen@example.com', phone: '+5551234567', id_type: 'passport', id_number: 'P345678', country: 'China', city: 'Beijing' },
            { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@example.com', phone: '+4449876543', id_type: 'national_id', id_number: 'N987654', country: 'UK', city: 'London' },
            { first_name: 'Michael', last_name: 'Brown', email: 'michael.brown@example.com', phone: '+7775551234', id_type: 'driver_license', id_number: 'D876543', country: 'Canada', city: 'Toronto' }
        ];

        for (const guest of sampleGuests) {
            await promisePool.execute(
                'INSERT INTO guests (first_name, last_name, email, phone, id_type, id_number, country, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [guest.first_name, guest.last_name, guest.email, guest.phone, guest.id_type, guest.id_number, guest.country, guest.city]
            );
        }
        console.log('✅ Sample guests created');

        // 🆕 Create food categories and items
        const foodCategories = [
            { name: 'Breakfast', description: 'Morning meals to start your day' },
            { name: 'Lunch', description: 'Midday meals and snacks' },
            { name: 'Dinner', description: 'Evening meals and full courses' },
            { name: 'Beverages', description: 'Drinks and refreshments' },
            { name: 'Snacks', description: 'Light bites and appetizers' },
            { name: 'Desserts', description: 'Sweet treats and pastries' }
        ];

        const categoryIds = [];
        for (const cat of foodCategories) {
            const [result] = await promisePool.execute(
                'INSERT INTO food_categories (name, description) VALUES (?, ?)',
                [cat.name, cat.description]
            );
            categoryIds.push({ name: cat.name, id: result.insertId });
        }

        const getCategoryId = (name) => {
            const found = categoryIds.find(c => c.name === name);
            return found ? found.id : null;
        };

        const foodItems = [
            // Breakfast
            { category: 'Breakfast', name: 'Continental Breakfast', description: 'Fresh pastries, bread, butter, jam, coffee/tea', price: 12.00 },
            { category: 'Breakfast', name: 'Full English Breakfast', description: 'Eggs, bacon, sausage, beans, grilled tomato, toast', price: 18.00 },
            { category: 'Breakfast', name: 'Omelette', description: 'Three-egg omelette with your choice of fillings', price: 14.00 },
            { category: 'Breakfast', name: 'Pancakes', description: 'Served with maple syrup and fresh berries', price: 13.00 },
            { category: 'Breakfast', name: 'Fruit Bowl', description: 'Seasonal fresh fruits', price: 8.00 },
            // Lunch
            { category: 'Lunch', name: 'Club Sandwich', description: 'Triple-decker with chicken, bacon, lettuce, tomato', price: 16.00 },
            { category: 'Lunch', name: 'Caesar Salad', description: 'Romaine lettuce, parmesan, croutons, Caesar dressing', price: 14.00 },
            { category: 'Lunch', name: 'Burger', description: 'Beef patty with lettuce, tomato, onion, cheese', price: 17.00 },
            { category: 'Lunch', name: 'Pasta', description: 'Choice of sauce with fresh pasta', price: 18.00 },
            { category: 'Lunch', name: 'Soup of the Day', description: 'Homemade soup with bread', price: 10.00 },
            // Dinner
            { category: 'Dinner', name: 'Grilled Salmon', description: 'Served with vegetables and rice', price: 28.00 },
            { category: 'Dinner', name: 'Steak', description: 'Grilled steak with mashed potatoes and vegetables', price: 35.00 },
            { category: 'Dinner', name: 'Chicken Breast', description: 'Grilled chicken with herbs and vegetables', price: 24.00 },
            { category: 'Dinner', name: 'Vegetarian Pasta', description: 'Fresh pasta with vegetables and pesto', price: 20.00 },
            { category: 'Dinner', name: 'Seafood Platter', description: 'Assorted seafood with dipping sauce', price: 32.00 },
            // Beverages
            { category: 'Beverages', name: 'Coffee', description: 'Freshly brewed coffee', price: 4.00 },
            { category: 'Beverages', name: 'Tea', description: 'Selection of teas', price: 3.50 },
            { category: 'Beverages', name: 'Fresh Juice', description: 'Orange, apple, or mango', price: 5.00 },
            { category: 'Beverages', name: 'Soft Drink', description: 'Coca-cola, Sprite, Fanta', price: 3.00 },
            { category: 'Beverages', name: 'Smoothie', description: 'Mixed fruit smoothie', price: 6.00 },
            // Snacks
            { category: 'Snacks', name: 'French Fries', description: 'Crispy golden fries', price: 6.00 },
            { category: 'Snacks', name: 'Onion Rings', description: 'Crispy onion rings with dip', price: 7.00 },
            { category: 'Snacks', name: 'Nachos', description: 'Tortilla chips with cheese and salsa', price: 10.00 },
            { category: 'Snacks', name: 'Spring Rolls', description: 'Vegetable spring rolls with sweet chili sauce', price: 9.00 },
            { category: 'Snacks', name: 'Cheese Platter', description: 'Selection of cheeses with crackers', price: 15.00 },
            // Desserts
            { category: 'Desserts', name: 'Chocolate Cake', description: 'Rich chocolate cake with ganache', price: 8.00 },
            { category: 'Desserts', name: 'Cheesecake', description: 'New York style cheesecake', price: 8.50 },
            { category: 'Desserts', name: 'Ice Cream', description: 'Vanilla, chocolate, or strawberry', price: 6.00 },
            { category: 'Desserts', name: 'Fruit Tart', description: 'Fresh fruit tart with custard', price: 9.00 },
            { category: 'Desserts', name: 'Tiramisu', description: 'Italian coffee-flavored dessert', price: 9.50 }
        ];

        for (const item of foodItems) {
            const catId = getCategoryId(item.category);
            if (catId) {
                await promisePool.execute(
                    'INSERT INTO food_items (category_id, name, description, price, is_available) VALUES (?, ?, ?, ?, ?)',
                    [catId, item.name, item.description, item.price, 1]
                );
            }
        }
        console.log('✅ Food categories and items created');

        console.log('✅ Seed data completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
        return false;
    }
};

// Initialize database
const initializeDatabase = async () => {
    const connected = await testConnection();
    if (!connected) return false;

    const tablesCreated = await createTables();
    if (!tablesCreated) return false;

    const seeded = await seedData();
    if (!seeded) return false;

    console.log('✅ Database initialization complete!');
    return true;
};

module.exports = {
    pool: promisePool,
    testConnection,
    createTables,
    seedData,
    initializeDatabase
};
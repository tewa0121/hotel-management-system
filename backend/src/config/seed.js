const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const SALT_ROUNDS = 10;

// ============================================
// Demo data (used in development, or when SEED_DEMO_DATA=true)
// ============================================
const DEMO_USERS = [
    { name: 'Admin User', email: 'admin@hotel.com', password: 'admin123', role: 'admin' },
    { name: 'Manager User', email: 'manager@hotel.com', password: 'manager123', role: 'manager' },
    { name: 'Receptionist User', email: 'reception@hotel.com', password: 'reception123', role: 'receptionist' },
    { name: 'Housekeeping Staff', email: 'housekeeping@hotel.com', password: 'house123', role: 'housekeeping' },
    { name: 'Maintenance Staff', email: 'maintenance@hotel.com', password: 'maintenance123', role: 'maintenance' },
    { name: 'Accountant User', email: 'accountant@hotel.com', password: 'accountant123', role: 'accountant' }
];

const ROOM_TYPES = [
    { name: 'Standard Single', code: 'SS', description: 'Comfortable single room', base_price: 80, max_occupancy: 1, bed_type: 'single', weekend_price: 95 },
    { name: 'Standard Double', code: 'SD', description: 'Spacious double room', base_price: 120, max_occupancy: 2, bed_type: 'double', weekend_price: 140 },
    { name: 'Deluxe', code: 'DLX', description: 'Luxury deluxe room', base_price: 180, max_occupancy: 2, bed_type: 'queen', weekend_price: 210 },
    { name: 'Executive Suite', code: 'EXE', description: 'Executive suite with living area', base_price: 250, max_occupancy: 2, bed_type: 'king', weekend_price: 290 },
    { name: 'Family Suite', code: 'FAM', description: 'Perfect for families', base_price: 220, max_occupancy: 4, bed_type: 'twin', weekend_price: 260 }
];

const SAMPLE_GUESTS = [
    { first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com', phone: '+1234567890', id_type: 'passport', id_number: 'P123456', country: 'USA', city: 'New York' },
    { first_name: 'Maria', last_name: 'Garcia', email: 'maria.garcia@example.com', phone: '+9876543210', id_type: 'passport', id_number: 'P789012', country: 'Spain', city: 'Madrid' },
    { first_name: 'David', last_name: 'Chen', email: 'david.chen@example.com', phone: '+5551234567', id_type: 'passport', id_number: 'P345678', country: 'China', city: 'Beijing' },
    { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@example.com', phone: '+4449876543', id_type: 'national_id', id_number: 'N987654', country: 'UK', city: 'London' },
    { first_name: 'Michael', last_name: 'Brown', email: 'michael.brown@example.com', phone: '+7775551234', id_type: 'driver_license', id_number: 'D876543', country: 'Canada', city: 'Toronto' }
];

const FOOD_CATEGORIES = [
    { name: 'Breakfast', description: 'Morning meals to start your day' },
    { name: 'Lunch', description: 'Midday meals and snacks' },
    { name: 'Dinner', description: 'Evening meals and full courses' },
    { name: 'Beverages', description: 'Drinks and refreshments' },
    { name: 'Snacks', description: 'Light bites and appetizers' },
    { name: 'Desserts', description: 'Sweet treats and pastries' }
];

const FOOD_ITEMS = [
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

// ============================================
// Helpers
// ============================================
const isProduction = () => process.env.NODE_ENV === 'production';

// Demo data is ON by default in development and OFF in production,
// unless you explicitly set SEED_DEMO_DATA=true (e.g. for a public portfolio demo).
const shouldSeedDemo = () => !isProduction() || process.env.SEED_DEMO_DATA === 'true';

const seedDemoUsers = async () => {
    for (const user of DEMO_USERS) {
        const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);
        await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [user.name, user.email, hashed, user.role]
        );
    }
    console.log('✅ Demo staff accounts created');
};

const seedRoomTypesAndRooms = async () => {
    for (const type of ROOM_TYPES) {
        await pool.execute(
            'INSERT INTO room_types (name, code, description, base_price, max_occupancy, bed_type, weekend_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [type.name, type.code, type.description, type.base_price, type.max_occupancy, type.bed_type, type.weekend_price]
        );
    }
    console.log('✅ Room types created');

    const [types] = await pool.execute('SELECT id, name FROM room_types');
    const roomTypeMap = {};
    types.forEach(t => { roomTypeMap[t.name] = t.id; });

    // 30 rooms: 8 single, 8 double, 6 deluxe, 4 executive, 4 family
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
        const roomTypeId = roomTypeMap[roomTypeAssignments[i]];

        await pool.execute(
            'INSERT INTO rooms (room_number, room_type_id, floor, building, status, housekeeping_status) VALUES (?, ?, ?, ?, ?, ?)',
            [String(100 + i + 1), roomTypeId, floor, building, status, status === 'occupied' ? 'dirty' : 'clean']
        );
    }
    console.log('✅ 30 rooms created');
};

const seedSampleGuests = async () => {
    for (const guest of SAMPLE_GUESTS) {
        await pool.execute(
            'INSERT INTO guests (first_name, last_name, email, phone, id_type, id_number, country, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [guest.first_name, guest.last_name, guest.email, guest.phone, guest.id_type, guest.id_number, guest.country, guest.city]
        );
    }
    console.log('✅ Sample guests created');
};

const seedFoodMenu = async () => {
    const categoryIds = {};
    for (const cat of FOOD_CATEGORIES) {
        const [result] = await pool.execute(
            'INSERT INTO food_categories (name, description) VALUES (?, ?)',
            [cat.name, cat.description]
        );
        categoryIds[cat.name] = result.insertId;
    }

    for (const item of FOOD_ITEMS) {
        const categoryId = categoryIds[item.category];
        if (categoryId) {
            await pool.execute(
                'INSERT INTO food_items (category_id, name, description, price, is_available) VALUES (?, ?, ?, ?, ?)',
                [categoryId, item.name, item.description, item.price, 1]
            );
        }
    }
    console.log('✅ Food categories and items created');
};

// Production: create ONLY one admin, using ADMIN_EMAIL / ADMIN_PASSWORD from the environment.
const seedAdminFromEnv = async () => {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.warn('⚠️ No users exist and ADMIN_EMAIL / ADMIN_PASSWORD are not set. No admin account was created.');
        return true;
    }
    if (ADMIN_PASSWORD.length < 8) {
        console.warn('⚠️ ADMIN_PASSWORD must be at least 8 characters. No admin account was created.');
        return true;
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [ADMIN_NAME || 'Administrator', ADMIN_EMAIL, hashed, 'admin']
    );
    console.log(`✅ Admin account created for ${ADMIN_EMAIL}`);
    return true;
};

// ============================================
// Main seed function
// ============================================
const seedData = async () => {
    try {
        // Only seed an empty database
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
        if (users[0].count > 0) {
            console.log('ℹ️ Seed data already exists, skipping...');
            return true;
        }

        if (!shouldSeedDemo()) {
            return await seedAdminFromEnv();
        }

        if (isProduction()) {
            console.warn('⚠️ SEED_DEMO_DATA=true in production: demo accounts with PUBLIC passwords are being created.');
        }

        await seedDemoUsers();
        await seedRoomTypesAndRooms();
        await seedSampleGuests();
        await seedFoodMenu();

        console.log('✅ Seed data completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
        return false;
    }
};

module.exports = {
    seedData
};
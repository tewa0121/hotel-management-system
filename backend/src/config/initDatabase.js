const { testConnection } = require('./db');
const { createTables } = require('./schema');
const { seedData } = require('./seed');

// Connect -> create tables -> seed (in that order). Stops at the first failure.
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
    initializeDatabase
};
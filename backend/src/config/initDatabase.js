const mysql = require('mysql2/promise');
const { testConnection, dbConfig } = require('./db');
const { createTables } = require('./schema');
const { seedData } = require('./seed');

// Creates the database itself when it does not exist yet, so a fresh clone of the
// project starts without any manual SQL import.
// This is never fatal: on hosted MySQL the database usually already exists and the
// account may not be allowed to create one. If the database really is unreachable,
// testConnection() below reports it.
const ensureDatabaseExists = async () => {
    const { database, ...serverConfig } = dbConfig;

    if (!database || database.length > 64 || /[`\x00-\x1f]/.test(database)) {
        console.warn(`⚠️ DB_NAME "${database}" is not a valid database name - skipping automatic database creation`);
        return;
    }

    let connection;
    try {
        connection = await mysql.createConnection(serverConfig);
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
    } catch (error) {
        console.warn(`⚠️ Could not check/create database "${database}": ${error.message}`);
    } finally {
        if (connection) {
            await connection.end().catch(() => {});
        }
    }
};

// Create database -> connect -> create tables -> seed (in that order). Stops at the first failure.
const initializeDatabase = async () => {
    await ensureDatabaseExists();

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
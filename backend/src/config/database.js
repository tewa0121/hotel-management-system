const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 8889,
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

module.exports = {
    pool: promisePool,
    poolRaw: pool,
    testConnection
};
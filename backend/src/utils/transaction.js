const { pool } = require('../config/db');

// Runs `work(connection)` inside ONE database transaction.
//
//  - finishes normally  -> COMMIT
//  - throws (any error) -> ROLLBACK, then the error is re-thrown
//  - always releases the connection, so a half-finished transaction can never
//    leak back into the pool and silently swallow other requests' writes
//
// Every query that must be part of the transaction has to use the `connection`
// that is passed to `work`, NOT the shared pool.
const withTransaction = async (work) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const result = await work(connection);
        await connection.commit();
        return result;
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError.message);
        }
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { withTransaction };
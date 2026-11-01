const { pool } = require('../config/db');

// mysql2 refuses `undefined` as a bind value, so anything missing/empty becomes NULL
const toNull = (value) => (value === undefined || value === '' ? null : value);
const withDefault = (value, fallback) => (value === undefined || value === null || value === '' ? fallback : value);

// Columns that can be changed through update()
const UPDATABLE_FIELDS = [
    'room_number', 'room_type_id', 'floor', 'building', 'status',
    'housekeeping_status', 'price_override', 'amenities', 'notes', 'is_active'
];

// Methods that take an optional last argument `db` can run inside a transaction:
// pass the transaction's connection instead of the shared pool.
class Room {
    static async findAll() {
        const [rows] = await pool.execute(`
            SELECT r.*, rt.name as room_type_name, rt.base_price, rt.max_occupancy, rt.bed_type
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.is_active = TRUE
            ORDER BY r.room_number
        `);
        return rows;
    }

    // Same as findAll, plus how many active reservations each room has (ordered by floor)
    static async findStatusBoard() {
        const [rows] = await pool.execute(`
            SELECT
                r.*,
                rt.name as room_type_name,
                rt.base_price,
                rt.max_occupancy,
                rt.bed_type,
                (
                    SELECT COUNT(*)
                    FROM reservations res
                    WHERE res.room_id = r.id
                    AND res.reservation_status IN ('confirmed', 'checked_in')
                    AND res.check_out_date >= CURDATE()
                ) as current_reservations
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.is_active = TRUE
            ORDER BY r.floor, r.room_number
        `);
        return rows;
    }

    static async findById(id, db = pool) {
        const [rows] = await db.execute(`
            SELECT r.*, rt.name as room_type_name, rt.base_price, rt.max_occupancy, rt.bed_type
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.id = ?
        `, [id]);
        return rows[0];
    }

    static async findByRoomNumber(roomNumber) {
        const [rows] = await pool.execute(
            'SELECT * FROM rooms WHERE room_number = ?',
            [roomNumber]
        );
        return rows[0];
    }

    static async create(data) {
        const {
            room_number, room_type_id, floor, building, status,
            housekeeping_status, price_override, amenities, notes
        } = data;

        const [result] = await pool.execute(
            `INSERT INTO rooms (
                room_number, room_type_id, floor, building, status,
                housekeeping_status, price_override, amenities, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                room_number,
                room_type_id,
                withDefault(floor, 1),
                withDefault(building, 'Main'),
                withDefault(status, 'available'),
                withDefault(housekeeping_status, 'clean'),
                toNull(price_override),
                toNull(amenities),
                toNull(notes)
            ]
        );
        return this.findById(result.insertId);
    }

    // Partial updates are supported: fields that are not sent keep their current value.
    // Returns null when the room does not exist.
    static async update(id, data) {
        const existing = await this.findById(id);
        if (!existing) return null;

        const merged = {};
        for (const field of UPDATABLE_FIELDS) {
            merged[field] = data[field] !== undefined ? data[field] : existing[field];
        }

        await pool.execute(
            `UPDATE rooms SET
                room_number = ?, room_type_id = ?, floor = ?, building = ?,
                status = ?, housekeeping_status = ?, price_override = ?,
                amenities = ?, notes = ?, is_active = ?
            WHERE id = ?`,
            [
                merged.room_number,
                merged.room_type_id,
                withDefault(merged.floor, 1),
                withDefault(merged.building, 'Main'),
                merged.status,
                merged.housekeeping_status,
                toNull(merged.price_override),
                toNull(merged.amenities),
                toNull(merged.notes),
                merged.is_active,
                id
            ]
        );
        return this.findById(id);
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM rooms WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async updateStatus(id, status, db = pool) {
        await db.execute('UPDATE rooms SET status = ? WHERE id = ?', [status, id]);
    }

    static async updateHousekeepingStatus(id, status, db = pool) {
        await db.execute('UPDATE rooms SET housekeeping_status = ? WHERE id = ?', [status, id]);
    }

    // After check-out: the room needs cleaning
    static async markDirty(id, db = pool) {
        await db.execute(
            "UPDATE rooms SET status = 'dirty', housekeeping_status = 'dirty' WHERE id = ?",
            [id]
        );
    }

    // ============================================
    // LOCK ROOMS (use inside a transaction only)
    // Locks the given room rows until the transaction ends, so two people can never
    // book / change the same room at the same moment. Rooms are always locked in
    // ascending id order, which makes deadlocks between two requests impossible.
    // IMPORTANT: call this BEFORE any other read in the transaction.
    // ============================================
    static async lockByIds(connection, ids) {
        const unique = [...new Set(ids.map(Number))]
            .filter(Number.isInteger)
            .sort((a, b) => a - b);

        if (unique.length === 0) return [];

        const placeholders = unique.map(() => '?').join(', ');
        const [rows] = await connection.execute(
            `SELECT id, room_number, status, is_active, room_type_id
             FROM rooms
             WHERE id IN (${placeholders})
             ORDER BY id
             FOR UPDATE`,
            unique
        );
        return rows;
    }

    static async getMaxOccupancy(roomTypeId, db = pool) {
        const [rows] = await db.execute(
            'SELECT max_occupancy FROM room_types WHERE id = ?',
            [roomTypeId]
        );
        return rows[0] ? rows[0].max_occupancy : null;
    }

    static async getStatusSummary() {
        const [rows] = await pool.execute(`
            SELECT status, COUNT(*) as count
            FROM rooms
            WHERE is_active = TRUE
            GROUP BY status
        `);
        return rows;
    }

    // ============================================
    // AVAILABLE ROOMS for a stay (YYYY-MM-DD dates)
    // A stay is [check-in, check-out): leaving on the 5th does NOT conflict with
    // someone else arriving on the 5th. Pending, confirmed and checked-in
    // reservations all block a room.
    // ============================================
    static async getAvailableRooms(checkIn, checkOut, roomTypeId = null, guests = null) {
        let query = `
            SELECT r.*, rt.name as room_type_name, rt.base_price, rt.max_occupancy
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.is_active = TRUE
            AND r.status NOT IN ('maintenance', 'out_of_service')
            AND NOT EXISTS (
                SELECT 1 FROM reservations res
                WHERE res.room_id = r.id
                AND res.reservation_status IN ('pending', 'confirmed', 'checked_in')
                AND res.check_in_date < ?
                AND res.check_out_date > ?
            )
        `;

        const params = [checkOut, checkIn];

        if (roomTypeId) {
            query += ' AND r.room_type_id = ?';
            params.push(roomTypeId);
        }

        if (guests) {
            query += ' AND rt.max_occupancy >= ?';
            params.push(guests);
        }

        query += ' ORDER BY r.room_number';

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async getRoomTypes() {
        const [rows] = await pool.execute(
            'SELECT * FROM room_types WHERE is_active = TRUE ORDER BY name'
        );
        return rows;
    }
}

module.exports = Room;
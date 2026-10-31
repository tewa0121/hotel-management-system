const { pool } = require('../config/db');

// mysql2 refuses `undefined` as a bind value, so anything missing/empty becomes NULL
const toNull = (value) => (value === undefined || value === '' ? null : value);
const withDefault = (value, fallback) => (value === undefined || value === null || value === '' ? fallback : value);

// Columns that can be changed through update()
const UPDATABLE_FIELDS = [
    'room_number', 'room_type_id', 'floor', 'building', 'status',
    'housekeeping_status', 'price_override', 'amenities', 'notes', 'is_active'
];

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

    static async findById(id) {
        const [rows] = await pool.execute(`
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

    static async updateStatus(id, status) {
        await pool.execute('UPDATE rooms SET status = ? WHERE id = ?', [status, id]);
    }

    static async updateHousekeepingStatus(id, status) {
        await pool.execute('UPDATE rooms SET housekeeping_status = ? WHERE id = ?', [status, id]);
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

    static async getAvailableRooms(checkIn, checkOut, roomTypeId = null, guests = null) {
        let query = `
            SELECT r.*, rt.name as room_type_name, rt.base_price, rt.max_occupancy
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.is_active = TRUE
            AND r.status NOT IN ('maintenance', 'out_of_service')
            AND r.id NOT IN (
                SELECT room_id FROM reservations 
                WHERE reservation_status IN ('confirmed', 'checked_in')
                AND (
                    (check_in_date <= ? AND check_out_date > ?) OR
                    (check_in_date < ? AND check_out_date >= ?) OR
                    (check_in_date >= ? AND check_out_date <= ?)
                )
            )
        `;

        const params = [
            checkOut, checkIn,
            checkOut, checkIn,
            checkIn, checkOut
        ];

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
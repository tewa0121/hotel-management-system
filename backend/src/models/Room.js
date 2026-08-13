const { pool } = require('../config/database');

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
                room_number, room_type_id, floor, building, status || 'available',
                housekeeping_status || 'clean', price_override, amenities, notes
            ]
        );
        return this.findById(result.insertId);
    }

    static async update(id, data) {
        const {
            room_number, room_type_id, floor, building, status,
            housekeeping_status, price_override, amenities, notes, is_active
        } = data;

        await pool.execute(
            `UPDATE rooms SET
                room_number = ?, room_type_id = ?, floor = ?, building = ?,
                status = ?, housekeeping_status = ?, price_override = ?,
                amenities = ?, notes = ?, is_active = ?
            WHERE id = ?`,
            [
                room_number, room_type_id, floor, building,
                status, housekeeping_status, price_override,
                amenities, notes, is_active !== undefined ? is_active : true, id
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
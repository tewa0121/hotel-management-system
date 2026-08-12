import api from './api';

const reservationService = {
    // Get all reservations
    async getReservations(page = 1, limit = 20, status = '', date = '') {
        try {
            const response = await api.get('/reservations', {
                params: { page, limit, status, date }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get available rooms
    async getAvailableRooms(checkIn, checkOut, roomTypeId = null, guests = null) {
        try {
            const response = await api.post('/reservations/available-rooms', {
                check_in_date: checkIn,
                check_out_date: checkOut,
                room_type_id: roomTypeId,
                guests: guests
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Create reservation
    async createReservation(reservationData) {
        try {
            const response = await api.post('/reservations', reservationData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get single reservation
    async getReservation(id) {
        try {
            const response = await api.get(`/reservations/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update reservation
    async updateReservation(id, reservationData) {
        try {
            const response = await api.put(`/reservations/${id}`, reservationData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // ✅ Cancel reservation
    async cancelReservation(id) {
        try {
            const response = await api.post(`/reservations/${id}/cancel`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // ✅ Check-in
    async checkIn(id) {
        try {
            console.log(`📤 checkIn service called for ${id}`);
            const response = await api.post(`/reservations/${id}/check-in`);
            console.log(`📥 checkIn response:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ checkIn error:`, error);
            throw error.response?.data || error.message;
        }
    },

    // ✅ Check-out
    async checkOut(id) {
        try {
            console.log(`📤 checkOut service called for ${id}`);
            const response = await api.post(`/reservations/${id}/check-out`);
            console.log(`📥 checkOut response:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ checkOut error:`, error);
            throw error.response?.data || error.message;
        }
    }
};

export default reservationService;

import api from './api';

const getError = (error) =>
    error.response?.data || error.message || 'Something went wrong';

const reservationService = {
    async getReservations(page = 1, limit = 20, status = '', date = '') {
        try {
            const response = await api.get('/reservations', {
                params: { page, limit, status, date },
            });
            return response.data;
        } catch (error) {
            throw getError(error);
        }
    },

    async getAvailableRooms(checkIn, checkOut, roomTypeId = null, guests = null) {
        try {
            const response = await api.post('/reservations/available-rooms', {
                check_in_date: checkIn,
                check_out_date: checkOut,
                room_type_id: roomTypeId,
                guests,
            });
            return response.data;
        } catch (error) {
            throw getError(error);
        }
    },

    async createReservation(data) {
        try {
            const response = await api.post('/reservations', data);
            return response.data;
        } catch (error) {
            throw getError(error);
        }
    },

    async getReservation(id) {
        try {
            const response = await api.get(`/reservations/${id}`);
            return response.data;
        } catch (error) {
            throw getError(error);
        }
    },

    async updateReservation(id, data) {
        try {
            const response = await api.put(`/reservations/${id}`, data);
            return response.data;
        } catch (error) {
            throw getError(error);
        }
    },

    async cancelReservation(id) {
        try {
            const response = await api.post(`/reservations/${id}/cancel`);
            return response.data;
        } catch (error) {
            throw getError(error);
        }
    },

    async checkIn(id) {
        try {
            const response = await api.post(`/reservations/${id}/check-in`);
            return response.data;
        } catch (error) {
            throw getError(error);
        }
    },

    async checkOut(id) {
        try {
            const response = await api.post(`/reservations/${id}/check-out`);
            return response.data;
        } catch (error) {
            throw getError(error);
        }
    },

    async getReservationsByGuest(guestId) {
        try {
            const response = await api.get(`/reservations/guest/${guestId}`);
            return response.data;
        } catch (error) {
            throw getError(error);
        }
    },
};

export default reservationService;

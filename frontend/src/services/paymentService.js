import api from './api';

const paymentService = {
  // Get all payments with pagination
  async getPayments(page = 1, limit = 20, status = '') {
    try {
      const response = await api.get('/payments', {
        params: { page, limit, status }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get payments by reservation
  async getPaymentsByReservation(reservationId) {
    try {
      const response = await api.get(`/payments/reservation/${reservationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create payment
  async createPayment(paymentData) {
    try {
      const response = await api.post('/payments', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Refund payment
  async refundPayment(id, reason) {
    try {
      const response = await api.post(`/payments/${id}/refund`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default paymentService;
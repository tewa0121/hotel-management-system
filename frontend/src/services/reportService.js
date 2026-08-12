import api from './api';

const reportService = {
  // Occupancy report
  async getOccupancy(startDate = '', endDate = '') {
    try {
      const response = await api.get('/reports/occupancy', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Revenue report
  async getRevenue(startDate = '', endDate = '', period = 'daily') {
    try {
      const response = await api.get('/reports/revenue', {
        params: { start_date: startDate, end_date: endDate, period }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reservations report
  async getReservations(startDate = '', endDate = '') {
    try {
      const response = await api.get('/reports/reservations', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Guests report
  async getGuests() {
    try {
      const response = await api.get('/reports/guests');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Payments report
  async getPayments(startDate = '', endDate = '') {
    try {
      const response = await api.get('/reports/payments', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default reportService;
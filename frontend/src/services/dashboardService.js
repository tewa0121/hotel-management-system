import api from './api';

const dashboardService = {
  // Get dashboard stats
  async getStats() {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get occupancy data for chart
  async getOccupancyData(days = 30) {
    try {
      const response = await api.get('/dashboard/occupancy', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get revenue data for chart
  async getRevenueData(period = 'monthly') {
    try {
      const response = await api.get('/dashboard/revenue', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get payment method breakdown
  async getPaymentBreakdown() {
    try {
      const response = await api.get('/dashboard/payment-breakdown');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get recent activity
  async getRecentActivity(limit = 10) {
    try {
      const response = await api.get('/dashboard/recent-activity', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default dashboardService;
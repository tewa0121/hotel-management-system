import api from './api';

const guestService = {
  // Get all guests with pagination
  async getGuests(page = 1, limit = 20, search = '') {
    try {
      const response = await api.get('/guests', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single guest
  async getGuest(id) {
    try {
      const response = await api.get(`/guests/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create guest
  async createGuest(guestData) {
    try {
      const response = await api.post('/guests', guestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update guest
  async updateGuest(id, guestData) {
    try {
      const response = await api.put(`/guests/${id}`, guestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete guest
  async deleteGuest(id) {
    try {
      const response = await api.delete(`/guests/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default guestService;
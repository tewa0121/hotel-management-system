import api from './api';

const settingsService = {
  // Get all settings
  async getSettings() {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update settings
  async updateSettings(settingsData) {
    try {
      const response = await api.put('/settings', settingsData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get users
  async getUsers() {
    try {
      const response = await api.get('/settings/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create user
  async createUser(userData) {
    try {
      const response = await api.post('/settings/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user
  async updateUser(id, userData) {
    try {
      const response = await api.put(`/settings/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete user
  async deleteUser(id) {
    try {
      const response = await api.delete(`/settings/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get audit logs
  async getAuditLogs(limit = 50) {
    try {
      const response = await api.get('/settings/audit-logs', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default settingsService;
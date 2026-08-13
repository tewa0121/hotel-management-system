import api from './api';

const housekeepingService = {
  // Get all tasks
  async getTasks(status = '', assignedTo = '') {
    try {
      console.log('📡 Fetching housekeeping tasks with:', { status, assignedTo });
      const response = await api.get('/housekeeping', {
        params: { status, assigned_to: assignedTo }
      });
      console.log('📥 Housekeeping response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getTasks error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get dashboard
  async getDashboard() {
    try {
      const response = await api.get('/housekeeping/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create task
  async createTask(taskData) {
    try {
      console.log('📤 Creating housekeeping task:', taskData);
      const response = await api.post('/housekeeping', taskData);
      console.log('📥 Create response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Create error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update task
  async updateTask(id, taskData) {
    try {
      console.log(`📤 Updating housekeeping ${id}:`, taskData);
      const response = await api.put(`/housekeeping/${id}`, taskData);
      console.log('📥 Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Update error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Assign task
  async assignTask(id, assignedTo) {
    try {
      const response = await api.post(`/housekeeping/${id}/assign`, { assigned_to: assignedTo });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete task
  async deleteTask(id) {
    try {
      const response = await api.delete(`/housekeeping/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default housekeepingService;
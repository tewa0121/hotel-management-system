import api from './api';

const roomService = {
  // Get all rooms
  async getRooms() {
    try {
      const response = await api.get('/rooms');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get room status board
  async getStatusBoard() {
    try {
      const response = await api.get('/rooms/status-board');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get room types
  async getRoomTypes() {
    try {
      const response = await api.get('/rooms/types/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single room
  async getRoom(id) {
    try {
      const response = await api.get(`/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create room
  async createRoom(roomData) {
    try {
      const response = await api.post('/rooms', roomData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update room
  async updateRoom(id, roomData) {
    try {
      const response = await api.put(`/rooms/${id}`, roomData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete room
  async deleteRoom(id) {
    try {
      const response = await api.delete(`/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default roomService;
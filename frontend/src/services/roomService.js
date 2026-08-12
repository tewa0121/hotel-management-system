import api from './api';

const roomService = {
  // Get all rooms
  async getRooms() {
    try {
      console.log('📡 Calling GET /rooms');
      const response = await api.get('/rooms');
      console.log('📥 Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getRooms error:', error);
      throw error;
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
      console.log('📡 Calling GET /rooms/types/all');
      const response = await api.get('/rooms/types/all');
      console.log('📥 Room types:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getRoomTypes error:', error);
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
      console.log('📡 Calling POST /rooms with:', roomData);
      const response = await api.post('/rooms', roomData);
      console.log('📥 Create response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ createRoom error:', error);
      throw error;
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
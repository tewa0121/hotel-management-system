import api from './api';

const authService = {
  // Login user
  async login(email, password) {
    console.log('🔍 authService.login - email:', email);
    console.log('🔍 authService.login - password:', password);
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Login response:', response);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Check if authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get user from localStorage
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default authService;
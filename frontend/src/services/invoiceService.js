import api from './api';

const invoiceService = {
  // Get all invoices
  async getInvoices(page = 1, limit = 20, status = '') {
    try {
      const response = await api.get('/invoices', {
        params: { page, limit, status }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get invoice by ID
  async getInvoice(id) {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get invoice by reservation
  async getInvoiceByReservation(reservationId) {
    try {
      const response = await api.get(`/invoices/reservation/${reservationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create invoice
  async createInvoice(invoiceData) {
    try {
      const response = await api.post('/invoices', invoiceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update invoice
  async updateInvoice(id, invoiceData) {
    try {
      const response = await api.put(`/invoices/${id}`, invoiceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Download invoice PDF
  async downloadInvoice(id) {
    try {
      const response = await api.get(`/invoices/${id}/download`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Send invoice email
  async sendInvoiceEmail(id, email) {
    try {
      const response = await api.post(`/invoices/${id}/send`, { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default invoiceService;
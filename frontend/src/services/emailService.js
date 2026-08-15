import api from './api';

const emailService = {
    // Send reservation confirmation
    async sendReservationConfirmation(reservationId) {
        try {
            const response = await api.post(`/email/reservation/${reservationId}/confirm`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Send check-in email
    async sendCheckInEmail(reservationId) {
        try {
            const response = await api.post(`/email/reservation/${reservationId}/check-in-email`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Send check-out email
    async sendCheckOutEmail(reservationId) {
        try {
            const response = await api.post(`/email/reservation/${reservationId}/check-out-email`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Send invoice email
    async sendInvoiceEmail(invoiceId) {
        try {
            const response = await api.post(`/email/invoice/${invoiceId}/send`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Send password reset email
    async sendPasswordReset(email) {
        try {
            const response = await api.post('/email/password-reset', { email });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Send welcome email (admin only)
    async sendWelcomeEmail(email, name, password) {
        try {
            const response = await api.post('/email/welcome', { email, name, password });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Send test email (admin only)
    async sendTestEmail(email) {
        try {
            const response = await api.post('/email/test', { email });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default emailService;
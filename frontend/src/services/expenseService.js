import api from './api';

const expenseService = {
    // Get all expenses
    async getExpenses() {
        try {
            const response = await api.get('/expenses');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get single expense
    async getExpense(id) {
        try {
            const response = await api.get(`/expenses/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Create expense
    async createExpense(expenseData) {
        try {
            console.log('📤 Creating expense:', expenseData);
            const response = await api.post('/expenses', expenseData);
            console.log('📥 Create response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Create error:', error);
            throw error.response?.data || error.message;
        }
    },

    // Update expense
    async updateExpense(id, expenseData) {
        try {
            const response = await api.put(`/expenses/${id}`, expenseData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Delete expense
    async deleteExpense(id) {
        try {
            const response = await api.delete(`/expenses/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default expenseService;
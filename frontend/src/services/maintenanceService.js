import api from './api';

const maintenanceService = {
    // Get all requests
    async getRequests(status = '', priority = '') {
        try {
            const response = await api.get('/maintenance', {
                params: { status, priority }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get dashboard
    async getDashboard() {
        try {
            const response = await api.get('/maintenance/dashboard');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Create request
    async createRequest(requestData) {
        try {
            console.log('📤 Creating maintenance request:', requestData);
            const response = await api.post('/maintenance', requestData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update request - FULL UPDATE
    async updateRequest(id, requestData) {
        try {
            console.log(`📤 Updating maintenance ${id} with:`, requestData);
            const response = await api.put(`/maintenance/${id}`, requestData);
            console.log('📥 Update response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Update error:', error);
            throw error.response?.data || error.message;
        }
    },

    // ✅ NEW - Direct status update (PATCH)
    async updateStatus(id, status) {
        try {
            console.log(`📤 Updating status for ${id} to: ${status}`);
            const response = await api.patch(`/maintenance/${id}/status`, { status });
            console.log('📥 Status update response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Status update error:', error);
            throw error.response?.data || error.message;
        }
    },

    // Delete request
    async deleteRequest(id) {
        try {
            const response = await api.delete(`/maintenance/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default maintenanceService;
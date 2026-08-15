// frontend/src/services/settingsService.js
import api from './api';

const settingsService = {
    // Settings
    getSettings() {
        return api.get('/settings').then(res => res.data);
    },
    updateSettings(data) {
        return api.put('/settings', data).then(res => res.data);
    },

    // Users
    getUsers() {
        return api.get('/settings/users').then(res => res.data);
    },
    createUser(data) {
        return api.post('/settings/users', data).then(res => res.data);
    },
    updateUser(id, data) {
        return api.put(`/settings/users/${id}`, data).then(res => res.data);
    },
    deleteUser(id) {
        return api.delete(`/settings/users/${id}`).then(res => res.data);
    },

    // Audit Logs
    getAuditLogs(limit = 50) {
        return api.get('/settings/audit-logs', { params: { limit } }).then(res => res.data);
    }
};

export default settingsService;
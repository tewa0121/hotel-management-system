import api from './api';

const notificationService = {
    // Get all notifications for current user
    getNotifications() {
        return api.get('/notifications').then(res => res.data);
    },

    // Mark a single notification as read
    markAsRead(id) {
        return api.put(`/notifications/${id}/read`).then(res => res.data);
    },

    // Mark all notifications as read
    markAllAsRead() {
        return api.put('/notifications/read-all').then(res => res.data);
    }
};

export default notificationService;
import api from './api';

const foodService = {
    // Categories
    getCategories() {
        return api.get('/food/categories').then(res => res.data);
    },
    createCategory(data) {
        return api.post('/food/categories', data).then(res => res.data);
    },
    updateCategory(id, data) {
        return api.put(`/food/categories/${id}`, data).then(res => res.data);
    },
    deleteCategory(id) {
        return api.delete(`/food/categories/${id}`).then(res => res.data);
    },

    // Items
    getItems(categoryId) {
        return api.get('/food/items', { params: { categoryId } }).then(res => res.data);
    },
    createItem(data) {
        return api.post('/food/items', data).then(res => res.data);
    },
    updateItem(id, data) {
        return api.put(`/food/items/${id}`, data).then(res => res.data);
    },
    deleteItem(id) {
        return api.delete(`/food/items/${id}`).then(res => res.data);
    },

    // Orders
    getOrders(filters) {
        return api.get('/food/orders', { params: filters }).then(res => res.data);
    },
    getOrder(id) {
        return api.get(`/food/orders/${id}`).then(res => res.data);
    },
    createOrder(data) {
        return api.post('/food/orders', data).then(res => res.data);
    },
    updateOrder(id, data) {
        return api.put(`/food/orders/${id}`, data).then(res => res.data);
    },
    deleteOrder(id) {
        return api.delete(`/food/orders/${id}`).then(res => res.data);
    },

    // ✅ NEW: Get food stats for dashboard
    getStats() {
        return api.get('/food/stats').then(res => res.data);
    }
};

export default foodService;
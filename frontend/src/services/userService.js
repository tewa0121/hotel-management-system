import api from './api';

const userService = {
    // Get all users
    async getUsers() {
        try {
            const response = await api.get('/settings/users');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get staff - ONLY users with maintenance role
    async getStaff() {
        try {
            const response = await api.get('/settings/users');
            console.log('📥 All users:', response.data);
            
            if (response.data && response.data.success) {
                // ✅ FILTER: Only show users with 'maintenance' role
                const maintenanceStaff = response.data.data.filter(user => 
                    user.role === 'maintenance'
                );
                console.log('✅ Maintenance staff:', maintenanceStaff);
                return maintenanceStaff; // Return array directly
            }
            
            // Fallback if everything fails
            return [
                { id: 1, name: 'Maintenance Staff 1', role: 'maintenance' },
                { id: 2, name: 'Maintenance Staff 2', role: 'maintenance' },
            ];
        } catch (error) {
            console.error('❌ Error fetching staff:', error);
            return [
                { id: 1, name: 'Maintenance Staff 1', role: 'maintenance' },
                { id: 2, name: 'Maintenance Staff 2', role: 'maintenance' },
            ];
        }
    },

    // Get all staff (including admin and manager for settings)
    async getAllStaff() {
        try {
            const response = await api.get('/settings/users');
            if (response.data && response.data.success) {
                // Show admin, manager, and maintenance
                const staff = response.data.data.filter(user => 
                    user.role === 'maintenance' || 
                    user.role === 'admin' || 
                    user.role === 'manager'
                );
                return staff;
            }
            return [];
        } catch (error) {
            console.error('❌ Error fetching all staff:', error);
            return [];
        }
    }
};

export default userService;
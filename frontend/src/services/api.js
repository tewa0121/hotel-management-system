import axios from 'axios';

// Make sure this URL is correct
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔗 API Base URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor – add token and log requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // ✅ Log full request details (mask password in body if present)
        console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
        if (config.data) {
            const logData = { ...config.data };
            if (logData.password) logData.password = '*****';
            console.log('📤 Request body:', logData);
        }
        console.log('📤 Headers:', config.headers);

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor – log responses and handle errors
api.interceptors.response.use(
    (response) => {
        console.log(`📥 ${response.status} ${response.config.url}`);
        console.log('📥 Response data:', response.data);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', error);

        // Log the full error details
        if (error.response) {
            console.error('❌ Status:', error.response.status);
            console.error('❌ Data:', error.response.data);
            console.error('❌ Headers:', error.response.headers);
        } else if (error.request) {
            console.error('❌ No response received:', error.request);
        } else {
            console.error('❌ Request error:', error.message);
        }

        // Handle 401 – only redirect if not a guest login
        if (error.response?.status === 401) {
            const isGuestRoute = error.config?.url?.includes('/guest/');
            if (!isGuestRoute) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
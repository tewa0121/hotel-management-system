
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach the login token to requests.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle authentication errors centrally.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isGuestRoute = error.config?.url?.includes('/guest/');

            if (!isGuestRoute) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;

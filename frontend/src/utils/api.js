import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Attach auth token automatically to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Handle 401 globally — redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
};

export const adventuresAPI = {
    getAll: (params) => api.get('/adventures', { params }),
    getById: (id) => api.get(`/adventures/${id}`)
};

export const bookingsAPI = {
    getAll: (params) => api.get('/bookings', { params }),
    getUserBookings: (userId) => api.get(`/bookings/user/${userId}`),
    create: (data) => api.post('/bookings', data),
    cancel: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
    updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
    createOrder: (data) => api.post('/payments/create-order', data),
    verifyPayment: (data) => api.post('/payments/verify-payment', data),
};

export const usersAPI = {
    updateProfile: (id, data) => api.put(`/users/${id}`, data),
    uploadAvatar: (id, file) => {
        const fd = new FormData();
        fd.append('avatar', file);
        return api.post(`/users/${id}/avatar`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    changePassword: (data) => api.post('/auth/change-password', data),
};

// Public settings endpoint (read-only, no auth). Falls back to defaults if the API
// isn't reachable so the gallery still renders gracefully.
export const publicSettingsAPI = {
    getInstagramPosts: async () => {
        try {
            const res = await api.get('/settings/public', { params: { key: 'instagram_posts' } });
            const raw = res.data?.data?.value ?? res.data?.value;
            if (!raw) return [];
            const parsed = typeof raw === 'string' ? safeJsonParse(raw) : raw;
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
            return [];
        }
    },
    getHandle: async () => {
        try {
            const res = await api.get('/settings/public', { params: { key: 'instagram_handle' } });
            return res.data?.data?.value || res.data?.value || '@phoenixadventures';
        } catch {
            return '@phoenixadventures';
        }
    },
};

function safeJsonParse(s) {
    try { return JSON.parse(s); } catch { return []; }
}

export default api;

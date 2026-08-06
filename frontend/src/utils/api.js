import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getCsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const method = config.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
        const csrf = getCsrfToken();
        if (csrf) {
            config.headers['X-CSRF-Token'] = csrf;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 503 && error.response?.data?.maintenance) {
            window.dispatchEvent(new CustomEvent('maintenance:activated', {
                detail: error.response.data,
            }));
        }
        if (error.response?.status === 401) {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export const getImageUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path) || path.startsWith('//')) {
        return path.startsWith('//') ? `https:${path}` : path;
    }
    if (path.startsWith('/uploads/')) {
        return `${API_BASE_URL}${path}`;
    }
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const adventuresAPI = {
    getAll: (params) => api.get('/adventures', { params }),
    getById: (id) => api.get(`/adventures/${id}`),
};

export const authAPI = {
    me: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
};

export const contactAPI = {
    submit: (data) => api.post('/contact', data),
};

export const bookingsAPI = {
    createManual: (data) => api.post('/bookings/manual', data),
    getPaymentDetails: (bookingId) => api.get(`/bookings/${bookingId}/payment`),
    getById: (bookingId) => api.get(`/bookings/${bookingId}`),
    getUserBookings: (userId) => api.get(`/bookings/user/${userId}`),
    submitPayment: (data) => {
        const { screenshot, ...rest } = data;
        if (screenshot) {
            const fd = new FormData();
            Object.entries(rest).forEach(([k, v]) => {
                if (v != null && v !== '') fd.append(k, v);
            });
            fd.append('screenshot', screenshot);
            return api.post('/payments/manual/submit', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        return api.post('/payments/manual/submit', rest);
    },
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

export const blogAPI = {
    getAll: (params) => api.get('/blog', { params }),
    getBySlug: (slug) => api.get(`/blog/post/${slug}`),
};

export const newsletterAPI = {
    subscribe: (email) => api.post('/newsletter/subscribe', { email }),
};

function safeJsonParse(s) {
    try { return JSON.parse(s); } catch { return []; }
}

export const publicSettingsAPI = {
    getAll: async () => {
        try {
            const res = await api.get('/settings/public');
            return res.data?.data || {};
        } catch {
            return {};
        }
    },
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

export default api;

// Bootstrap CSRF cookie before any mutating requests
api.get('/settings/public').catch(() => {});

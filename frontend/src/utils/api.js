import axios from 'axios';
import {
    clearSessionToken,
    getCsrfToken,
    getSessionToken,
    setCachedCsrf,
    setSessionToken,
} from './session';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = getSessionToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

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
    (response) => {
        const csrf = response.headers?.['x-csrf-token'];
        if (csrf) setCachedCsrf(csrf);
        return response;
    },
    (error) => {
        if (error.response?.headers?.['x-csrf-token']) {
            setCachedCsrf(error.response.headers['x-csrf-token']);
        }
        if (error.response?.status === 503 && error.response?.data?.maintenance) {
            window.dispatchEvent(new CustomEvent('maintenance:activated', {
                detail: error.response.data,
            }));
        }
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            if (!url.includes('/auth/me')) {
                clearSessionToken();
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
        }
        return Promise.reject(error);
    }
);

export const getImageUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path) || path.startsWith('//')) {
        return path.startsWith('//') ? `https:${path}` : path;
    }
    // Cloudinary public delivery URLs stored without protocol
    if (path.includes('res.cloudinary.com')) {
        return path.startsWith('//') ? `https:${path}` : `https://${path.replace(/^\/+/, '')}`;
    }
    // Legacy local uploads served by backend (dev only)
    if (path.startsWith('/uploads/')) {
        return `${API_BASE_URL}${path}`;
    }
    // Frontend public assets (/placeholder.jpg, /founders/, etc.)
    if (path.startsWith('/')) {
        return path;
    }
    return `/${path}`;
};

export const adventuresAPI = {
    getAll: (params) => api.get('/adventures', { params }),
    getById: (id) => api.get(`/adventures/${id}`),
};

export const authAPI = {
    me: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
    verify2faLogin: (challengeToken, code) =>
        api.post('/auth/2fa/verify-login', { challengeToken, code }),
};

export const twoFactorAPI = {
    status: () => api.get('/auth/2fa/status'),
    setup: () => api.post('/auth/2fa/setup'),
    enable: (secret, code) => api.post('/auth/2fa/enable', { secret, code }),
    disable: (code, password) => api.post('/auth/2fa/disable', { code: code || '', password }),
};

export const contactAPI = {
    submit: (data) => api.post('/contact', data),
};

export const bookingsAPI = {
    createManual: (data) => api.post('/bookings/manual', data),
    getPaymentDetails: (bookingId, params) => api.get(`/bookings/${bookingId}/payment`, { params }),
    getById: (bookingId) => api.get(`/bookings/${bookingId}`),
    getUserBookings: (userId) => api.get(`/bookings/user/${userId}`),
    cancel: (bookingId, reason) => api.post(`/bookings/${bookingId}/cancel`, { reason }),
    downloadItinerary: (bookingId) =>
        api.get(`/bookings/${bookingId}/itinerary.pdf`, { responseType: 'blob' }),
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

export const waitlistAPI = {
    join: (data) => api.post('/waitlist', data),
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

export { setSessionToken, clearSessionToken, getSessionToken } from './session';

// Bootstrap CSRF token (cross-site SPAs read it from X-CSRF-Token response header).
api.get('/settings/public').catch(() => {});

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

    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
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

// Response interceptor for handling errors
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
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            if (!url.includes('/auth/me')) {
                clearSessionToken();
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
        }
        if (error.response?.status === 403 && error.response?.data?.requires2faSetup) {
            window.dispatchEvent(new CustomEvent('auth:requires2faSetup'));
        }
        return Promise.reject(error);
    }
);

/** Public adventure/tour images (Cloudinary https URLs). Do not use for signed payment screenshots. */
export const getImageUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path) || path.startsWith('//')) {
        return path.startsWith('//') ? `https:${path}` : path;
    }
    if (path.includes('res.cloudinary.com')) {
        return path.startsWith('//') ? `https:${path}` : `https://${path.replace(/^\/+/, '')}`;
    }
    if (path.startsWith('/uploads/')) {
        return `${API_BASE_URL}${path}`;
    }
    if (path.startsWith('/')) {
        return path;
    }
    return `/${path}`;
};

/**
 * Normalize adventure/user/review objects to always have `id` field
 */
const normalizeId = (obj) => {
    if (!obj) return obj;
    return { ...obj, id: obj._id || obj.id };
};

const normalizeArray = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map(normalizeId);
};

// Adventures API
export const adventuresAPI = {
    getAll: async (params = {}) => {
        const res = await api.get('/adventures', { params: { ...params, includeAllDates: true } });
        if (res.data?.data) res.data.data = normalizeArray(res.data.data);
        return res;
    },
    getById: async (id) => {
        const res = await api.get(`/adventures/${id}`, { params: { includeAllDates: true } });
        if (res.data?.data) res.data.data = normalizeId(res.data.data);
        return res;
    },
    create: (data) => api.post('/adventures', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.put(`/adventures/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/adventures/${id}`),

    // AI features
    optimizeItinerary: (data) => api.post('/adventures/ai/optimize-itinerary', data),
    extractFromPDF: (formData) => api.post('/adventures/ai/extract-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
    }),
    generateDescription: (data) => api.post('/adventures/ai/generate-description', data),
    uploadImages: (formData) => api.post('/adventures/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    downloadItineraryPdf: (id) => api.get(`/adventures/${id}/itinerary.pdf`, {
        responseType: 'blob',
        timeout: 60000,
    }),
};

// Reviews API
export const reviewsAPI = {
    getForAdventure: async (adventureId, params) => {
        const res = await api.get(`/reviews/adventure/${adventureId}`, { params });
        if (res.data?.data) res.data.data = normalizeArray(res.data.data);
        return res;
    },
    approve: (id) => api.put(`/reviews/${id}/approve`),
    delete: (id) => api.delete(`/reviews/${id}`),
};

// Settings API
export const settingsAPI = {
    getAll: () => api.get('/settings'),
    set: (key, value) => api.put('/settings', { key, value }),
};

// Blog (admin)
export const blogAdminAPI = {
    getAll: () => api.get('/blog/admin/all'),
    getById: (id) => api.get(`/blog/admin/${id}`),
    create: (data) => api.post('/blog/admin', data),
    update: (id, data) => api.put(`/blog/admin/${id}`, data),
    delete: (id) => api.delete(`/blog/admin/${id}`),
};

// Contact messages (admin)
export const contactAdminAPI = {
    getAll: () => api.get('/contact'),
    setStatus: (id, status) => api.put(`/contact/${id}/status`, { status }),
    delete: (id) => api.delete(`/contact/${id}`),
};

export const paymentsAdminAPI = {
    getPending: () => api.get('/payments/admin/manual/pending'),
    verify: (booking_id) => api.post('/payments/admin/manual/verify', { booking_id }),
    reject: (booking_id, rejection_reason) => api.post('/payments/admin/manual/reject', { booking_id, rejection_reason }),
};

export const bookingsAdminAPI = {
    getAll: (params) => api.get('/bookings/admin/all', { params }),
    release: (bookingId, reason) => api.post(`/bookings/admin/${bookingId}/release`, { reason }),
};

export const twoFactorAPI = {
    status: () => api.get('/auth/2fa/status'),
    setup: () => api.post('/auth/2fa/setup'),
    enable: (secret, code) => api.post('/auth/2fa/enable', { secret, code }),
    disable: (code, password) => api.post('/auth/2fa/disable', { code: code || '', password }),
    emergencyReset: (email, password, resetKey) =>
        api.post('/auth/2fa/emergency-reset', { email, password, resetKey }),
};

export const dashboardAPI = {
    getOverview: (params = {}) => api.get('/dashboard/overview', { params }),
};

export const newsletterAdminAPI = {
    getAll: () => api.get('/newsletter'),
    blast: (data) => api.post('/newsletter/blast', data),
};

export const auditAdminAPI = {
    getAll: (params) => api.get('/audit', { params }),
};

export const usersAdminAPI = {
    getAll: (params) => api.get('/users', { params }),
    setRole: (id, role) => api.put(`/users/${id}/role`, { role }),
    createStaff: (data) => api.post('/users/staff', data),
};

export default api;

export { setSessionToken, clearSessionToken, getSessionToken } from './session';

// Bootstrap CSRF token (cross-site SPAs read it from X-CSRF-Token response header).
api.get('/settings/public').catch(() => {});

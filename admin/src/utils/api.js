import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

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
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    generateDescription: (data) => api.post('/adventures/ai/generate-description', data),
    uploadImages: (formData) => api.post('/adventures/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
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
    disable: (code, password) => api.post('/auth/2fa/disable', { code, password }),
};

export default api;

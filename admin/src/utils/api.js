import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Adventures API
export const adventuresAPI = {
    getAll: (params = {}) => api.get('/adventures', { params: { ...params, includeAllDates: true } }),
    getById: (id) => api.get(`/adventures/${id}`, { params: { includeAllDates: true } }),
    create: (data) => api.post('/adventures', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.put(`/adventures/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/adventures/${id}`),
    getStats: () => api.get('/adventures/stats'),

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

// Bookings API
export const bookingsAPI = {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status })
};

// Users API
export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`)
};

// Reviews API
export const reviewsAPI = {
    getAll: (params) => api.get('/reviews', { params }),
    getForAdventure: (adventureId, params) => api.get(`/reviews/adventure/${adventureId}`, { params }),
    approve: (id) => api.put(`/reviews/${id}/approve`),
    delete: (id) => api.delete(`/reviews/${id}`),
};

// Wishlist API
export const wishlistAPI = {
    getForUser: (userId) => api.get(`/wishlist/user/${userId}`),
};

// Newsletter API
export const newsletterAPI = {
    getAll: () => api.get('/newsletter'),
};

// Audit log API
export const auditAPI = {
    getAll: (params) => api.get('/audit', { params }),
};

// Settings API
export const settingsAPI = {
    getAll: () => api.get('/settings'),
    set: (key, value) => api.put('/settings', { key, value }),
};

export default api;

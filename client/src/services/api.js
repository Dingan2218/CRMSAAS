import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://crm.rmaoverseas.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  changePassword: (payload) => api.put('/auth/password', payload),
  updateProfile: (payload) => api.put('/auth/profile', payload)
};

// User APIs
export const userAPI = {
  getSalespeople: () => api.get('/users/salespeople'),
  createSalesperson: (data) => api.post('/users/salespeople', data),
  updateSalesperson: (id, data) => api.put(`/users/salespeople/${id}`, data),
  deactivateSalesperson: (id) => api.delete(`/users/salespeople/${id}`),
  getPerformance: (id, period) => api.get(`/users/salespeople/${id}/performance?period=${period}`)
};

// Lead APIs
export const leadAPI = {
  uploadLeads: (formData) => api.post('/leads/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAllLeads: (params) => api.get('/leads', { params }),
  getMyLeads: (params) => api.get('/leads/my-leads', { params }),
  getLead: (id) => api.get(`/leads/${id}`),
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  addActivity: (id, data) => api.post(`/leads/${id}/activity`, data),
  getCountries: () => api.get('/leads/countries'),
  getProducts: () => api.get('/leads/products'),
  getStaleLeads: () => api.get('/leads/stale'),
  redistributeLeads: (leadIds) => api.post('/leads/redistribute', { leadIds })
};

// Dashboard APIs
export const dashboardAPI = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getSalespersonDashboard: () => api.get('/dashboard/salesperson'),
  getLeaderboard: (period) => api.get(`/dashboard/leaderboard?period=${period}`)
};

export default api;

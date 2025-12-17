import axios from 'axios';

// Resolve API base URL with sensible dev defaults
const localStorageOverride = (typeof window !== 'undefined') ? localStorage.getItem('API_URL') : null;
const isLocalhost = (typeof window !== 'undefined') && (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
);
const inferredLocal = isLocalhost ? 'http://localhost:5000/api' : null;
const devDefault = import.meta.env?.DEV ? 'http://localhost:5000/api' : null;
const initialUrl = (
  localStorageOverride ||
  import.meta.env.VITE_API_URL ||
  devDefault ||
  inferredLocal ||
  '/api'
);

// Safety Check: If we are on HTTPS (Production/Vercel) and the resolved URL is HTTP Localhost,
// it is almost certainly a misconfiguration. Force fallback to relative '/api' path.
let validUrl = initialUrl;
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && validUrl.includes('localhost')) {
  // eslint-disable-next-line no-console
  console.warn('⚠️ Defaulting API to "/api" because localhost is invalid in HTTPS environment.');
  validUrl = '/api';
}

const API_URL = validUrl;

if (import.meta.env?.DEV) {
  // Helpful debug in dev to ensure we are pointing at the intended API
  // eslint-disable-next-line no-console
  console.debug('[API] baseURL =', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests (skip for auth endpoints)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const url = config?.url || '';
    const isAuthEndpoint = /\/auth\/(login|login-phone|register)/.test(url);
    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isAuthEndpoint && config.headers?.Authorization) {
      delete config.headers.Authorization;
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
    const status = error.response?.status;
    const url = error.config?.url || '';
    const message = error.response?.data?.message || '';
    const isAuthEndpoint = /\/auth\/(login|login-phone|register)/.test(url);

    // Only logout on actual token expiration/invalid token, not on permission errors
    if (status === 401 && !isAuthEndpoint) {
      // Check if it's a token expiration or invalid token (not just unauthorized action)
      const isTokenError = message.includes('token') ||
        message.includes('expired') ||
        message.includes('invalid') ||
        message.includes('Not authorized to access');

      // Only logout if it's actually a token problem
      if (isTokenError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
          // Add a small delay to allow any pending requests to complete
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  loginPhone: (payload) => api.post('/auth/login-phone', payload),
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
  deleteSalesperson: (id) => api.delete(`/users/salespeople/${id}?hard=true`),
  getPerformance: (id, period) => api.get(`/users/salespeople/${id}/performance?period=${period}`)
};

// Lead APIs
export const leadAPI = {
  uploadLeads: (formData) => api.post('/leads/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createLead: async (data) => {
    const envOverride = import.meta.env.VITE_LEADS_CREATE_ENDPOINT;
    const runtimeOverride = (typeof window !== 'undefined') ? localStorage.getItem('LEADS_CREATE_ENDPOINT') : null;
    const endpoints = [
      ...(runtimeOverride ? [runtimeOverride] : []),
      ...(envOverride ? [envOverride] : []),
      '/leads',
      '/leads/create',
      '/lead',
      '/leads/add',
      '/leads/new'
    ];
    let lastError;
    for (const ep of endpoints) {
      try {
        if (import.meta.env.DEV) {
          // Helpful debug in dev to see which endpoint succeeded
          // eslint-disable-next-line no-console
          console.debug('POST', ep);
        }
        const res = await api.post(ep, data);
        return res;
      } catch (err) {
        lastError = err;
        if (err?.response?.status && err.response.status !== 404) {
          // For non-404 errors, don't keep trying alternative endpoints
          break;
        }
      }
    }
    // Improve error surface so UI toasts are helpful
    if (lastError?.response?.status === 404) {
      const tried = endpoints.join(', ');
      const message = (runtimeOverride || envOverride)
        ? `Create endpoint not found. Tried: ${tried}. Please verify server route or update overrides.`
        : 'Create endpoint not found: tried /leads, /leads/create, /lead, /leads/add, /leads/new. Please provide the correct endpoint.';
      const enhanced = new Error(message);
      enhanced.response = lastError.response;
      throw enhanced;
    }
    throw lastError;
  },
  getAllLeads: (params) => api.get('/leads', { params }),
  getMyLeads: (params) => api.get('/leads/my-leads', { params }),
  getLead: (id) => api.get(`/leads/${id}`),
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  addActivity: (id, data) => api.post(`/leads/${id}/activity`, data),
  getCountries: () => api.get('/leads/countries'),
  getProducts: () => api.get('/leads/products'),
  getStaleLeads: () => api.get('/leads/stale'),
  redistributeLeads: (leadIds) => api.post('/leads/redistribute', { leadIds }),
  assignLeads: (leadIds, assignTo) => api.post('/leads/assign', { leadIds, assignTo })
};

// Dashboard APIs
export const dashboardAPI = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getSalespersonDashboard: () => api.get('/dashboard/salesperson'),
  getLeaderboard: (period) => api.get(`/dashboard/leaderboard?period=${period}`),
  getStatusCounts: (period) => api.get(`/dashboard/status-counts?period=${period}`),
  getActivePopup: () => api.get('/dashboard/popup')
};

export default api;

// Popup APIs
export const popupAPI = {
  getForAdmin: () => api.get('/admin/popups'),
  dismiss: (id) => api.post(`/admin/popups/${id}/dismiss`),
  complete: (id) => api.post(`/admin/popups/${id}/complete`),
  // Super admin management
  list: (params) => api.get('/super/popups', { params }),
  create: (data) => api.post('/super/popups', data),
  update: (id, data) => api.put(`/super/popups/${id}`, data),
  setActive: (id, active) => api.patch(`/super/popups/${id}/active`, { active }),
  remove: (id) => api.delete(`/super/popups/${id}`)
};

// Super Admin APIs
export const superAdminAPI = {
  getCompanies: () => api.get('/super-admin/companies'),
  createCompany: (data) => api.post('/super-admin/companies', data),
  updateSubscription: (id, status) => api.put(`/super-admin/companies/${id}/subscription`, { status }),
  getMessages: () => api.get('/super-admin/messages'),
  createMessage: (data) => api.post('/super-admin/messages', data),
  toggleMessage: (id) => api.put(`/super-admin/messages/${id}`),
  deleteMessage: (id) => api.delete(`/super-admin/messages/${id}`),
  updateLimit: (id, maxUsers) => api.put(`/super-admin/companies/${id}/limit`, { maxUsers }),
  updateCompany: (id, data) => api.put(`/super-admin/companies/${id}`, data),
  deleteCompany: (id) => api.delete(`/super-admin/companies/${id}`)
};

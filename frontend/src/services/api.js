import axios from 'axios';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const authService = {
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/login', formData);
  }
};

export const adminService = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  getAuditLogs: () => api.get('/audit')
};

export const subscriberService = {
  search: (query, skip = 0, limit = 20, region_id = '', district_id = '', status = '') => {
    let url = `/dashboard/search?query=${query}&skip=${skip}&limit=${limit}`;
    if (region_id) url += `&region_id=${region_id}`;
    if (district_id) url += `&district_id=${district_id}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
  },
  create: (data) => api.post('/subscribers', data),
  getOne: (accountNumber) => api.get(`/subscribers/${accountNumber}`),
  update: (accountNumber, data) => api.patch(`/subscribers/${accountNumber}`, data),
  getAudit: (accountNumber, skip = 0, limit = 100) => api.get(`/subscribers/${accountNumber}/audit?skip=${skip}&limit=${limit}`),
  updateBalance: (accountNumber, amount) => api.post(`/subscribers/${accountNumber}/balance`, {
    amount: parseFloat(amount)
  }),
};

export const valveTypeService = {
  getAll: () => api.get('/valve-types'),
  create: (data) => api.post('/valve-types', data),
  update: (id, data) => api.put(`/valve-types/${id}`, data), 
  delete: (id) => api.delete(`/valve-types/${id}`)
};

export const deviceService = {
  register: (data) => api.post('/devices', data),
  getStatus: (imei) => api.get(`/devices/${imei}/status`),
  sendCommand: (imei, command) => api.post(`/devices/${imei}/command?command=${command}`),
  resetKey: (imei) => api.post(`/devices/${imei}/reset_key`),
  updateConfig: (imei, config) => api.patch(`/devices/${imei}`, config)
};

export const geoService = {
  getRegions: () => api.get('/regions'),
  getDistricts: (regionId) => api.get(`/regions/${regionId}/districts`)
};

export default api;
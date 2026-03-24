import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

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

export const authService = {
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/login', formData); //
  }
};

export const adminService = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  getAuditLogs: () => api.get('/audit')
};

export const subscriberService = {
  search: (query) => api.get(`/dashboard/search?query=${query}`), //
  get: (accountNumber) => api.get(`/subscribers/${accountNumber}`), //
  create: (data) => api.post('/subscribers', data), //
  updateBalance: (accountNumber, amount) =>
    api.post(`/subscribers/${accountNumber}/balance`, { amount }) //
};

export const deviceService = {
  register: (data) => api.post('/devices', data), //
  getStatus: (imei) => api.get(`/devices/${imei}/status`), //
  sendCommand: (imei, command) =>
    api.post(`/devices/${imei}/command?command=${command}`), //
  resetKey: (imei) => api.post(`/devices/${imei}/reset_key`), //
  updateConfig: (imei, config) => api.patch(`/devices/${imei}`, config) //
};

export default api;
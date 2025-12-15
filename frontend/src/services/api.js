import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (credentials) => api.post('/login', credentials);

export const getPmsDueList = () => api.get('/cro/pms-due-list');
export const createCustomer = (data) => api.post('/cro/customers', data);
export const createAppointment = (data) => api.post('/cro/appointments', data);

export const getServiceOrders = () => api.get('/sa/service-orders');
export const checkInServiceOrder = (id) => api.put(`/sa/service-orders/${id}/check-in`);
export const createServiceOrder = (data) => api.post('/sa/service-orders', data);
export const createVehicleReport = (data) => api.post('/sa/vehicle-reports', data);
export const getBilling = (id) => api.get(`/sa/billing/${id}`);

export const getTechnicianServiceOrders = () => api.get('/technician/service-orders');
export const requestParts = (data) => api.post('/technician/parts-request', data);
export const completeService = (id) => api.put(`/technician/service-orders/${id}/complete`);

export const getForemanServiceOrders = () => api.get('/foreman/service-orders');
export const qualityCheck = (id, data) => api.put(`/foreman/service-orders/${id}/qc`, data);
export const logRoadTest = (id, data) => api.post(`/foreman/service-orders/${id}/road-test`, data);

export const getCashierServiceOrders = () => api.get('/cashier/service-orders');
export const processPayment = (id, data) => api.put(`/cashier/service-orders/${id}/payment`, data);
export const signGatepass = (id) => api.put(`/cashier/service-orders/${id}/gatepass`);

export default api;
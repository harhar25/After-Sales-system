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

// CRO Module APIs
export const getPmsDueList = () => api.get('/cro/pms-due-list');
export const contactCustomer = (data) => api.post('/cro/contact-customer', data);
export const updateContactStatus = (contactLogId, data) => api.put(`/cro/contact-status/${contactLogId}`, data);
export const checkAvailability = (data) => api.post('/cro/check-availability', data);
export const createServiceSchedulingOrder = (data) => api.post('/cro/service-scheduling-order', data);
export const searchCustomer = (searchTerm, searchBy) => api.get('/cro/search-customer', { 
  params: { searchTerm, searchBy } 
});
export const createCustomer = (data) => api.post('/cro/customers', data);
export const createWalkInSchedulingOrder = (data) => api.post('/cro/walk-in-scheduling-order', data);
export const getContactLogs = (customerId) => api.get(`/cro/contact-logs/${customerId}`);

// Legacy CRO APIs (for backward compatibility)
export const createAppointment = (data) => api.post('/cro/appointments', data);

// Service Advisor APIs
export const getServiceOrders = () => api.get('/sa/service-orders');
export const checkInServiceOrder = (id) => api.put(`/sa/service-orders/${id}/check-in`);
export const createServiceOrder = (data) => api.post('/sa/service-orders', data);
export const createVehicleReport = (data) => api.post('/sa/vehicle-reports', data);
export const getBilling = (id) => api.get(`/sa/billing/${id}`);

// 2.1 Customer Check-In APIs
export const getSchedulingOrder = (customerId, appointmentId) => {
  const url = appointmentId 
    ? `/sa/scheduling-orders/${customerId}/${appointmentId}`
    : `/sa/scheduling-orders/${customerId}`;
  return api.get(url);
};

export const customerCheckIn = (id) => api.put(`/sa/scheduling-orders/${id}/customer-check-in`);

// 2.2 Receive CIS / Appointment Slip APIs
export const uploadCISData = (serviceOrderId, cisData) => 
  api.put(`/sa/service-orders/${serviceOrderId}/cis-data`, { cisData });

// 2.3 Vehicle Diagnosis APIs
export const initiateVehicleReportCard = (data) => api.post('/sa/vehicle-report-cards', data);
export const updateVehicleReportCard = (vrcId, data) => api.put(`/sa/vehicle-report-cards/${vrcId}`, data);

// 2.4 Service Order Creation APIs
export const convertSchedulingOrder = (appointmentId, data) => 
  api.put(`/sa/scheduling-orders/${appointmentId}/convert`, data);

export const createWalkInServiceOrder = (data) => api.post('/sa/walk-in-service-orders', data);

export const checkWarrantyStatus = (serviceOrderId, warrantyData) => 
  api.put(`/sa/service-orders/${serviceOrderId}/warranty-check`, { warrantyData });

// 2.5 Document Printing APIs
export const printDocuments = (serviceOrderId, documentTypes, copies = 1) => 
  api.post(`/sa/service-orders/${serviceOrderId}/print-documents`, { 
    documentTypes, 
    copies 
  });

export const getDocumentLogs = (serviceOrderId) => 
  api.get(`/sa/service-orders/${serviceOrderId}/document-logs`);

// Technician APIs
export const getTechnicianServiceOrders = () => api.get('/technician/service-orders');
export const requestParts = (data) => api.post('/technician/parts-request', data);
export const completeService = (id) => api.put(`/technician/service-orders/${id}/complete`);

// Foreman APIs
export const getForemanServiceOrders = () => api.get('/foreman/service-orders');
export const qualityCheck = (id, data) => api.put(`/foreman/service-orders/${id}/qc`, data);
export const logRoadTest = (id, data) => api.post(`/foreman/service-orders/${id}/road-test`, data);

// Cashier APIs
export const getCashierServiceOrders = () => api.get('/cashier/service-orders');
export const processPayment = (id, data) => api.put(`/cashier/service-orders/${id}/payment`, data);
export const signGatepass = (id) => api.put(`/cashier/service-orders/${id}/gatepass`);

// Job Controller APIs
export const getActiveServiceOrders = () => api.get('/job/service-orders/active');
export const getAvailableTechnicians = () => api.get('/job/technicians/available');
export const assignTechnician = (serviceOrderId, data) => api.put(`/job/service-orders/${serviceOrderId}/assign-technician`, data);
export const clockInTechnician = (assignmentId) => api.put(`/job/assignments/${assignmentId}/clock-in`);
export const clockOutTechnician = (assignmentId, data) => api.put(`/job/assignments/${assignmentId}/clock-out`, data);
export const getTechnicianAssignments = (technicianId) => api.get(`/job/technicians/${technicianId}/assignments`);
export const getLaborTracking = (assignmentId) => api.get(`/job/assignments/${assignmentId}/labor-tracking`);
export const completeAssignment = (assignmentId) => api.put(`/job/assignments/${assignmentId}/complete`);

export default api;
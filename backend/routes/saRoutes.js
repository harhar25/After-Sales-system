const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');

const { 
  // Legacy functions (for backward compatibility)
  getServiceOrder, 
  checkInServiceOrder, 
  createServiceOrder, 
  createVehicleReport, 
  getBilling,
  getServiceOrders,
  
  // 2.1 Customer Check-In
  getSchedulingOrder,
  customerCheckIn,
  
  // 2.2 Receive CIS / Appointment Slip
  uploadCISData,
  
  // 2.3 Vehicle Diagnosis
  initiateVehicleReportCard,
  updateVehicleReportCard,
  
  // 2.4 Service Order Creation
  convertSchedulingOrder,
  createWalkInServiceOrder,
  checkWarrantyStatus,
  
  // 2.5 Document Printing
  printDocuments,
  getDocumentLogs
} = require('../controllers/saController');

router.use(authenticate);

// General Service Order routes
router.get('/service-orders', requireRole('SA'), getServiceOrders);
router.get('/service-orders/:id', requireRole('SA'), getServiceOrder);
router.put('/service-orders/:id/check-in', requireRole('SA'), checkInServiceOrder);
router.post('/service-orders', requireRole('SA'), createServiceOrder);
router.post('/vehicle-reports', requireRole('SA'), createVehicleReport);
router.get('/billing/:id', requireRole('SA'), getBilling);

// 2.1 Customer Check-In routes
router.get('/scheduling-orders/:customerId/:appointmentId?', requireRole('SA'), getSchedulingOrder);
router.put('/scheduling-orders/:id/customer-check-in', requireRole('SA'), customerCheckIn);

// 2.2 Receive CIS / Appointment Slip
router.put('/service-orders/:id/cis-data', requireRole('SA'), uploadCISData);

// 2.3 Vehicle Diagnosis routes
router.post('/vehicle-report-cards', requireRole('SA'), initiateVehicleReportCard);
router.put('/vehicle-report-cards/:id', requireRole('SA'), updateVehicleReportCard);

// 2.4 Service Order Creation routes
router.put('/scheduling-orders/:appointmentId/convert', requireRole('SA'), convertSchedulingOrder);
router.post('/walk-in-service-orders', requireRole('SA'), createWalkInServiceOrder);
router.put('/service-orders/:serviceOrderId/warranty-check', requireRole('SA'), checkWarrantyStatus);

// 2.5 Document Printing routes
router.post('/service-orders/:serviceOrderId/print-documents', requireRole('SA'), printDocuments);
router.get('/service-orders/:serviceOrderId/document-logs', requireRole('SA'), getDocumentLogs);

module.exports = router;
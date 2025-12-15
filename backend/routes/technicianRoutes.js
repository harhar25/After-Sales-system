const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { 
  getAssignedServiceOrders, 
  getPicklist, 
  createPartsRequest, 
  requestPartsFromWarehouse,
  completeService,
  signForIssuedParts,
  getQualityCheckRequests
} = require('../controllers/technicianController');

router.use(authenticate);

// Get assigned service orders
router.get('/service-orders', requireRole('Technician'), getAssignedServiceOrders);

// 4.1: Get digital picklist for a service order
router.get('/service-orders/:serviceOrderId/picklist', requireRole('Technician'), getPicklist);

// 4.1: Request parts from warehouse
router.post('/parts-request', requireRole('Technician'), createPartsRequest);
router.post('/parts-request/bulk', requireRole('Technician'), requestPartsFromWarehouse);

// 4.2: Sign for issued parts
router.post('/parts/sign', requireRole('Technician'), signForIssuedParts);

// 4.3: Complete service and request quality check
router.put('/service-orders/:serviceOrderId/complete', requireRole('Technician'), completeService);

// Get quality check requests
router.get('/quality-check-requests', requireRole('Technician'), getQualityCheckRequests);

module.exports = router;
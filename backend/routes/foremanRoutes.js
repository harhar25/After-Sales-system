const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');

// Import all controller methods
const {
  getServiceOrdersForQC,
  getServiceOrderForInspection,
  markQCInspection,
  checkRoadTestAuthorization,
  authorizeRoadTest,
  logRoadTest,
  getRoadTestDetails,
  signServiceOrder,
  technicianCounterSign,
  getQCCompletionStatus,
  qcServiceOrder // Legacy method
} = require('../controllers/foremanController');

router.use(authenticate);

// 5.1 Conduct QC Inspection Routes
// Get service orders ready for QC
router.get('/service-orders', requireRole('Foreman'), getServiceOrdersForQC);

// Get service order details with VRC for inspection
router.get('/service-orders/:id', requireRole('Foreman'), getServiceOrderForInspection);

// Mark QC inspection results (pass/fail status)
router.post('/service-orders/:id/qc-inspection', requireRole('Foreman'), markQCInspection);

// 5.2 Road Test Routes
// Check authorization for road test
router.get('/service-orders/:serviceOrderId/road-test/authorization', requireRole('Foreman'), checkRoadTestAuthorization);

// SA or Manager stamps "For Road Test" in system
router.post('/service-orders/:serviceOrderId/road-test/authorize', requireRole('Foreman'), authorizeRoadTest);

// Log road test with tester name, start/end time, route compliance
router.post('/service-orders/:serviceOrderId/road-test', requireRole('Foreman'), logRoadTest);

// Get road test details
router.get('/service-orders/:serviceOrderId/road-test', requireRole('Foreman'), getRoadTestDetails);

// 5.3 QC Completion Routes
// Foreman digitally signs SO
router.post('/service-orders/:serviceOrderId/sign', requireRole('Foreman'), signServiceOrder);

// Technician counter-signs
router.post('/service-orders/:serviceOrderId/counter-sign', requireRole('Foreman', 'Technician'), technicianCounterSign);

// Get QC completion status
router.get('/service-orders/:serviceOrderId/qc-status', requireRole('Foreman'), getQCCompletionStatus);

// Legacy route for backward compatibility
router.put('/service-orders/:id/qc', requireRole('Foreman'), qcServiceOrder);

module.exports = router;
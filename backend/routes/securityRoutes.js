const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  scanGatepass,
  validateSignature,
  releaseVehicle,
  getGatepassValidationStatus,
  getPendingGatepasses,
  validateGatepass
} = require('../controllers/securityController');

// All routes require authentication
router.use(authenticate);

// Scan gatepass barcode (Security personnel)
router.post('/scan', requireRole(['Security', 'Admin']), scanGatepass);

// Validate individual signatures (based on user role)
router.post('/gatepass/:gatepassId/validate-signature', requireRole(['Cashier', 'Accounting', 'Warranty Officer', 'Service Manager', 'Admin']), validateSignature);

// Release vehicle after all signatures validated (Security personnel)
router.post('/gatepass/:gatepassId/release', requireRole(['Security', 'Admin']), releaseVehicle);

// Get gatepass validation status
router.get('/gatepass/:gatepassId/status', requireRole(['Cashier', 'Accounting', 'Warranty Officer', 'Service Manager', 'Security', 'Admin']), getGatepassValidationStatus);

// Get pending gatepasses for validation (role-specific)
router.get('/pending-gatepasses', requireRole(['Cashier', 'Accounting', 'Warranty Officer', 'Service Manager', 'Security', 'Admin']), getPendingGatepasses);

// Legacy route for backward compatibility
router.put('/gatepass/:id/validate', requireRole('Security'), validateGatepass);

module.exports = router;
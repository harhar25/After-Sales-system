const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getPMSDueList,
  contactCustomer,
  updateContactStatus,
  checkAvailability,
  createServiceSchedulingOrder,
  searchCustomer,
  createCustomer,
  createWalkInSchedulingOrder,
  getContactLogs
} = require('../controllers/croController');

router.use(authenticate);

// Step 1.1: PMS Due List
router.get('/pms-due-list', requireRole('CRO'), getPMSDueList);

// Step 1.2: Contact & Appointment Setting
router.post('/contact-customer', requireRole('CRO'), contactCustomer);
router.put('/contact-status/:contactLogId', requireRole('CRO'), updateContactStatus);
router.post('/check-availability', requireRole('CRO'), checkAvailability);
router.post('/service-scheduling-order', requireRole('CRO'), createServiceSchedulingOrder);

// Step 1.3: Walk-In Customer Registration
router.get('/search-customer', requireRole('CRO'), searchCustomer);
router.post('/customers', requireRole('CRO'), createCustomer);
router.post('/walk-in-scheduling-order', requireRole('CRO'), createWalkInSchedulingOrder);

// Contact logs
router.get('/contact-logs/:customerId', requireRole('CRO'), getContactLogs);

// Legacy routes for backward compatibility
router.post('/appointments', requireRole('CRO'), createServiceSchedulingOrder);

module.exports = router;
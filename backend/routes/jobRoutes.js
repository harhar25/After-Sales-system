const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getActiveServiceOrders, assignTechnician } = require('../controllers/jobController');

router.use(authenticate);

router.get('/service-orders/active', requireRole('JobController'), getActiveServiceOrders);
router.put('/service-orders/:id/assign-technician', requireRole('JobController'), assignTechnician);

module.exports = router;
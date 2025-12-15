const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getServiceOrder, checkInServiceOrder, createServiceOrder, createVehicleReport, getBilling } = require('../controllers/saController');

router.use(authenticate);

router.get('/service-orders/:id', requireRole('SA'), getServiceOrder);
router.put('/service-orders/:id/check-in', requireRole('SA'), checkInServiceOrder);
router.post('/service-orders', requireRole('SA'), createServiceOrder);
router.post('/vehicle-reports', requireRole('SA'), createVehicleReport);
router.get('/billing/:id', requireRole('SA'), getBilling);

module.exports = router;
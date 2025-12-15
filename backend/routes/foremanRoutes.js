const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { qcServiceOrder } = require('../controllers/foremanController');

router.use(authenticate);

router.put('/service-orders/:id/qc', requireRole('Foreman'), qcServiceOrder);

module.exports = router;
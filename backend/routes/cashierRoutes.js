const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { paymentServiceOrder } = require('../controllers/cashierController');

router.use(authenticate);

router.put('/service-orders/:id/payment', requireRole('Cashier'), paymentServiceOrder);

module.exports = router;
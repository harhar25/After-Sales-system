const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getServiceOrdersForPayment,
  getBillingDetails,
  processPayment,
  createAndSignGatepass,
  returnDocumentsToSA,
  getPaymentHistory,
  generateReceipt,
  processRefund,
  paymentServiceOrder // Legacy function for backward compatibility
} = require('../controllers/cashierController');

router.use(authenticate);

// Get service orders ready for payment
router.get('/service-orders', requireRole('Cashier'), getServiceOrdersForPayment);

// Get billing details for a specific service order
router.get('/service-orders/:serviceOrderId/billing', requireRole('Cashier'), getBillingDetails);

// Process payment for service order
router.post('/service-orders/:serviceOrderId/payment', requireRole('Cashier'), processPayment);

// Create and sign gatepass
router.post('/service-orders/:serviceOrderId/gatepass', requireRole('Cashier'), createAndSignGatepass);

// Return documents to Service Advisor
router.put('/service-orders/:serviceOrderId/return-to-sa', requireRole('Cashier'), returnDocumentsToSA);

// Get payment history for service order
router.get('/service-orders/:serviceOrderId/payments', requireRole('Cashier'), getPaymentHistory);

// Generate receipt for payment
router.post('/payments/:paymentId/receipt', requireRole('Cashier'), generateReceipt);

// Process refund for payment
router.post('/payments/:paymentId/refund', requireRole('Cashier'), processRefund);

// Legacy route for backward compatibility
router.put('/service-orders/:id/payment', requireRole('Cashier'), paymentServiceOrder);

module.exports = router;
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getPicklist, createPartsRequest } = require('../controllers/technicianController');

router.use(authenticate);

router.get('/service-orders/:id/picklist', requireRole('Technician'), getPicklist);
router.post('/parts-requests', requireRole('Technician'), createPartsRequest);

module.exports = router;
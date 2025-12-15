const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { validateGatepass } = require('../controllers/securityController');

router.use(authenticate);

router.put('/gatepass/:id/validate', requireRole('Security'), validateGatepass);

module.exports = router;
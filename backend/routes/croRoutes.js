const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getPMSDueList, createCustomer, createAppointment } = require('../controllers/croController');

router.use(authenticate);

router.get('/pms-due-list', requireRole('CRO'), getPMSDueList);
router.post('/customers', requireRole('CRO'), createCustomer);
router.post('/appointments', requireRole('CRO'), createAppointment);

module.exports = router;
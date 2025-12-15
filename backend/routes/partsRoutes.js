const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { issuePartsRequest } = require('../controllers/partsController');

router.use(authenticate);

router.put('/parts-requests/:id/issue', requireRole('PartsWarehouse'), issuePartsRequest);

module.exports = router;
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { 
  preparePartsForIssuance,
  markPartsReadyForRelease,
  issuePartsRequest,
  getPendingPartsRequests,
  getReadyForReleaseIssuances
} = require('../controllers/partsController');

router.use(authenticate);

// 4.2: Parts warehouse operations
// Prepare parts for issuance
router.put('/parts-requests/:partsRequestId/prepare', requireRole('PartsWarehouse'), preparePartsForIssuance);

// Mark parts as ready for release
router.put('/parts-issuance/:partsIssuanceId/ready', requireRole('PartsWarehouse'), markPartsReadyForRelease);

// Issue parts with warehouse signature
router.put('/parts-requests/:partsRequestId/issue', requireRole('PartsWarehouse'), issuePartsRequest);

// Get pending parts requests for warehouse staff
router.get('/parts-requests/pending', requireRole('PartsWarehouse'), getPendingPartsRequests);

// Get issuances ready for technician pickup
router.get('/parts-issuance/ready', requireRole('PartsWarehouse'), getReadyForReleaseIssuances);

module.exports = router;
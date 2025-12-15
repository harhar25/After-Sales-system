const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createFeedback } = require('../controllers/generalController');

router.use(authenticate);

router.post('/feedback', createFeedback);

module.exports = router;
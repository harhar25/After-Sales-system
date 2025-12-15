const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const jockeyController = require('../controllers/jockeyController');

// All routes require authentication
router.use(authenticate);

// Get jockey dashboard data
router.get('/dashboard', jockeyController.getJockeyDashboard);

// Generate "Move to Car Wash" instruction
router.post('/car-wash-instruction', jockeyController.generateCarWashInstruction);

// Task management
router.post('/tasks/:taskId/start', jockeyController.startTask);
router.put('/tasks/:taskId/complete', jockeyController.completeTask);

// Vehicle movement logging
router.put('/vehicle-movements/:transferId/log', jockeyController.logVehicleMovement);

// Key management
router.put('/tasks/:taskId/manage-key', jockeyController.manageKey);

// Task history
router.get('/task-history', jockeyController.getTaskHistory);

module.exports = router;
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { 
  getActiveServiceOrders, 
  getAvailableTechnicians, 
  assignTechnician, 
  clockInTechnician, 
  clockOutTechnician, 
  getTechnicianAssignments, 
  getLaborTracking, 
  completeAssignment,
  returnCompletedServiceOrder,
  getCompletedAssignments 
} = require('../controllers/jobController');

router.use(authenticate);

// Get active service orders
router.get('/service-orders/active', requireRole('JobController'), getActiveServiceOrders);

// Get available technicians
router.get('/technicians/available', requireRole('JobController'), getAvailableTechnicians);

// Assign technician to service order
router.put('/service-orders/:id/assign-technician', requireRole('JobController'), assignTechnician);

// Technician clock-in (technician can clock themselves in)
router.put('/assignments/:assignmentId/clock-in', requireRole(['JobController', 'Technician']), clockInTechnician);

// Technician clock-out
router.put('/assignments/:assignmentId/clock-out', requireRole(['JobController', 'Technician']), clockOutTechnician);

// Get technician assignments
router.get('/technicians/:technicianId/assignments', requireRole('JobController'), getTechnicianAssignments);

// Get labor tracking for assignment
router.get('/assignments/:assignmentId/labor-tracking', requireRole(['JobController', 'Technician']), getLaborTracking);

// Complete assignment
router.put('/assignments/:assignmentId/complete', requireRole('JobController'), completeAssignment);

// Get completed assignments ready for wrap-up
router.get('/assignments/completed', requireRole('JobController'), getCompletedAssignments);

// Return completed service order to Service Advisor
router.put('/service-orders/:serviceOrderId/return-to-sa', requireRole('JobController'), returnCompletedServiceOrder);

module.exports = router;
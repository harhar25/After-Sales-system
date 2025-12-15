const ServiceOrder = require('../models/ServiceOrder');
const Technician = require('../models/Technician');
const TechnicianAssignment = require('../models/TechnicianAssignment');
const LaborTracking = require('../models/LaborTracking');
const User = require('../models/User');

// Get all active service orders
exports.getActiveServiceOrders = async (req, res) => {
  try {
    const sos = await ServiceOrder.find({ 
      status: { $in: ['Scheduled', 'Checked In', 'In Progress'] } 
    }).populate('customerId vehicleId technicianId');
    res.json(sos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available technicians with their skills and availability
exports.getAvailableTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find({ 
      currentStatus: 'Available' 
    }).populate('currentAssignmentId');
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign technician to service order and create labor tracking record
exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId, estimatedHours, notes } = req.body;
    const serviceOrderId = req.params.id;
    
    // Verify service order exists
    const serviceOrder = await ServiceOrder.findById(serviceOrderId);
    if (!serviceOrder) {
      return res.status(404).json({ message: 'Service Order not found' });
    }
    
    // Verify technician exists and is available
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    
    if (technician.currentStatus !== 'Available') {
      return res.status(400).json({ message: 'Technician is not available' });
    }
    
    // Create technician assignment
    const assignment = new TechnicianAssignment({
      serviceOrderId,
      technicianId,
      assignedBy: req.user.id, // Assuming user is authenticated
      estimatedHours,
      notes
    });
    
    const savedAssignment = await assignment.save();
    
    // Create labor tracking record
    const laborTracking = new LaborTracking({
      technicianAssignmentId: savedAssignment._id,
      serviceOrderId,
      technicianId,
      status: 'Not Started'
    });
    
    const savedLaborTracking = await laborTracking.save();
    
    // Update assignment with labor tracking ID
    savedAssignment.laborTrackingId = savedLaborTracking._id;
    await savedAssignment.save();
    
    // Update service order with technician assignment
    serviceOrder.technicianId = technicianId;
    serviceOrder.status = 'In Progress';
    await serviceOrder.save();
    
    // Update technician status
    technician.currentStatus = 'Busy';
    technician.currentAssignmentId = savedAssignment._id;
    await technician.save();
    
    const populatedAssignment = await TechnicianAssignment.findById(savedAssignment._id)
      .populate('technicianId')
      .populate('serviceOrderId')
      .populate('assignedBy');
    
    res.status(201).json({
      assignment: populatedAssignment,
      laborTracking: savedLaborTracking,
      message: 'Technician assigned successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clock in technician (technician clocks themselves in)
exports.clockInTechnician = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const technicianId = req.user.technicianId; // Assuming user has technicianId
    
    const assignment = await TechnicianAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    const laborTracking = await LaborTracking.findById(assignment.laborTrackingId);
    if (!laborTracking) {
      return res.status(404).json({ message: 'Labor tracking record not found' });
    }
    
    // Check if technician is already clocked in
    if (laborTracking.clockInTime && !laborTracking.clockOutTime) {
      return res.status(400).json({ message: 'Technician is already clocked in' });
    }
    
    // Update labor tracking
    laborTracking.clockInTime = new Date();
    laborTracking.status = 'Clocked In';
    await laborTracking.save();
    
    res.json({
      laborTracking,
      message: 'Technician clocked in successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clock out technician
exports.clockOutTechnician = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { workPerformed } = req.body;
    
    const assignment = await TechnicianAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    const laborTracking = await LaborTracking.findById(assignment.laborTrackingId);
    if (!laborTracking) {
      return res.status(404).json({ message: 'Labor tracking record not found' });
    }
    
    // Check if technician is clocked in
    if (!laborTracking.clockInTime || laborTracking.clockOutTime) {
      return res.status(400).json({ message: 'Technician is not currently clocked in' });
    }
    
    // Update labor tracking
    laborTracking.clockOutTime = new Date();
    laborTracking.status = 'Clocked Out';
    if (workPerformed) {
      laborTracking.workPerformed = workPerformed;
    }
    await laborTracking.save();
    
    // Update assignment with actual hours
    assignment.actualHours = laborTracking.totalWorkedHours;
    await assignment.save();
    
    res.json({
      laborTracking,
      assignment,
      message: 'Technician clocked out successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get technician assignments with labor tracking
exports.getTechnicianAssignments = async (req, res) => {
  try {
    const { technicianId } = req.params;
    
    const assignments = await TechnicianAssignment.find({ technicianId })
      .populate('serviceOrderId')
      .populate('laborTrackingId')
      .populate('assignedBy');
    
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get labor tracking for an assignment
exports.getLaborTracking = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await TechnicianAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    const laborTracking = await LaborTracking.findById(assignment.laborTrackingId);
    if (!laborTracking) {
      return res.status(404).json({ message: 'Labor tracking record not found' });
    }
    
    res.json(laborTracking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete assignment
exports.completeAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await TechnicianAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    const laborTracking = await LaborTracking.findById(assignment.laborTrackingId);
    if (!laborTracking) {
      return res.status(404).json({ message: 'Labor tracking record not found' });
    }
    
    // Complete labor tracking
    if (laborTracking.clockInTime && !laborTracking.clockOutTime) {
      laborTracking.clockOutTime = new Date();
      laborTracking.status = 'Completed';
      await laborTracking.save();
      
      // Update assignment
      assignment.actualHours = laborTracking.totalWorkedHours;
    }
    
    assignment.status = 'Completed';
    await assignment.save();
    
    // Update technician status
    const technician = await Technician.findById(assignment.technicianId);
    technician.currentStatus = 'Available';
    technician.currentAssignmentId = null;
    technician.completedJobs += 1;
    await technician.save();
    
    res.json({
      assignment,
      laborTracking,
      message: 'Assignment completed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Return completed service order to Service Advisor
exports.returnCompletedServiceOrder = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    const { completionNotes } = req.body;
    
    // Find the service order
    const serviceOrder = await ServiceOrder.findById(serviceOrderId)
      .populate('customerId vehicleId technicianId');
    
    if (!serviceOrder) {
      return res.status(404).json({ message: 'Service Order not found' });
    }
    
    // Check if service order is assigned and completed
    if (!serviceOrder.technicianId) {
      return res.status(400).json({ message: 'Service Order is not assigned to any technician' });
    }
    
    // Find the completed assignment
    const assignment = await TechnicianAssignment.findOne({
      serviceOrderId,
      technicianId: serviceOrder.technicianId,
      status: 'Completed'
    }).populate('laborTrackingId');
    
    if (!assignment) {
      return res.status(400).json({ message: 'No completed assignment found for this service order' });
    }
    
    // Update service order status to Quality Check (ready for SA review)
    serviceOrder.status = 'Quality Check';
    
    // Log total labor hours from completed assignment
    const totalLaborHours = assignment.actualHours || assignment.laborTrackingId?.totalWorkedHours || 0;
    serviceOrder.laborHours = totalLaborHours;
    
    // Add completion notes if provided
    if (completionNotes) {
      serviceOrder.completionNotes = completionNotes;
    }
    
    await serviceOrder.save();
    
    res.json({
      serviceOrder,
      assignment,
      totalLaborHours,
      message: 'Service Order returned to Service Advisor successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get completed assignments ready for wrap-up
exports.getCompletedAssignments = async (req, res) => {
  try {
    const assignments = await TechnicianAssignment.find({ 
      status: 'Completed' 
    })
      .populate({
        path: 'serviceOrderId',
        populate: ['customerId', 'vehicleId']
      })
      .populate('technicianId')
      .populate('laborTrackingId')
      .populate('assignedBy');
    
    // Filter assignments where service order is not yet returned to SA
    const readyForWrapUp = assignments.filter(assignment => 
      assignment.serviceOrderId && 
      assignment.serviceOrderId.status !== 'Quality Check'
    );
    
    res.json(readyForWrapUp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
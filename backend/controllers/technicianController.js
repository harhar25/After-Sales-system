const ServiceOrder = require('../models/ServiceOrder');
const PartsRequest = require('../models/PartsRequest');
const PartsIssuance = require('../models/PartsIssuance');
const QualityCheckRequest = require('../models/QualityCheckRequest');
const TechnicianAssignment = require('../models/TechnicianAssignment');
const Part = require('../models/Part');

// Get assigned service orders for technician
exports.getAssignedServiceOrders = async (req, res) => {
  try {
    const assignments = await TechnicianAssignment.find({
      technicianId: req.user.id,
      status: 'Active'
    }).populate('serviceOrderId');
    
    const serviceOrders = assignments.map(assignment => assignment.serviceOrderId);
    res.json(serviceOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get digital picklist for a service order
exports.getPicklist = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    
    // Verify technician is assigned to this service order
    const assignment = await TechnicianAssignment.findOne({
      serviceOrderId,
      technicianId: req.user.id,
      status: 'Active'
    });
    
    if (!assignment) {
      return res.status(403).json({ message: 'Not authorized for this service order' });
    }
    
    // Get parts requests for this service order
    const partsRequests = await PartsRequest.find({ serviceOrderId })
      .populate('partId');
    
    res.json(partsRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create parts request
exports.createPartsRequest = async (req, res) => {
  try {
    // Verify technician is assigned to this service order
    const assignment = await TechnicianAssignment.findOne({
      serviceOrderId: req.body.serviceOrderId,
      technicianId: req.user.id,
      status: 'Active'
    });
    
    if (!assignment) {
      return res.status(403).json({ message: 'Not authorized to request parts for this service order' });
    }
    
    // Check if part exists and has sufficient quantity
    const part = await Part.findById(req.body.partId);
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }
    
    if (part.quantity < req.body.quantityRequested) {
      return res.status(400).json({ message: 'Insufficient part quantity available' });
    }
    
    const pr = new PartsRequest(req.body);
    await pr.save();
    res.status(201).json(pr);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4.1: Request parts from warehouse
exports.requestPartsFromWarehouse = async (req, res) => {
  try {
    const { serviceOrderId, parts } = req.body;
    
    // Verify technician is assigned to this service order
    const assignment = await TechnicianAssignment.findOne({
      serviceOrderId,
      technicianId: req.user.id,
      status: 'Active'
    });
    
    if (!assignment) {
      return res.status(403).json({ message: 'Not authorized for this service order' });
    }
    
    // Create parts requests for all requested parts
    const partsRequests = [];
    for (const partData of parts) {
      const pr = new PartsRequest({
        serviceOrderId,
        partId: partData.partId,
        quantityRequested: partData.quantity,
        status: 'Requested'
      });
      await pr.save();
      partsRequests.push(pr);
    }
    
    // Update service order status
    await ServiceOrder.findByIdAndUpdate(serviceOrderId, { 
      status: 'Waiting Parts' 
    });
    
    res.status(201).json({ 
      message: 'Parts requests sent to warehouse',
      requests: partsRequests 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4.3: Complete service and request quality check
exports.completeService = async (req, res) => {
  try {
    const { serviceOrderId, workPerformed, additionalRepairsNeeded, additionalRepairsNotes } = req.body;
    
    // Verify technician is assigned to this service order
    const assignment = await TechnicianAssignment.findOne({
      serviceOrderId,
      technicianId: req.user.id,
      status: 'Active'
    });
    
    if (!assignment) {
      return res.status(403).json({ message: 'Not authorized for this service order' });
    }
    
    // Update service order status
    await ServiceOrder.findByIdAndUpdate(serviceOrderId, {
      status: 'Quality Check'
    });
    
    // Create quality check request
    const qcRequest = new QualityCheckRequest({
      serviceOrderId,
      technicianId: req.user.id,
      requestType: additionalRepairsNeeded ? 'Additional Repair' : 'Service Completion',
      description: workPerformed,
      workPerformed,
      additionalRepairsRequired: additionalRepairsNeeded,
      additionalRepairsNotes,
      status: 'Requested'
    });
    
    await qcRequest.save();
    
    res.json({ 
      message: 'Service completed, quality check requested',
      qualityCheckRequest: qcRequest 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sign for issued parts
exports.signForIssuedParts = async (req, res) => {
  try {
    const { partsIssuanceId, signatureData } = req.body;
    
    const partsIssuance = await PartsIssuance.findById(partsIssuanceId)
      .populate('serviceOrderId');
    
    if (!partsIssuance) {
      return res.status(404).json({ message: 'Parts issuance not found' });
    }
    
    // Verify technician is assigned to this service order
    const assignment = await TechnicianAssignment.findOne({
      serviceOrderId: partsIssuance.serviceOrderId._id,
      technicianId: req.user.id,
      status: 'Active'
    });
    
    if (!assignment) {
      return res.status(403).json({ message: 'Not authorized for this service order' });
    }
    
    if (partsIssuance.status !== 'Ready for Release') {
      return res.status(400).json({ message: 'Parts not ready for release' });
    }
    
    // Add technician signature
    partsIssuance.technicianSignature = {
      signatureData,
      signedAt: new Date(),
      ipAddress: req.ip
    };
    
    partsIssuance.status = 'Issued';
    await partsIssuance.save();
    
    res.json({ 
      message: 'Parts signed and received',
      partsIssuance 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending quality check requests
exports.getQualityCheckRequests = async (req, res) => {
  try {
    const requests = await QualityCheckRequest.find({
      technicianId: req.user.id,
      status: { $in: ['Requested', 'In Progress'] }
    }).populate('serviceOrderId');
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
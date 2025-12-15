const ServiceOrder = require('../models/ServiceOrder');
const QualityCheck = require('../models/QualityCheck');
const QualityCheckRequest = require('../models/QualityCheckRequest');
const VehicleReportCard = require('../models/VehicleReportCard');
const RoadTest = require('../models/RoadTest');
const User = require('../models/User');

// 5.1 Conduct QC Inspection
// Get service orders ready for QC inspection
exports.getServiceOrdersForQC = async (req, res) => {
  try {
    const serviceOrders = await ServiceOrder.find({ 
      status: 'Quality Check' 
    })
    .populate('customerId', 'name email phone')
    .populate('vehicleId', 'make model year plateNumber')
    .populate('technicianId', 'name')
    .populate('vehicleReportCardId')
    .sort({ updatedAt: -1 });
    
    res.json(serviceOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get service order details with VRC for inspection
exports.getServiceOrderForInspection = async (req, res) => {
  try {
    const serviceOrder = await ServiceOrder.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('vehicleId', 'make model year plateNumber')
      .populate('technicianId', 'name')
      .populate('vehicleReportCardId')
      .populate('qualityCheckRequestId');
    
    if (!serviceOrder) {
      return res.status(404).json({ message: 'Service Order not found' });
    }
    
    res.json(serviceOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark QC inspection results (pass/fail status)
exports.markQCInspection = async (req, res) => {
  try {
    const { 
      inspectionType, 
      inspectionItems, 
      overallStatus, 
      issuesFound, 
      recommendations, 
      roadTestRequired 
    } = req.body;
    
    const serviceOrder = await ServiceOrder.findById(req.params.id);
    if (!serviceOrder) {
      return res.status(404).json({ message: 'Service Order not found' });
    }
    
    // Create quality check record
    const qualityCheck = new QualityCheck({
      serviceOrderId: req.params.id,
      vehicleId: serviceOrder.vehicleId,
      customerId: serviceOrder.customerId,
      foremanId: req.user.id,
      inspectionType,
      inspectionItems,
      overallStatus,
      issuesFound,
      recommendations,
      roadTestRequired,
      vehicleReportCardId: serviceOrder.vehicleReportCardId,
      status: roadTestRequired ? 'Pending' : 'Completed',
      inspectionStartedAt: new Date()
    });
    
    await qualityCheck.save();
    
    // If road test is required, update service order status
    if (roadTestRequired) {
      await ServiceOrder.findByIdAndUpdate(req.params.id, {
        status: 'Waiting Road Test'
      });
    }
    
    res.json({ 
      message: 'QC inspection recorded successfully', 
      qualityCheck,
      roadTestRequired 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5.2 Road Test (If Required)
// Check authorization for road test
exports.checkRoadTestAuthorization = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    
    // Check if SA or Manager has authorized road test
    const existingRoadTest = await RoadTest.findOne({ 
      serviceOrderId,
      status: { $ne: 'Cancelled' }
    }).populate('authorizedBy', 'role');
    
    if (existingRoadTest) {
      return res.json({
        authorized: true,
        roadTest: existingRoadTest
      });
    }
    
    res.json({ authorized: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SA or Manager stamps "For Road Test" in system
exports.authorizeRoadTest = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    const { reason } = req.body;
    
    // Check if user is SA or Manager
    if (!['ServiceAdvisor', 'Manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Only Service Advisors or Managers can authorize road tests' 
      });
    }
    
    const serviceOrder = await ServiceOrder.findById(serviceOrderId);
    if (!serviceOrder) {
      return res.status(404).json({ message: 'Service Order not found' });
    }
    
    // Create road test authorization
    const roadTest = new RoadTest({
      serviceOrderId,
      vehicleId: serviceOrder.vehicleId,
      customerId: serviceOrder.customerId,
      authorizedBy: req.user.id,
      authorizedByRole: req.user.role,
      roadTestStamp: {
        stamped: true,
        stampedBy: req.user.id,
        stampedAt: new Date()
      },
      status: 'Scheduled'
    });
    
    await roadTest.save();
    
    res.json({ 
      message: 'Road test authorized successfully', 
      roadTest 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Log road test with tester name, start/end time, route compliance
exports.logRoadTest = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    const { 
      testerName, 
      startTime, 
      endTime, 
      routeCompliance, 
      testResults 
    } = req.body;
    
    const roadTest = await RoadTest.findOne({ serviceOrderId, status: { $ne: 'Cancelled' } });
    if (!roadTest) {
      return res.status(404).json({ message: 'Road test not found or not authorized' });
    }
    
    // Update road test details
    roadTest.testerName = testerName;
    roadTest.testerId = req.user.id;
    roadTest.startTime = new Date(startTime);
    roadTest.endTime = new Date(endTime);
    roadTest.routeCompliance = routeCompliance;
    roadTest.testResults = testResults;
    roadTest.status = 'Completed';
    
    await roadTest.save();
    
    // Update service order status back to QC
    await ServiceOrder.findByIdAndUpdate(serviceOrderId, {
      status: 'Quality Check'
    });
    
    res.json({ 
      message: 'Road test logged successfully', 
      roadTest 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get road test details
exports.getRoadTestDetails = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    
    const roadTest = await RoadTest.findOne({ serviceOrderId, status: { $ne: 'Cancelled' } })
      .populate('serviceOrderId')
      .populate('vehicleId', 'make model year plateNumber')
      .populate('customerId', 'name')
      .populate('authorizedBy', 'name role')
      .populate('testerId', 'name');
    
    if (!roadTest) {
      return res.status(404).json({ message: 'Road test not found' });
    }
    
    res.json(roadTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5.3 QC Completion
// Foreman digitally signs SO
exports.signServiceOrder = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    
    const qualityCheck = await QualityCheck.findOne({ serviceOrderId })
      .sort({ createdAt: -1 });
    
    if (!qualityCheck) {
      return res.status(404).json({ message: 'Quality check record not found' });
    }
    
    // Foreman signs
    qualityCheck.foremanSignature = {
      signed: true,
      signedBy: req.user.id,
      signedAt: new Date()
    };
    
    qualityCheck.status = 'In Progress';
    await qualityCheck.save();
    
    res.json({ 
      message: 'Service Order signed by foreman', 
      qualityCheck 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Technician counter-signs
exports.technicianCounterSign = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    
    const qualityCheck = await QualityCheck.findOne({ serviceOrderId })
      .sort({ createdAt: -1 });
    
    if (!qualityCheck) {
      return res.status(404).json({ message: 'Quality check record not found' });
    }
    
    if (!qualityCheck.foremanSignature.signed) {
      return res.status(400).json({ 
        message: 'Foreman must sign before technician counter-signature' 
      });
    }
    
    // Verify technician is assigned to this service order
    const serviceOrder = await ServiceOrder.findById(serviceOrderId);
    if (serviceOrder.technicianId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Only assigned technician can counter-sign' 
      });
    }
    
    qualityCheck.technicianCounterSignature = {
      signed: true,
      signedBy: req.user.id,
      signedAt: new Date()
    };
    
    qualityCheck.status = 'Approved';
    qualityCheck.qcPassed = qualityCheck.overallStatus === 'Pass';
    qualityCheck.completedAt = new Date();
    qualityCheck.inspectionCompletedAt = new Date();
    
    await qualityCheck.save();
    
    // Update service order status to QC Passed if all requirements met
    if (qualityCheck.qcPassed) {
      await ServiceOrder.findByIdAndUpdate(serviceOrderId, {
        status: 'QC Passed',
        qcCompletedAt: new Date()
      });
    }
    
    res.json({ 
      message: 'Technician counter-signed successfully', 
      qualityCheck 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get QC completion status
exports.getQCCompletionStatus = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    
    const qualityCheck = await QualityCheck.findOne({ serviceOrderId })
      .sort({ createdAt: -1 })
      .populate('foremanId', 'name')
      .populate('technicianCounterSignature.signedBy', 'name')
      .populate('roadTestId');
    
    if (!qualityCheck) {
      return res.status(404).json({ message: 'Quality check record not found' });
    }
    
    res.json(qualityCheck);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy method for backward compatibility
exports.qcServiceOrder = async (req, res) => {
  try {
    const so = await ServiceOrder.findByIdAndUpdate(req.params.id, { status: 'Completed' }, { new: true });
    if (!so) return res.status(404).json({ message: 'Service Order not found' });
    res.json(so);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const ServiceOrder = require('../models/ServiceOrder');
const VehicleReportCard = require('../models/VehicleReportCard');
const DocumentLog = require('../models/DocumentLog');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Appointment = require('../models/Appointment');

// 2.1 Customer Check-In - Retrieve Scheduling Order and mark as arrived
exports.getSchedulingOrder = async (req, res) => {
  try {
    const { customerId, appointmentId } = req.params;
    let appointment;
    
    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId).populate('customerId vehicleId');
    } else {
      // Find latest appointment for customer
      appointment = await Appointment.findOne({ customerId })
        .populate('customerId vehicleId')
        .sort({ createdAt: -1 });
    }
    
    if (!appointment) return res.status(404).json({ message: 'Scheduling Order not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.customerCheckIn = async (req, res) => {
  try {
    const { id } = req.params; // appointment or service order id
    let serviceOrder;
    
    // Check if it's an appointment (scheduled) or service order
    const appointment = await Appointment.findById(id).populate('customerId vehicleId');
    
    if (appointment) {
      // Convert Scheduling Order to Service Order
      serviceOrder = new ServiceOrder({
        customerId: appointment.customerId._id,
        vehicleId: appointment.vehicleId._id,
        schedulingOrderId: appointment._id,
        cisData: {
          slipNumber: appointment.slipNumber,
          appointmentDate: appointment.appointmentDate,
          servicesRequested: appointment.servicesRequested,
          customerNotes: appointment.customerNotes
        },
        customerArrivedTime: new Date(),
        status: 'Checked In'
      });
      await serviceOrder.save();
    } else {
      // Direct service order check-in
      serviceOrder = await ServiceOrder.findByIdAndUpdate(
        id, 
        { 
          customerArrivedTime: new Date(),
          status: 'Checked In'
        }, 
        { new: true }
      ).populate('customerId vehicleId');
    }
    
    if (!serviceOrder) return res.status(404).json({ message: 'Service Order not found' });
    res.json(serviceOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2.2 Receive CIS / Appointment Slip
exports.uploadCISData = async (req, res) => {
  try {
    const { id } = req.params; // service order id
    const { cisData } = req.body;
    
    const serviceOrder = await ServiceOrder.findByIdAndUpdate(
      id,
      { cisData },
      { new: true }
    ).populate('customerId vehicleId');
    
    if (!serviceOrder) return res.status(404).json({ message: 'Service Order not found' });
    
    // Log the CIS data upload
    const documentLog = new DocumentLog({
      serviceOrderId: serviceOrder._id,
      customerId: serviceOrder.customerId._id,
      advisorId: req.user.id,
      documentType: 'CIS',
      status: 'Generated',
      metadata: { uploadTime: new Date(), dataSize: JSON.stringify(cisData).length }
    });
    await documentLog.save();
    
    res.json(serviceOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2.3 Vehicle Diagnosis - Create Vehicle Report Card
exports.initiateVehicleReportCard = async (req, res) => {
  try {
    const { serviceOrderId, vehicleId, customerId } = req.body;
    
    // Create new Vehicle Report Card
    const vehicleReport = new VehicleReportCard({
      serviceOrderId,
      vehicleId,
      customerId,
      advisorId: req.user.id,
      keyReceived: true,
      keyReceivedTime: new Date(),
      status: 'In Progress'
    });
    
    await vehicleReport.save();
    
    // Update Service Order with VRC reference
    await ServiceOrder.findByIdAndUpdate(serviceOrderId, {
      vehicleReportCardId: vehicleReport._id
    });
    
    res.json(vehicleReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateVehicleReportCard = async (req, res) => {
  try {
    const { id } = req.params; // VRC id
    const { checklistItems, internalFindings, externalFindings, customerSettingsConfirmed, settingsRestored } = req.body;
    
    const updateData = {
      checklistItems,
      internalFindings,
      externalFindings,
      customerSettingsConfirmed,
      settingsRestored
    };
    
    // If all checklist items are completed, mark as completed
    if (checklistItems && checklistItems.length > 0) {
      const allCompleted = checklistItems.every(item => item.status);
      if (allCompleted) {
        updateData.status = 'Completed';
        updateData.completedAt = new Date();
      }
    }
    
    const vehicleReport = await VehicleReportCard.findByIdAndUpdate(id, updateData, { new: true });
    if (!vehicleReport) return res.status(404).json({ message: 'Vehicle Report Card not found' });
    
    res.json(vehicleReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2.4 Service Order Creation and Management
exports.convertSchedulingOrder = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId).populate('customerId vehicleId');
    if (!appointment) return res.status(404).json({ message: 'Scheduling Order not found' });
    
    // Convert to Service Order if not already converted
    let serviceOrder = await ServiceOrder.findOne({ schedulingOrderId: appointmentId });
    
    if (!serviceOrder) {
      serviceOrder = new ServiceOrder({
        customerId: appointment.customerId._id,
        vehicleId: appointment.vehicleId._id,
        schedulingOrderId: appointment._id,
        cisData: {
          slipNumber: appointment.slipNumber,
          appointmentDate: appointment.appointmentDate,
          servicesRequested: appointment.servicesRequested,
          customerNotes: appointment.customerNotes
        },
        status: 'Checked In',
        customerArrivedTime: new Date()
      });
      await serviceOrder.save();
    }
    
    // Check warranty flag
    if (req.body.isWarranty) {
      serviceOrder.isWarranty = true;
      serviceOrder.warrantyType = req.body.warrantyType;
      await serviceOrder.save();
      // Route to Warranty Module (would integrate with warranty system)
    }
    
    // Check parts availability if needed
    if (req.body.partsNeeded && req.body.partsNeeded.length > 0) {
      serviceOrder.partsNeeded = req.body.partsNeeded;
      await serviceOrder.save();
      // This would trigger parts availability check
    }
    
    res.json(serviceOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWalkInServiceOrder = async (req, res) => {
  try {
    const { customerId, vehicleId, servicesRequested, customerNotes } = req.body;
    
    const serviceOrder = new ServiceOrder({
      customerId,
      vehicleId,
      isWalkIn: true,
      cisData: {
        servicesRequested,
        customerNotes
      },
      status: 'Checked In',
      customerArrivedTime: new Date()
    });
    
    await serviceOrder.save();
    
    // Populate customer and vehicle data for response
    await serviceOrder.populate('customerId vehicleId');
    
    res.status(201).json(serviceOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.checkWarrantyStatus = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    const { warrantyData } = req.body;
    
    const serviceOrder = await ServiceOrder.findById(serviceOrderId);
    if (!serviceOrder) return res.status(404).json({ message: 'Service Order not found' });
    
    // Update warranty information
    serviceOrder.isWarranty = warrantyData.isValid;
    serviceOrder.warrantyType = warrantyData.type;
    await serviceOrder.save();
    
    // If warranty is valid, route to warranty module
    if (warrantyData.isValid) {
      // Integration with warranty module would happen here
      res.json({ 
        message: 'Service Order routed to Warranty Module',
        serviceOrder,
        warrantyInfo: warrantyData
      });
    } else {
      res.json({ 
        message: 'Warranty not valid, proceeding with regular service',
        serviceOrder 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2.5 Document Printing
exports.printDocuments = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    const { documentTypes } = req.body; // Array of document types to print
    
    const serviceOrder = await ServiceOrder.findById(serviceOrderId).populate('customerId vehicleId vehicleReportCardId');
    if (!serviceOrder) return res.status(404).json({ message: 'Service Order not found' });
    
    const printResults = [];
    
    for (const docType of documentTypes) {
      // Create document log entry
      const documentLog = new DocumentLog({
        serviceOrderId: serviceOrder._id,
        customerId: serviceOrder.customerId._id,
        advisorId: req.user.id,
        documentType: docType,
        status: 'Printed',
        printedAt: new Date(),
        printedBy: req.user.id,
        copies: req.body.copies || 1
      });
      
      await documentLog.save();
      
      // Add to service order's document logs
      serviceOrder.documentLogs.push(documentLog._id);
      
      printResults.push({
        documentType: docType,
        documentLogId: documentLog._id,
        printedAt: documentLog.printedAt,
        copies: documentLog.copies
      });
    }
    
    await serviceOrder.save();
    
    res.json({
      message: 'Documents printed successfully',
      serviceOrderId: serviceOrder._id,
      printedDocuments: printResults
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocumentLogs = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    
    const documentLogs = await DocumentLog.find({ serviceOrderId })
      .populate('advisorId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(documentLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all service orders for Service Advisor dashboard
exports.getServiceOrders = async (req, res) => {
  try {
    const serviceOrders = await ServiceOrder.find()
      .populate('customerId vehicleId technicianId vehicleReportCardId')
      .sort({ createdAt: -1 });
    
    res.json(serviceOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy functions (keeping for compatibility)
exports.getServiceOrder = async (req, res) => {
  try {
    const so = await ServiceOrder.findById(req.params.id).populate('customerId vehicleId technicianId parts vehicleReportCardId');
    if (!so) return res.status(404).json({ message: 'Service Order not found' });
    res.json(so);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkInServiceOrder = async (req, res) => {
  try {
    const so = await ServiceOrder.findByIdAndUpdate(req.params.id, { status: 'Checked In' }, { new: true });
    if (!so) return res.status(404).json({ message: 'Service Order not found' });
    res.json(so);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createServiceOrder = async (req, res) => {
  try {
    const so = new ServiceOrder(req.body);
    await so.save();
    res.status(201).json(so);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createVehicleReport = async (req, res) => {
  try {
    const so = new ServiceOrder(req.body);
    await so.save();
    res.status(201).json(so);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getBilling = async (req, res) => {
  try {
    const so = await ServiceOrder.findById(req.params.id).populate('parts');
    if (!so) return res.status(404).json({ message: 'Service Order not found' });
    
    // Calculate total cost if not set
    let total = so.totalCost;
    if (!total) {
      total = so.parts.reduce((sum, part) => sum + (part.price * 1), 0) + (so.laborHours * 50);
      so.totalCost = total;
      await so.save();
    }
    res.json({ serviceOrder: so, totalCost: total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
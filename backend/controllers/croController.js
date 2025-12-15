const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Appointment = require('../models/Appointment');
const ContactLog = require('../models/ContactLog');
const Bay = require('../models/Bay');
const ServiceOrder = require('../models/ServiceOrder');
const User = require('../models/User');

// Step 1.1: System Generates PMS Due List
exports.getPMSDueList = async (req, res) => {
  try {
    const currentDate = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(currentDate.getMonth() + 3);

    // Find vehicles due for PMS service
    const vehiclesDueForPMS = await Vehicle.find({
      $or: [
        { nextServiceDueDate: { $lte: threeMonthsFromNow } },
        { lastServiceDate: { $exists: false } },
        { nextServiceDueDate: { $exists: false } }
      ]
    }).populate('customerId').lean();

    // Generate PMS Due Report
    const pmsReport = vehiclesDueForPMS.map(vehicle => {
      const daysUntilDue = vehicle.nextServiceDueDate 
        ? Math.ceil((new Date(vehicle.nextServiceDueDate) - currentDate) / (1000 * 60 * 60 * 24))
        : null;

      return {
        vehicleId: vehicle._id,
        customerId: vehicle.customerId._id,
        customerName: vehicle.customerId.name,
        contactInfo: vehicle.customerId.contactInfo,
        address: vehicle.customerId.address,
        plateNo: vehicle.plateNo,
        makeModel: vehicle.makeModel,
        lastServiceDate: vehicle.lastServiceDate,
        nextServiceDueDate: vehicle.nextServiceDueDate,
        daysUntilDue: daysUntilDue,
        priority: daysUntilDue ? (daysUntilDue <= 30 ? 'High' : 'Medium') : 'Unknown',
        currentMileage: vehicle.currentMileage,
        serviceInterval: vehicle.serviceInterval
      };
    });

    res.json({
      success: true,
      totalRecords: pmsReport.length,
      report: pmsReport
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Step 1.2: Contact & Appointment Setting
exports.contactCustomer = async (req, res) => {
  try {
    const { customerId, vehicleId, contactType, notes } = req.body;

    // Create contact log
    const contactLog = new ContactLog({
      customerId,
      vehicleId,
      contactType,
      notes,
      status: 'attempted'
    });

    await contactLog.save();

    res.json({
      success: true,
      contactLog,
      message: 'Contact attempt logged successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.updateContactStatus = async (req, res) => {
  try {
    const { contactLogId } = req.params;
    const { status, responseDateTime, scheduledAppointmentId } = req.body;

    const updatedContactLog = await ContactLog.findByIdAndUpdate(
      contactLogId,
      { 
        status,
        responseDateTime,
        scheduledAppointmentId
      },
      { new: true }
    );

    res.json({
      success: true,
      contactLog: updatedContactLog,
      message: 'Contact status updated successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Check availability for scheduling
exports.checkAvailability = async (req, res) => {
  try {
    const { preferredDateTime, duration = 2 } = req.body; // default 2 hours

    // Check bay availability
    const availableBays = await Bay.find({
      currentStatus: 'available',
      'availabilitySchedule': {
        $elemMatch: {
          dayOfWeek: new Date(preferredDateTime).getDay()
        }
      }
    });

    // Check technician availability
    const availableTechnicians = await User.find({
      role: 'Technician',
      permissions: { $in: ['available'] }
    });

    // Check SA availability
    const availableSAs = await User.find({
      role: 'SA',
      permissions: { $in: ['available'] }
    });

    res.json({
      success: true,
      availableBays: availableBays.length,
      availableTechnicians: availableTechnicians.length,
      availableSAs: availableSAs.length,
      details: {
        bays: availableBays,
        technicians: availableTechnicians,
        serviceAdvisors: availableSAs
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Generate Service Scheduling Order
exports.createServiceSchedulingOrder = async (req, res) => {
  try {
    const { 
      customerId, 
      vehicleId, 
      scheduledDateTime, 
      bayId, 
      saId, 
      contactLogId,
      serviceType = 'PMS' 
    } = req.body;

    // Create appointment
    const appointment = new Appointment({
      customerId,
      vehicleId,
      scheduledDateTime,
      bayId,
      saId,
      status: 'Scheduled'
    });

    await appointment.save();

    // Update contact log with appointment reference
    if (contactLogId) {
      await ContactLog.findByIdAndUpdate(contactLogId, {
        status: 'successful',
        responseDateTime: new Date(),
        scheduledAppointmentId: appointment._id
      });
    }

    // Create service order
    const serviceOrder = new ServiceOrder({
      customerId,
      vehicleId,
      status: 'Scheduled',
      laborHours: 0,
      totalCost: 0
    });

    await serviceOrder.save();

    // Update vehicle's last service date if this is first service
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle.lastServiceDate) {
      await Vehicle.findByIdAndUpdate(vehicleId, {
        lastServiceDate: scheduledDateTime,
        nextServiceDueDate: new Date(scheduledDateTime.getTime() + (6 * 30 * 24 * 60 * 60 * 1000)) // 6 months
      });
    }

    res.status(201).json({
      success: true,
      appointment,
      serviceOrder,
      message: 'Service Scheduling Order created successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Step 1.3: Walk-In Customer Registration
exports.searchCustomer = async (req, res) => {
  try {
    const { searchTerm, searchBy } = req.query;

    let query = {};
    
    if (searchBy === 'plateNo') {
      const vehicle = await Vehicle.findOne({ plateNo: new RegExp(searchTerm, 'i') })
        .populate('customerId');
      if (vehicle) {
        query = { _id: vehicle.customerId._id };
      }
    } else {
      const regex = new RegExp(searchTerm, 'i');
      query = searchBy === 'name' ? { name: regex } : { contactInfo: regex };
    }

    const customer = await Customer.findOne(query);

    res.json({
      success: true,
      customer: customer || null,
      message: customer ? 'Customer found' : 'Customer not found'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json({
      success: true,
      customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.createWalkInSchedulingOrder = async (req, res) => {
  try {
    const { 
      customerId, 
      vehicleData, 
      preferredDateTime,
      serviceType = 'Walk-in Service' 
    } = req.body;

    // Create vehicle if not exists
    let vehicle;
    if (vehicleData.plateNo) {
      vehicle = await Vehicle.findOne({ plateNo: vehicleData.plateNo });
      if (!vehicle) {
        vehicle = new Vehicle({
          ...vehicleData,
          customerId
        });
        await vehicle.save();
      }
    }

    // Find available bay
    const availableBay = await Bay.findOne({ 
      currentStatus: 'available' 
    }).sort({ createdAt: 1 }); // First available bay

    // Find available SA
    const availableSA = await User.findOne({ 
      role: 'SA' 
    }).sort({ createdAt: 1 });

    if (!availableBay || !availableSA) {
      return res.status(400).json({
        success: false,
        message: 'No available bay or service advisor at this time'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      customerId,
      vehicleId: vehicle._id,
      scheduledDateTime: preferredDateTime || new Date(),
      bayId: availableBay._id,
      saId: availableSA._id,
      status: 'Scheduled'
    });

    await appointment.save();

    // Create service order
    const serviceOrder = new ServiceOrder({
      customerId,
      vehicleId: vehicle._id,
      status: 'Scheduled',
      laborHours: 0,
      totalCost: 0
    });

    await serviceOrder.save();

    res.status(201).json({
      success: true,
      appointment,
      serviceOrder,
      message: 'Walk-in Scheduling Order created successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get contact logs for a customer
exports.getContactLogs = async (req, res) => {
  try {
    const { customerId } = req.params;

    const contactLogs = await ContactLog.find({ customerId })
      .populate('vehicleId', 'plateNo makeModel')
      .populate('scheduledAppointmentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      contactLogs
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
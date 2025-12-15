const CarJockeyTask = require('../models/CarJockeyTask');
const VehicleTransfer = require('../models/VehicleTransfer');
const ServiceOrder = require('../models/ServiceOrder');
const Vehicle = require('../models/Vehicle');
const Bay = require('../models/Bay');

// Get jockey dashboard data
exports.getJockeyDashboard = async (req, res) => {
  try {
    const jockeyId = req.user.id;
    
    // Get active tasks for this jockey
    const activeTasks = await CarJockeyTask.find({ 
      jockeyId,
      status: { $in: ['Pending', 'In Progress'] }
    })
    .populate('serviceOrderId')
    .populate('vehicleId')
    .sort({ assignedTime: 1 });

    // Get recent completed tasks
    const completedTasks = await CarJockeyTask.find({ 
      jockeyId,
      status: 'Completed'
    })
    .populate('serviceOrderId')
    .populate('vehicleId')
    .sort({ completedTime: -1 })
    .limit(10);

    // Get available "Move to Car Wash" instructions
    const carWashInstructions = await CarJockeyTask.find({
      taskType: 'Move to Car Wash',
      status: 'Pending',
      isCarWashInstruction: true
    })
    .populate('serviceOrderId')
    .populate('vehicleId')
    .sort({ priority: -1, assignedTime: 1 });

    res.json({
      success: true,
      data: {
        activeTasks,
        completedTasks,
        carWashInstructions,
        summary: {
          pendingTasks: activeTasks.filter(t => t.status === 'Pending').length,
          inProgressTasks: activeTasks.filter(t => t.status === 'In Progress').length,
          availableCarWashInstructions: carWashInstructions.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate "Move to Car Wash" instruction
exports.generateCarWashInstruction = async (req, res) => {
  try {
    const { serviceOrderId, washType = 'Standard', specialNotes, estimatedDuration = 30 } = req.body;

    // Validate service order exists and is ready for car wash
    const serviceOrder = await ServiceOrder.findById(serviceOrderId);
    if (!serviceOrder) {
      return res.status(404).json({
        success: false,
        message: 'Service Order not found'
      });
    }

    // Find available jockey
    const jockey = req.user; // Current user is the jockey
    
    // Create car wash instruction task
    const carWashInstruction = new CarJockeyTask({
      serviceOrderId,
      vehicleId: serviceOrder.vehicleId,
      jockeyId: jockey.id,
      sequence: 1,
      taskType: 'Move to Car Wash',
      currentLocation: 'Bay', // Default starting location
      targetLocation: 'Car Wash',
      isCarWashInstruction: true,
      carWashInstructions: {
        washType,
        specialNotes,
        estimatedDuration
      },
      priority: 'High'
    });

    await carWashInstruction.save();

    // Also create the vehicle transfer record
    const vehicleTransfer = new VehicleTransfer({
      serviceOrderId,
      vehicleId: serviceOrder.vehicleId,
      jockeyId: jockey.id,
      transferType: 'Move to Car Wash',
      fromLocation: 'Bay',
      toLocation: 'Car Wash',
      status: 'Pending',
      priority: 'High'
    });

    await vehicleTransfer.save();

    res.status(201).json({
      success: true,
      carWashInstruction,
      vehicleTransfer,
      message: 'Move to Car Wash instruction generated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Start a jockey task
exports.startTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const jockeyId = req.user.id;

    const task = await CarJockeyTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.jockeyId.toString() !== jockeyId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to start this task'
      });
    }

    if (task.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Task is not in pending status'
      });
    }

    task.status = 'In Progress';
    task.startedTime = new Date();
    await task.save();

    res.json({
      success: true,
      task,
      message: 'Task started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Complete a jockey task
exports.completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { completionNotes, keyReturned, currentLocation } = req.body;
    const jockeyId = req.user.id;

    const task = await CarJockeyTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.jockeyId.toString() !== jockeyId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this task'
      });
    }

    if (task.status !== 'In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Task is not in progress'
      });
    }

    // Update task
    task.status = 'Completed';
    task.completedTime = new Date();
    task.completionNotes = completionNotes;
    if (currentLocation) {
      task.currentLocation = currentLocation;
    }

    // Handle key management for "Return Key" task
    if (task.taskType === 'Return Key' && keyReturned) {
      task.keyStatus = 'Returned';
      task.keyReturnedTime = new Date();
    }

    await task.save();

    // Update corresponding vehicle transfer if exists
    const vehicleTransfer = await VehicleTransfer.findOne({
      serviceOrderId: task.serviceOrderId,
      jockeyId: jockeyId,
      status: { $in: ['Pending', 'In Progress'] }
    });

    if (vehicleTransfer) {
      vehicleTransfer.status = 'Completed';
      vehicleTransfer.completedTime = new Date();
      
      if (keyReturned) {
        vehicleTransfer.keyReturned = true;
        vehicleTransfer.keyReturnedTime = new Date();
      }
      
      await vehicleTransfer.save();
    }

    // If this was a "Move to Car Wash" task, create next task in sequence
    if (task.taskType === 'Move to Car Wash' && task.isCarWashInstruction) {
      const nextTask = new CarJockeyTask({
        serviceOrderId: task.serviceOrderId,
        vehicleId: task.vehicleId,
        jockeyId: jockeyId,
        sequence: 2,
        taskType: 'Move to Releasing Area',
        currentLocation: 'Car Wash',
        targetLocation: 'Releasing Area',
        keyStatus: 'With Jockey',
        priority: 'Medium'
      });

      await nextTask.save();
    }

    res.json({
      success: true,
      task,
      message: 'Task completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Log vehicle movement
exports.logVehicleMovement = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { fromLocation, toLocation, notes } = req.body;
    const jockeyId = req.user.id;

    const transfer = await VehicleTransfer.findById(transferId);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle transfer not found'
      });
    }

    if (transfer.jockeyId.toString() !== jockeyId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this transfer'
      });
    }

    // Update transfer details
    transfer.fromLocation = fromLocation || transfer.fromLocation;
    transfer.toLocation = toLocation || transfer.toLocation;
    transfer.status = 'In Progress';
    transfer.startedTime = transfer.startedTime || new Date();
    
    if (notes) {
      transfer.notes = notes;
    }

    await transfer.save();

    res.json({
      success: true,
      transfer,
      message: 'Vehicle movement logged successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Handle key receipt and return
exports.manageKey = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { action, keyStatus } = req.body; // action: 'receive' or 'return'
    const jockeyId = req.user.id;

    const task = await CarJockeyTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.jockeyId.toString() !== jockeyId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage keys for this task'
      });
    }

    if (action === 'receive') {
      task.keyStatus = 'With Jockey';
      task.keyReceivedTime = new Date();
    } else if (action === 'return') {
      task.keyStatus = 'Returned';
      task.keyReturnedTime = new Date();
    }

    if (keyStatus) {
      task.keyStatus = keyStatus;
    }

    await task.save();

    res.json({
      success: true,
      task,
      message: `Key ${action}ed successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get task history for jockey
exports.getTaskHistory = async (req, res) => {
  try {
    const jockeyId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const tasks = await CarJockeyTask.find({ jockeyId })
      .populate('serviceOrderId')
      .populate('vehicleId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CarJockeyTask.countDocuments({ jockeyId });

    res.json({
      success: true,
      tasks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
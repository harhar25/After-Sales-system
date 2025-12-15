const mongoose = require('mongoose');

const carJockeyTaskSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  jockeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Task sequence for car wash movement
  sequence: { type: Number, required: true },
  
  // Task details
  taskType: { 
    type: String, 
    enum: ['Receive Vehicle', 'Move to Car Wash', 'Move to Releasing Area', 'Return Key', 'Park Vehicle'], 
    required: true 
  },
  
  // Current status
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed'], 
    default: 'Pending' 
  },
  
  // Location tracking
  currentLocation: { type: String, required: true },
  targetLocation: { type: String },
  
  // Timing
  assignedTime: { type: Date, default: Date.now },
  startedTime: { type: Date },
  completedTime: { type: Date },
  
  // Special handling for "Move to Car Wash" instruction
  isCarWashInstruction: { type: Boolean, default: false },
  carWashInstructions: { 
    washType: { type: String, enum: ['Standard', 'Premium', 'Deluxe'] },
    specialNotes: { type: String },
    estimatedDuration: { type: Number, default: 30 } // minutes
  },
  
  // Key management
  keyStatus: { 
    type: String, 
    enum: ['Not Received', 'With Jockey', 'With Vehicle', 'Returned'], 
    default: 'Not Received' 
  },
  keyReceivedTime: { type: Date },
  keyReturnedTime: { type: Date },
  
  // Additional details
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  notes: { type: String },
  completionNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CarJockeyTask', carJockeyTaskSchema);
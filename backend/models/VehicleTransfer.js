const mongoose = require('mongoose');

const vehicleTransferSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  jockeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Transfer details
  transferType: { 
    type: String, 
    enum: ['Move to Car Wash', 'Move to Bay', 'Move to Releasing Area', 'Move to Parking'], 
    required: true 
  },
  fromLocation: { type: String, required: true },
  toLocation: { type: String, required: true },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  
  // Timing
  assignedTime: { type: Date, default: Date.now },
  startedTime: { type: Date },
  completedTime: { type: Date },
  
  // Key management
  keyReceived: { type: Boolean, default: false },
  keyReceivedTime: { type: Date },
  keyReturned: { type: Boolean, default: false },
  keyReturnedTime: { type: Date },
  
  // Additional details
  notes: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { timestamps: true });

module.exports = mongoose.model('VehicleTransfer', vehicleTransferSchema);
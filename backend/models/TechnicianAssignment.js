const mongoose = require('mongoose');

const technicianAssignmentSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Assigned', 'In Progress', 'Completed', 'Cancelled'], default: 'Assigned' },
  
  // Labor tracking
  laborTrackingId: { type: mongoose.Schema.Types.ObjectId, ref: 'LaborTracking' },
  
  // Assignment details
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TechnicianAssignment', technicianAssignmentSchema);
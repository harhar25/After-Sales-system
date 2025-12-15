const mongoose = require('mongoose');

const laborTrackingSchema = new mongoose.Schema({
  technicianAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TechnicianAssignment', required: true },
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  
  // Clock-in/Clock-out tracking
  clockInTime: { type: Date },
  clockOutTime: { type: Date },
  totalWorkedHours: { type: Number, default: 0 },
  
  // Status tracking
  status: { type: String, enum: ['Not Started', 'Clocked In', 'On Break', 'Clocked Out', 'Completed'], default: 'Not Started' },
  
  // Work details
  workPerformed: [{ type: String }],
  breakDuration: { type: Number, default: 0 }, // in minutes
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Calculate total worked hours before saving
laborTrackingSchema.pre('save', function(next) {
  if (this.clockInTime && this.clockOutTime) {
    const diffInMs = this.clockOutTime - this.clockInTime;
    this.totalWorkedHours = Math.round((diffInMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  next();
});

module.exports = mongoose.model('LaborTracking', laborTrackingSchema);
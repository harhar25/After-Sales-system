const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  name: { type: String, required: true },
  skills: [{ type: String }],
  availabilitySchedule: { type: String, required: true },
  
  // Real-time availability status
  currentStatus: { type: String, enum: ['Available', 'Busy', 'On Break', 'Off Duty'], default: 'Available' },
  currentAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TechnicianAssignment' },
  
  // Performance metrics
  completedJobs: { type: Number, default: 0 },
  averageJobTime: { type: Number, default: 0 },
  rating: { type: Number, min: 1, max: 5, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Technician', technicianSchema);
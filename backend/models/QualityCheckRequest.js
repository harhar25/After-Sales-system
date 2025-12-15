const mongoose = require('mongoose');

const qualityCheckRequestSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  foremanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestType: { 
    type: String, 
    enum: ['Service Completion', 'Additional Repair', 'Final Inspection'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Requested', 'In Progress', 'Completed', 'Rejected'], 
    default: 'Requested' 
  },
  description: { type: String, required: true },
  workPerformed: { type: String },
  issuesFound: { type: String },
  additionalRepairsRequired: { type: Boolean, default: false },
  additionalRepairsNotes: { type: String },
  foremanNotes: { type: String },
  qcPassed: { type: Boolean, default: false },
  requestedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('QualityCheckRequest', qualityCheckRequestSchema);
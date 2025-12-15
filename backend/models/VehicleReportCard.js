const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  status: { type: String, enum: ['Good', 'Needs Attention', 'Replace'], required: true },
  notes: { type: String }
});

const vehicleReportCardSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  keyReceived: { type: Boolean, default: false },
  keyReceivedTime: { type: Date },
  
  // 10-point checklist
  checklistItems: [checklistItemSchema],
  
  // Internal findings
  internalFindings: {
    engine: { type: String },
    transmission: { type: String },
    brakes: { type: String },
    suspension: { type: String },
    electrical: { type: String },
    other: { type: String }
  },
  
  // External findings
  externalFindings: {
    body: { type: String },
    paint: { type: String },
    tires: { type: String },
    lights: { type: String },
    glass: { type: String },
    other: { type: String }
  },
  
  // Customer settings confirmation
  customerSettingsConfirmed: { type: Boolean, default: false },
  settingsRestored: {
    radio: { type: Boolean, default: true },
    aircon: { type: Boolean, default: true },
    seats: { type: Boolean, default: true },
    mirrors: { type: Boolean, default: true },
    other: { type: String }
  },
  
  // Status tracking
  status: { type: String, enum: ['In Progress', 'Completed', 'Approved'], default: 'In Progress' },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('VehicleReportCard', vehicleReportCardSchema);
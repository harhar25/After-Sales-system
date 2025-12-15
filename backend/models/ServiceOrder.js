const mongoose = require('mongoose');

const serviceOrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  status: { type: String, enum: ['Scheduled', 'Checked In', 'In Progress', 'Waiting Parts', 'Quality Check', 'Completed', 'Paid'], default: 'Scheduled' },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  parts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Part' }],
  laborHours: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  validated: { type: Boolean, default: false },
  
  // Customer arrival and check-in tracking
  customerArrivedTime: { type: Date },
  isWalkIn: { type: Boolean, default: false },
  
  // Scheduling Order conversion
  schedulingOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  // CIS/Appointment slip data
  cisData: {
    slipNumber: { type: String },
    appointmentDate: { type: Date },
    servicesRequested: [{ type: String }],
    customerNotes: { type: String }
  },
  
  // Warranty and parts management
  isWarranty: { type: Boolean, default: false },
  warrantyType: { type: String },
  partsNeeded: [{ type: String }],
  partsAvailable: { type: Boolean, default: false },
  
  // Vehicle Report Card relationship
  vehicleReportCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleReportCard' },
  
  // Document printing tracking
  documentLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DocumentLog' }]
}, { timestamps: true });

module.exports = mongoose.model('ServiceOrder', serviceOrderSchema);
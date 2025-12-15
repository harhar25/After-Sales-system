const mongoose = require('mongoose');

const serviceOrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Paid'], default: 'Scheduled' },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  parts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Part' }],
  laborHours: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  validated: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ServiceOrder', serviceOrderSchema);
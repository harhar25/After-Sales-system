const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  scheduledDateTime: { type: Date, required: true },
  bayId: { type: String, required: true },
  saId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'Scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
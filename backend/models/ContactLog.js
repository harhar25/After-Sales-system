const mongoose = require('mongoose');

const contactLogSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  contactType: { type: String, enum: ['call', 'sms', 'email'], required: true },
  attemptedDateTime: { type: Date, default: Date.now },
  status: { type: String, enum: ['attempted', 'successful', 'failed', 'rescheduled'], default: 'attempted' },
  notes: { type: String },
  responseDateTime: { type: Date },
  scheduledAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }
}, { timestamps: true });

module.exports = mongoose.model('ContactLog', contactLogSchema);
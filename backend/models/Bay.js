const mongoose = require('mongoose');

const baySchema = new mongoose.Schema({
  bayNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, default: 1 },
  currentStatus: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
  specialtyType: { type: String }, // e.g., 'general', 'electrical', 'bodywork'
  availabilitySchedule: [{
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday, 6 = Saturday
    startTime: { type: String }, // e.g., '08:00'
    endTime: { type: String }    // e.g., '17:00'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Bay', baySchema);
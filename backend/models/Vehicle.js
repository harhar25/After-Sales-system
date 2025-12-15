const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  plateNo: { type: String, required: true },
  makeModel: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  serviceHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder' }],
  lastServiceDate: { type: Date },
  nextServiceDueDate: { type: Date },
  serviceInterval: { type: Number, default: 5000 }, // kilometers
  currentMileage: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
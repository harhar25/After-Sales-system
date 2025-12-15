const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  satisfactionLevel: { type: Number, min: 1, max: 5, required: true },
  concerns: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
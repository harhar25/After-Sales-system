const mongoose = require('mongoose');

const partsRequestSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true },
  quantityRequested: { type: Number, required: true },
  status: { type: String, enum: ['Requested', 'Issued'], default: 'Requested' }
}, { timestamps: true });

module.exports = mongoose.model('PartsRequest', partsRequestSchema);
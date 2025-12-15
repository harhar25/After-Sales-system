const mongoose = require('mongoose');

const partsIssuanceSchema = new mongoose.Schema({
  partsRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartsRequest', required: true },
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  warehouseStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partsIssued: [{
    partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true }
  }],
  status: { 
    type: String, 
    enum: ['Prepared', 'Ready for Release', 'Issued'], 
    default: 'Prepared' 
  },
  technicianSignature: {
    signatureData: { type: String }, // Base64 encoded signature
    signedAt: { type: Date },
    ipAddress: { type: String }
  },
  warehouseStaffSignature: {
    signatureData: { type: String }, // Base64 encoded signature
    signedAt: { type: Date },
    ipAddress: { type: String }
  },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PartsIssuance', partsIssuanceSchema);
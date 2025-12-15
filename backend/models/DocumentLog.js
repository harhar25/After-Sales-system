const mongoose = require('mongoose');

const documentLogSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Document types that can be printed
  documentType: { 
    type: String, 
    enum: ['ServiceOrder', 'ServiceOrderConfirmation', 'ServicePicklist', 'VehicleReportCard', 'CIS'], 
    required: true 
  },
  
  // Document status
  status: { type: String, enum: ['Generated', 'Printed', 'Sent', 'Archived'], default: 'Generated' },
  
  // Print tracking
  printedAt: { type: Date },
  printedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  copies: { type: Number, default: 1 },
  
  // Additional metadata
  metadata: {
    fileName: { type: String },
    fileSize: { type: Number },
    printSettings: { type: Object }
  },
  
  // Notes
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DocumentLog', documentLogSchema);
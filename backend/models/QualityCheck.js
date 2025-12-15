const mongoose = require('mongoose');

const inspectionItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  status: { type: String, enum: ['Pass', 'Fail', 'Needs Attention'], required: true },
  notes: { type: String },
  technicianSignature: {
    signed: { type: Boolean, default: false },
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date }
  }
});

const qualityCheckSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  // Foreman inspection details
  foremanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foremanSignature: {
    signed: { type: Boolean, default: false },
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date }
  },
  
  // QC Inspection Results
  inspectionType: { type: String, enum: ['Initial QC', 'Road Test QC', 'Final QC'], required: true },
  inspectionItems: [inspectionItemSchema],
  
  // Overall assessment
  overallStatus: {
    type: String,
    enum: ['Pass', 'Fail', 'Requires Road Test', 'Pending Technician Review'],
    required: true
  },
  
  // Issues and findings
  issuesFound: [{
    issueType: { type: String, enum: ['Mechanical', 'Electrical', 'Cosmetic', 'Performance', 'Safety'], required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    resolved: { type: Boolean, default: false },
    resolutionNotes: { type: String }
  }],
  
  // Recommendations
  recommendations: [{ type: String }],
  
  // Vehicle Report Card reference
  vehicleReportCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleReportCard' },
  
  // Road Test requirement
  roadTestRequired: { type: Boolean, default: false },
  roadTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadTest' },
  
  // Technician counter-signature
  technicianCounterSignature: {
    signed: { type: Boolean, default: false },
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date }
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  
  // Timestamps
  inspectionStartedAt: { type: Date, default: Date.now },
  inspectionCompletedAt: { type: Date },
  
  // Final completion
  qcPassed: { type: Boolean, default: false },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('QualityCheck', qualityCheckSchema);
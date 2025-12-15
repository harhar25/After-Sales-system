const mongoose = require('mongoose');

const managerApprovalSchema = new mongoose.Schema({
  // Related documents
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  gatepassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gatepass', required: true },
  
  // Approval details
  approvalType: { 
    type: String, 
    enum: ['Gatepass Release', 'Service Completion', 'Quality Exception', 'Warranty Override', 'Payment Override'], 
    required: true 
  },
  
  // Approval status
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], 
    default: 'Pending' 
  },
  
  // Request details
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestReason: { type: String, required: true },
  requestDetails: { type: String },
  requestPriority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'], 
    default: 'Medium' 
  },
  
  // Approval decision
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalDecision: { type: String, enum: ['Approved', 'Rejected'] },
  approvalComments: { type: String },
  
  // Timestamps
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  expiresAt: { type: Date },
  
  // Audit trail
  approvalLevel: { type: String, default: 'Service Manager' },
  isSystemLogged: { type: Boolean, default: true },
  
  // Additional context
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, required: true },
  
  // Digital signature for approval
  digitalSignature: {
    signatureData: { type: String },
    signatureTimestamp: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  
  // Notification tracking
  notificationsSent: [{
    type: { type: String, enum: ['Email', 'SMS', 'System'] },
    sentAt: { type: Date },
    recipient: { type: String },
    status: { type: String, enum: ['Sent', 'Delivered', 'Failed'] }
  }],
  
  // Escalation tracking
  escalated: { type: Boolean, default: false },
  escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  escalatedAt: { type: Date },
  escalationReason: { type: String },
  
  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-set expiry date (48 hours from request)
managerApprovalSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(this.requestedAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours
  }
  next();
});

// Update timestamps when modified
managerApprovalSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastModifiedAt = new Date();
  }
  next();
});

// Indexes for efficient queries
managerApprovalSchema.index({ serviceOrderId: 1 });
managerApprovalSchema.index({ gatepassId: 1 });
managerApprovalSchema.index({ status: 1 });
managerApprovalSchema.index({ approvalType: 1 });
managerApprovalSchema.index({ requestedBy: 1 });
managerApprovalSchema.index({ approvedBy: 1 });
managerApprovalSchema.index({ requestedAt: -1 });
managerApprovalSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('ManagerApproval', managerApprovalSchema);
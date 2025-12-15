const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  billingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Billing', required: true },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Payment details
  paymentNumber: { type: String, required: true, unique: true },
  paymentDate: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  
  // Payment method
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Card', 'Online', 'Check', 'Corporate Account', 'Government Account'], 
    required: true 
  },
  
  // Payment method specific details
  cardDetails: {
    cardNumber: { type: String }, // Last 4 digits only
    cardType: { type: String }, // Visa, MasterCard, etc.
    expiryDate: { type: String },
    authorizationCode: { type: String }
  },
  
  onlineDetails: {
    transactionId: { type: String },
    gateway: { type: String }, // PayPal, Stripe, etc.
    referenceNumber: { type: String }
  },
  
  checkDetails: {
    checkNumber: { type: String },
    bankName: { type: String },
    accountNumber: { type: String }, // Last 4 digits only
    routingNumber: { type: String } // Last 4 digits only
  },
  
  corporateDetails: {
    companyName: { type: String },
    accountNumber: { type: String },
    purchaseOrderNumber: { type: String },
    creditLimit: { type: Number },
    approvalCode: { type: String }
  },
  
  governmentDetails: {
    agencyName: { type: String },
    department: { type: String },
    budgetCode: { type: String },
    authorizationNumber: { type: String }
  },
  
  // Payment status
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Charge Account Pending'], 
    default: 'Completed' 
  },
  
  // Receipt and documentation
  receiptNumber: { type: String },
  receiptGenerated: { type: Boolean, default: false },
  receiptGeneratedAt: { type: Date },
  
  // Change and cash handling
  amountReceived: { type: Number },
  changeGiven: { type: Number },
  
  // Refund information
  refundAmount: { type: Number },
  refundReason: { type: String },
  refundDate: { type: Date },
  refundProcessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Digital signature for payment confirmation
  cashierSignature: { type: String }, // Digital signature or initials
  customerAcknowledgment: { type: String }, // Customer confirmation
  
  // Notes and observations
  cashierNotes: { type: String },
  customerNotes: { type: String },
  
  // Audit trail
  processedAt: { type: Date, default: Date.now },
  lastModifiedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-generate payment number
paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.paymentNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, new Date().getMonth(), 1),
        $lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    });
    this.paymentNumber = `PAY-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate change before saving
paymentSchema.pre('save', function(next) {
  if (this.paymentMethod === 'Cash' && this.amountReceived && this.amount) {
    this.changeGiven = this.amountReceived - this.amount;
  }
  next();
});

// Index for efficient queries
paymentSchema.index({ serviceOrderId: 1 });
paymentSchema.index({ billingId: 1 });
paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
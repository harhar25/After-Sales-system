const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Billing details
  billingNumber: { type: String, required: true, unique: true },
  billingDate: { type: Date, default: Date.now },
  
  // Cost breakdown
  laborCost: { type: Number, default: 0 },
  partsCost: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  warrantyDeduction: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  
  // Billing line items
  lineItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BillingLineItem' }],
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['Generated', 'For Payment', 'Paid', 'Cancelled'], 
    default: 'Generated' 
  },
  
  // Payment tracking
  paymentDate: { type: Date },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMethod: { type: String },
  paymentReference: { type: String },
  
  // Document printing
  printedAt: { type: Date },
  printedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Notes
  notes: { type: String },
  
  // Warranty information
  isWarrantyService: { type: Boolean, default: false },
  warrantyType: { type: String },
  warrantyClaimNumber: { type: String }
}, { timestamps: true });

// Auto-generate billing number
billingSchema.pre('save', async function(next) {
  if (this.isNew && !this.billingNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, new Date().getMonth(), 1),
        $lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    });
    this.billingNumber = `BILL-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
billingSchema.pre('save', function(next) {
  if (this.lineItems && this.lineItems.length > 0) {
    // This will be calculated when line items are populated
    // For now, we'll recalculate in the controller
  }
  next();
});

module.exports = mongoose.model('Billing', billingSchema);
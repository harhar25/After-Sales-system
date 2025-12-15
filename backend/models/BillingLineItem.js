const mongoose = require('mongoose');

const billingLineItemSchema = new mongoose.Schema({
  billingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Billing', required: true },
  serviceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceOrder', required: true },
  
  // Line item details
  itemType: { 
    type: String, 
    enum: ['Labor', 'Part', 'Service', 'Warranty Deduction', 'Discount'], 
    required: true 
  },
  description: { type: String, required: true },
  
  // Quantities and pricing
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  
  // Additional details based on item type
  laborHours: { type: Number }, // For labor items
  laborRate: { type: Number }, // For labor items
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' }, // For labor items
  
  partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Part' }, // For part items
  partsIssuanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PartsIssuance' }, // For part items
  
  // Warranty and discount information
  isWarrantyItem: { type: Boolean, default: false },
  warrantyCoverage: { type: Number, default: 0 }, // Percentage of coverage
  warrantyDeduction: { type: Number, default: 0 }, // Amount deducted due to warranty
  
  discountType: { type: String, enum: ['Percentage', 'Fixed Amount'] },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  
  // Status
  status: { type: String, enum: ['Active', 'Removed'], default: 'Active' },
  
  // Notes
  notes: { type: String }
}, { timestamps: true });

// Calculate total price before saving
billingLineItemSchema.pre('save', function(next) {
  // Calculate line item total
  this.totalPrice = this.quantity * this.unitPrice;
  
  // Apply warranty deduction if applicable
  if (this.isWarrantyItem && this.warrantyDeduction > 0) {
    this.totalPrice -= this.warrantyDeduction;
  }
  
  // Apply discount if applicable
  if (this.discountAmount > 0) {
    this.totalPrice -= this.discountAmount;
  }
  
  // Ensure total price is not negative
  if (this.totalPrice < 0) {
    this.totalPrice = 0;
  }
  
  next();
});

module.exports = mongoose.model('BillingLineItem', billingLineItemSchema);
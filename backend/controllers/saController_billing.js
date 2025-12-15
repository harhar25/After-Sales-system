// 8.1 Billing Generation
// Generate billing from service order
exports.generateBilling = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    const { discountAmount = 0, warrantyDeduction = 0 } = req.body;
    
    // Get service order with all related data
    const serviceOrder = await ServiceOrder.findById(serviceOrderId)
      .populate('customerId vehicleId')
      .populate({
        path: 'vehicleReportCardId',
        populate: {
          path: 'technicianAssignments',
          populate: 'technicianId'
        }
      });
    
    if (!serviceOrder) return res.status(404).json({ message: 'Service Order not found' });
    
    // Check if billing already exists
    let existingBilling = await Billing.findOne({ serviceOrderId });
    if (existingBilling) {
      return res.status(400).json({ message: 'Billing already generated for this Service Order' });
    }
    
    // Get labor tracking data
    const laborTrackings = await LaborTracking.find({ serviceOrderId })
      .populate('technicianId');
    
    // Get parts issuance data
    const partsIssuances = await PartsIssuance.find({ serviceOrderId })
      .populate('partsIssued.partId');
    
    // Create billing record
    const billing = new Billing({
      serviceOrderId: serviceOrder._id,
      customerId: serviceOrder.customerId._id,
      vehicleId: serviceOrder.vehicleId._id,
      advisorId: req.user.id,
      isWarrantyService: serviceOrder.isWarranty,
      warrantyType: serviceOrder.warrantyType,
      discountAmount,
      warrantyDeduction
    });
    
    await billing.save();
    
    // Create line items for labor
    let laborCost = 0;
    for (const laborTracking of laborTrackings) {
      if (laborTracking.totalWorkedHours > 0) {
        const laborRate = 50; // Standard labor rate per hour
        const laborTotal = laborTracking.totalWorkedHours * laborRate;
        laborCost += laborTotal;
        
        const laborLineItem = new BillingLineItem({
          billingId: billing._id,
          serviceOrderId: serviceOrder._id,
          itemType: 'Labor',
          description: `Labor - ${laborTracking.workPerformed.join(', ') || 'General Service'}`,
          quantity: laborTracking.totalWorkedHours,
          unitPrice: laborRate,
          totalPrice: laborTotal,
          laborHours: laborTracking.totalWorkedHours,
          laborRate: laborRate,
          technicianId: laborTracking.technicianId._id
        });
        
        await laborLineItem.save();
        billing.lineItems.push(laborLineItem._id);
      }
    }
    
    // Create line items for parts
    let partsCost = 0;
    for (const partsIssuance of partsIssuances) {
      for (const part of partsIssuance.partsIssued) {
        const partTotal = part.quantity * part.unitPrice;
        partsCost += partTotal;
        
        const partLineItem = new BillingLineItem({
          billingId: billing._id,
          serviceOrderId: serviceOrder._id,
          itemType: 'Part',
          description: `${part.partId.name} (${part.partId.partNumber})`,
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          totalPrice: partTotal,
          partId: part.partId._id,
          partsIssuanceId: partsIssuance._id
        });
        
        await partLineItem.save();
        billing.lineItems.push(partLineItem._id);
      }
    }
    
    // Add discount line item if applicable
    if (discountAmount > 0) {
      const discountLineItem = new BillingLineItem({
        billingId: billing._id,
        serviceOrderId: serviceOrder._id,
        itemType: 'Discount',
        description: 'Customer Discount',
        quantity: 1,
        unitPrice: -discountAmount,
        totalPrice: -discountAmount,
        discountType: 'Fixed Amount',
        discountValue: discountAmount,
        discountAmount: discountAmount
      });
      
      await discountLineItem.save();
      billing.lineItems.push(discountLineItem._id);
    }
    
    // Add warranty deduction line item if applicable
    if (warrantyDeduction > 0) {
      const warrantyLineItem = new BillingLineItem({
        billingId: billing._id,
        serviceOrderId: serviceOrder._id,
        itemType: 'Warranty Deduction',
        description: 'Warranty Coverage Deduction',
        quantity: 1,
        unitPrice: -warrantyDeduction,
        totalPrice: -warrantyDeduction,
        isWarrantyItem: true,
        warrantyCoverage: 100,
        warrantyDeduction: warrantyDeduction
      });
      
      await warrantyLineItem.save();
      billing.lineItems.push(warrantyLineItem._id);
    }
    
    // Calculate totals
    billing.laborCost = laborCost;
    billing.partsCost = partsCost;
    billing.subtotal = laborCost + partsCost;
    billing.totalAmount = billing.subtotal - discountAmount - warrantyDeduction;
    
    await billing.save();
    
    // Populate billing with line items for response
    await billing.populate([
      { path: 'lineItems' },
      { path: 'customerId' },
      { path: 'vehicleId' }
    ]);
    
    res.json({
      message: 'Billing generated successfully',
      billing: billing
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get billing details
exports.getBillingDetails = async (req, res) => {
  try {
    const { billingId } = req.params;
    
    const billing = await Billing.findById(billingId)
      .populate('lineItems')
      .populate('customerId vehicleId')
      .populate('advisorId', 'name email');
    
    if (!billing) return res.status(404).json({ message: 'Billing not found' });
    
    res.json(billing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Print Service Billing
exports.printServiceBilling = async (req, res) => {
  try {
    const { billingId } = req.params;
    
    const billing = await Billing.findById(billingId)
      .populate('lineItems')
      .populate('customerId vehicleId')
      .populate('serviceOrderId');
    
    if (!billing) return res.status(404).json({ message: 'Billing not found' });
    
    // Log the billing print
    const documentLog = new DocumentLog({
      serviceOrderId: billing.serviceOrderId._id,
      customerId: billing.customerId._id,
      advisorId: req.user.id,
      documentType: 'Service Billing',
      status: 'Printed',
      printedAt: new Date(),
      printedBy: req.user.id,
      copies: req.body.copies || 1,
      metadata: { billingNumber: billing.billingNumber }
    });
    
    await documentLog.save();
    
    // Update billing print status
    billing.printedAt = new Date();
    billing.printedBy = req.user.id;
    await billing.save();
    
    res.json({
      message: 'Service Billing printed successfully',
      billing: billing,
      documentLog: documentLog
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8.2 Customer Handoff to Cashier - Mark SO as "For Payment"
exports.markForPayment = async (req, res) => {
  try {
    const { serviceOrderId } = req.params;
    
    // Find and update service order
    const serviceOrder = await ServiceOrder.findByIdAndUpdate(
      serviceOrderId,
      { status: 'For Payment' },
      { new: true }
    ).populate('customerId vehicleId');
    
    if (!serviceOrder) return res.status(404).json({ message: 'Service Order not found' });
    
    // Find associated billing and update status
    const billing = await Billing.findOne({ serviceOrderId });
    if (billing) {
      billing.status = 'For Payment';
      await billing.save();
    }
    
    res.json({
      message: 'Service Order marked as For Payment',
      serviceOrder: serviceOrder,
      billing: billing
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
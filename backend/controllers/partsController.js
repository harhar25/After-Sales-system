const PartsRequest = require('../models/PartsRequest');
const Part = require('../models/Part');
const PartsIssuance = require('../models/PartsIssuance');
const ServiceOrder = require('../models/ServiceOrder');
const TechnicianAssignment = require('../models/TechnicianAssignment');

// 4.2: Prepare parts for issuance
exports.preparePartsForIssuance = async (req, res) => {
  try {
    const { partsRequestId } = req.params;
    
    const partsRequest = await PartsRequest.findById(partsRequestId)
      .populate('partId')
      .populate('serviceOrderId');
    
    if (!partsRequest) {
      return res.status(404).json({ message: 'Parts Request not found' });
    }
    
    if (partsRequest.status !== 'Requested') {
      return res.status(400).json({ message: 'Parts request already processed' });
    }
    
    if (partsRequest.partId.quantity < partsRequest.quantityRequested) {
      return res.status(400).json({ message: 'Insufficient quantity in inventory' });
    }
    
    // Create parts issuance record
    const partsIssuance = new PartsIssuance({
      partsRequestId,
      serviceOrderId: partsRequest.serviceOrderId._id,
      technicianId: partsRequest.serviceOrderId.technicianId,
      warehouseStaffId: req.user.id,
      partsIssued: [{
        partId: partsRequest.partId._id,
        quantity: partsRequest.quantityRequested,
        unitPrice: partsRequest.partId.price
      }],
      status: 'Prepared'
    });
    
    await partsIssuance.save();
    
    // Update parts request status
    partsRequest.status = 'Prepared';
    partsRequest.partsIssuanceId = partsIssuance._id;
    await partsRequest.save();
    
    res.json({ 
      message: 'Parts prepared for issuance',
      partsIssuance 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4.2: Mark parts as ready for release
exports.markPartsReadyForRelease = async (req, res) => {
  try {
    const { partsIssuanceId } = req.params;
    
    const partsIssuance = await PartsIssuance.findById(partsIssuanceId)
      .populate('partsIssuance.partsIssued.partId');
    
    if (!partsIssuance) {
      return res.status(404).json({ message: 'Parts issuance not found' });
    }
    
    if (partsIssuance.status !== 'Prepared') {
      return res.status(400).json({ message: 'Parts not in prepared state' });
    }
    
    // Update status to ready for release
    partsIssuance.status = 'Ready for Release';
    await partsIssuance.save();
    
    res.json({ 
      message: 'Parts ready for release',
      partsIssuance 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4.2: Process parts issuance with digital signatures
exports.issuePartsRequest = async (req, res) => {
  try {
    const { partsRequestId } = req.params;
    const { warehouseSignatureData } = req.body;
    
    const partsRequest = await PartsRequest.findById(partsRequestId)
      .populate('partId');
    
    if (!partsRequest) {
      return res.status(404).json({ message: 'Parts Request not found' });
    }
    
    if (partsRequest.status === 'Issued') {
      return res.status(400).json({ message: 'Parts already issued' });
    }
    
    if (!partsRequest.partsIssuanceId) {
      return res.status(400).json({ message: 'Parts must be prepared first' });
    }
    
    const partsIssuance = await PartsIssuance.findById(partsRequest.partsIssuanceId);
    
    if (partsIssuance.status !== 'Ready for Release') {
      return res.status(400).json({ message: 'Parts not ready for release' });
    }
    
    // Add warehouse staff signature
    partsIssuance.warehouseStaffSignature = {
      signatureData: warehouseSignatureData,
      signedAt: new Date(),
      ipAddress: req.ip
    };
    
    partsIssuance.status = 'Issued';
    await partsIssuance.save();
    
    // Update parts inventory
    partsRequest.partId.quantity -= partsRequest.quantityRequested;
    await partsRequest.partId.save();
    
    // Update parts request status
    partsRequest.status = 'Issued';
    await partsRequest.save();
    
    res.json({ 
      message: 'Parts issued successfully',
      partsRequest,
      partsIssuance 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all pending parts requests for warehouse
exports.getPendingPartsRequests = async (req, res) => {
  try {
    const pendingRequests = await PartsRequest.find({
      status: { $in: ['Requested', 'Prepared'] }
    })
      .populate('partId')
      .populate('serviceOrderId')
      .populate('technicianId');
    
    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get parts issuances ready for technician pickup
exports.getReadyForReleaseIssuances = async (req, res) => {
  try {
    const issuances = await PartsIssuance.find({
      status: 'Ready for Release'
    })
      .populate('partsIssuance.partsIssued.partId')
      .populate('serviceOrderId')
      .populate('technicianId');
    
    res.json(issuances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const PartsRequest = require('../models/PartsRequest');
const Part = require('../models/Part');

exports.issuePartsRequest = async (req, res) => {
  try {
    const pr = await PartsRequest.findById(req.params.id).populate('partId');
    if (!pr) return res.status(404).json({ message: 'Parts Request not found' });
    if (pr.status !== 'Requested') return res.status(400).json({ message: 'Already issued' });
    if (pr.partId.quantity < pr.quantityRequested) return res.status(400).json({ message: 'Insufficient quantity' });
    pr.partId.quantity -= pr.quantityRequested;
    await pr.partId.save();
    pr.status = 'Issued';
    await pr.save();
    res.json(pr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
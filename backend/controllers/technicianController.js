const ServiceOrder = require('../models/ServiceOrder');
const PartsRequest = require('../models/PartsRequest');

exports.getPicklist = async (req, res) => {
  try {
    const so = await ServiceOrder.findById(req.params.id).populate('parts');
    if (!so) return res.status(404).json({ message: 'Service Order not found' });
    res.json(so.parts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPartsRequest = async (req, res) => {
  try {
    const pr = new PartsRequest(req.body);
    await pr.save();
    res.status(201).json(pr);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
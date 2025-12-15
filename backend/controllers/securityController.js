const ServiceOrder = require('../models/ServiceOrder');

exports.validateGatepass = async (req, res) => {
  try {
    const so = await ServiceOrder.findByIdAndUpdate(req.params.id, { validated: true }, { new: true });
    if (!so) return res.status(404).json({ message: 'Service Order not found' });
    res.json(so);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const ServiceOrder = require('../models/ServiceOrder');

exports.getActiveServiceOrders = async (req, res) => {
  try {
    const sos = await ServiceOrder.find({ status: { $in: ['Scheduled', 'In Progress'] } }).populate('customerId vehicleId technicianId');
    res.json(sos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;
    const so = await ServiceOrder.findByIdAndUpdate(req.params.id, { technicianId }, { new: true });
    if (!so) return res.status(404).json({ message: 'Service Order not found' });
    res.json(so);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
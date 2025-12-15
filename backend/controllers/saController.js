const ServiceOrder = require('../models/ServiceOrder');

exports.getServiceOrder = async (req, res) => {
  try {
    const so = await ServiceOrder.findById(req.params.id).populate('customerId vehicleId technicianId parts');
    if (!so) return res.status(404).json({ message: 'Service Order not found' });
    res.json(so);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkInServiceOrder = async (req, res) => {
  try {
    const so = await ServiceOrder.findByIdAndUpdate(req.params.id, { status: 'In Progress' }, { new: true });
    if (!so) return res.status(404).json({ message: 'Service Order not found' });
    res.json(so);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createServiceOrder = async (req, res) => {
  try {
    const so = new ServiceOrder(req.body);
    await so.save();
    res.status(201).json(so);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createVehicleReport = async (req, res) => {
  // Assuming vehicle report creates a service order
  try {
    const so = new ServiceOrder(req.body);
    await so.save();
    res.status(201).json(so);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getBilling = async (req, res) => {
  try {
    const so = await ServiceOrder.findById(req.params.id).populate('parts');
    if (!so) return res.status(404).json({ message: 'Service Order not found' });
    // Calculate total cost if not set
    let total = so.totalCost;
    if (!total) {
      total = so.parts.reduce((sum, part) => sum + (part.price * 1), 0) + (so.laborHours * 50); // assume labor rate
      so.totalCost = total;
      await so.save();
    }
    res.json({ serviceOrder: so, totalCost: total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
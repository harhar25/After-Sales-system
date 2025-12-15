const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Appointment = require('../models/Appointment');

exports.getPMSDueList = async (req, res) => {
  try {
    // Assuming PMS due list is all vehicles, or based on some logic
    const vehicles = await Vehicle.find().populate('customerId');
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
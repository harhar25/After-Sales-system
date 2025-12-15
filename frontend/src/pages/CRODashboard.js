import React, { useState, useEffect } from 'react';
import { getPmsDueList, createCustomer, createAppointment } from '../services/api';

const CRODashboard = ({ token }) => {
  const [pmsDueList, setPmsDueList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetchPmsDueList();
  }, []);

  const fetchPmsDueList = async () => {
    try {
      const response = await axios.get('http://localhost:5000/cro/pms-due-list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPmsDueList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (customerData) => {
    try {
      await axios.post('http://localhost:5000/cro/customers', customerData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh or update state
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAppointment = async (appointmentData) => {
    try {
      await axios.post('http://localhost:5000/cro/appointments', appointmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh or update state
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-5">
      <h1>CRO Dashboard</h1>
      <div className="row">
        <div className="col-md-4">
          <h3>PMS Due List</h3>
          <ul className="list-group">
            {pmsDueList.map(item => (
              <li key={item.id} className="list-group-item">{item.name}</li>
            ))}
          </ul>
        </div>
        <div className="col-md-4">
          <h3>Contact Customer</h3>
          <button className="btn btn-primary">Contact</button>
        </div>
        <div className="col-md-4">
          <h3>Create Appointment</h3>
          <button className="btn btn-success">Create</button>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-md-6">
          <h3>Register Walk-in Customer</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateCustomer({ name: e.target.name.value }); }}>
            <input name="name" placeholder="Customer Name" className="form-control mb-2" required />
            <button type="submit" className="btn btn-primary">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CRODashboard;
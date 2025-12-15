import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ServiceAdvisorDashboard = ({ token }) => {
  const [serviceOrders, setServiceOrders] = useState([]);

  useEffect(() => {
    fetchServiceOrders();
  }, []);

  const fetchServiceOrders = async () => {
    try {
      // Assuming an endpoint to get all service orders for SA
      const response = await axios.get('http://localhost:5000/sa/service-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServiceOrders(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await axios.put(`http://localhost:5000/sa/service-orders/${id}/check-in`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServiceOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateServiceOrder = async (data) => {
    try {
      await axios.post('http://localhost:5000/sa/service-orders', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServiceOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVRC = async (data) => {
    try {
      await axios.post('http://localhost:5000/sa/vehicle-reports', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintDocument = (id) => {
    // Mock print
    alert(`Printing document for service order ${id}`);
  };

  const handleGenerateBilling = async (id) => {
    try {
      const response = await axios.get(`http://localhost:5000/sa/billing/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Billing: ${JSON.stringify(response.data)}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-5">
      <h1>Service Advisor Dashboard</h1>
      <div className="row">
        <div className="col-md-6">
          <h3>Customer Check-in</h3>
          <ul className="list-group">
            {serviceOrders.map(order => (
              <li key={order.id} className="list-group-item d-flex justify-content-between">
                {order.customerName}
                <button className="btn btn-sm btn-primary" onClick={() => handleCheckIn(order.id)}>Check-in</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-6">
          <h3>Vehicle Diagnosis (VRC)</h3>
          <button className="btn btn-warning" onClick={() => handleCreateVRC({ vehicleId: 1, diagnosis: 'Test' })}>Create VRC</button>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-md-4">
          <h3>Service Order Creation</h3>
          <button className="btn btn-success" onClick={() => handleCreateServiceOrder({ customerId: 1, vehicleId: 1 })}>Create Order</button>
        </div>
        <div className="col-md-4">
          <h3>Document Printing</h3>
          <button className="btn btn-info" onClick={() => handlePrintDocument(1)}>Print</button>
        </div>
        <div className="col-md-4">
          <h3>Billing Generation</h3>
          <button className="btn btn-secondary" onClick={() => handleGenerateBilling(1)}>Generate</button>
        </div>
      </div>
    </div>
  );
};

export default ServiceAdvisorDashboard;
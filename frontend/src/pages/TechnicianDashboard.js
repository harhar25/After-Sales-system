import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TechnicianDashboard = ({ token }) => {
  const [serviceOrders, setServiceOrders] = useState([]);
  const [partsPicklist, setPartsPicklist] = useState([]);

  useEffect(() => {
    fetchAssignedServiceOrders();
  }, []);

  const fetchAssignedServiceOrders = async () => {
    try {
      // Assuming endpoint for technician's assigned orders
      const response = await axios.get('http://localhost:5000/technician/service-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServiceOrders(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestParts = async (data) => {
    try {
      await axios.post('http://localhost:5000/technician/parts-request', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteService = async (id) => {
    try {
      await axios.put(`http://localhost:5000/technician/service-orders/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAssignedServiceOrders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-5">
      <h1>Technician Dashboard</h1>
      <div className="row">
        <div className="col-md-6">
          <h3>Assigned Service Orders</h3>
          <ul className="list-group">
            {serviceOrders.map(order => (
              <li key={order.id} className="list-group-item d-flex justify-content-between">
                {order.description}
                <button className="btn btn-sm btn-success" onClick={() => handleCompleteService(order.id)}>Complete</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-6">
          <h3>Parts Picklist</h3>
          <ul className="list-group">
            {partsPicklist.map(part => (
              <li key={part.id} className="list-group-item">{part.name}</li>
            ))}
          </ul>
          <button className="btn btn-warning mt-2" onClick={() => handleRequestParts({ partId: 1, quantity: 1 })}>Request Parts</button>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
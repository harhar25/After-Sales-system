import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CashierDashboard = ({ token }) => {
  const [serviceOrders, setServiceOrders] = useState([]);

  useEffect(() => {
    fetchServiceOrdersForPayment();
  }, []);

  const fetchServiceOrdersForPayment = async () => {
    try {
      const response = await axios.get('http://localhost:5000/cashier/service-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServiceOrders(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessPayment = async (id, amount) => {
    try {
      await axios.put(`http://localhost:5000/cashier/service-orders/${id}/payment`, { amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServiceOrdersForPayment();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignGatepass = async (id) => {
    try {
      await axios.put(`http://localhost:5000/cashier/service-orders/${id}/gatepass`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServiceOrdersForPayment();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-5">
      <h1>Cashier Dashboard</h1>
      <div className="row">
        <div className="col-md-6">
          <h3>Payment Processing</h3>
          <ul className="list-group">
            {serviceOrders.map(order => (
              <li key={order.id} className="list-group-item d-flex justify-content-between">
                {order.description} - ${order.amount}
                <button className="btn btn-sm btn-primary" onClick={() => handleProcessPayment(order.id, order.amount)}>Process Payment</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-6">
          <h3>Gatepass Signing</h3>
          <button className="btn btn-success" onClick={() => handleSignGatepass(1)}>Sign Gatepass</button>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
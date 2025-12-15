import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ForemanDashboard = ({ token }) => {
  const [serviceOrders, setServiceOrders] = useState([]);

  useEffect(() => {
    fetchServiceOrdersForQC();
  }, []);

  const fetchServiceOrdersForQC = async () => {
    try {
      const response = await axios.get('http://localhost:5000/foreman/service-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServiceOrders(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQualityCheck = async (id, passed) => {
    try {
      await axios.put(`http://localhost:5000/foreman/service-orders/${id}/qc`, { passed }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServiceOrdersForQC();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogRoadTest = async (id, result) => {
    try {
      await axios.post(`http://localhost:5000/foreman/service-orders/${id}/road-test`, { result }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-5">
      <h1>Foreman Dashboard</h1>
      <div className="row">
        <div className="col-md-6">
          <h3>Quality Checks</h3>
          <ul className="list-group">
            {serviceOrders.map(order => (
              <li key={order.id} className="list-group-item d-flex justify-content-between">
                {order.description}
                <div>
                  <button className="btn btn-sm btn-success me-2" onClick={() => handleQualityCheck(order.id, true)}>Pass</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleQualityCheck(order.id, false)}>Fail</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-6">
          <h3>Road Test Logging</h3>
          <button className="btn btn-primary" onClick={() => handleLogRoadTest(1, 'Passed')}>Log Road Test</button>
        </div>
      </div>
    </div>
  );
};

export default ForemanDashboard;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TechnicianDashboard = ({ token }) => {
  const [serviceOrders, setServiceOrders] = useState([]);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState(null);
  const [partsPicklist, setPartsPicklist] = useState([]);
  const [partsIssuances, setPartsIssuances] = useState([]);
  const [qualityCheckRequests, setQualityCheckRequests] = useState([]);
  const [showPartsRequestModal, setShowPartsRequestModal] = useState(false);
  const [showCompleteServiceModal, setShowCompleteServiceModal] = useState(false);
  const [partsRequestForm, setPartsRequestForm] = useState({
    serviceOrderId: '',
    parts: []
  });
  const [completeServiceForm, setCompleteServiceForm] = useState({
    workPerformed: '',
    additionalRepairsNeeded: false,
    additionalRepairsNotes: ''
  });

  useEffect(() => {
    fetchAssignedServiceOrders();
    fetchQualityCheckRequests();
  }, []);

  const fetchAssignedServiceOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/technician/service-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServiceOrders(response.data);
    } catch (err) {
      console.error('Error fetching service orders:', err);
    }
  };

  const fetchPicklist = async (serviceOrderId) => {
    try {
      const response = await axios.get(`http://localhost:5000/technician/service-orders/${serviceOrderId}/picklist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPartsPicklist(response.data);
    } catch (err) {
      console.error('Error fetching picklist:', err);
    }
  };

  const fetchQualityCheckRequests = async () => {
    try {
      const response = await axios.get('http://localhost:5000/technician/quality-check-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQualityCheckRequests(response.data);
    } catch (err) {
      console.error('Error fetching quality check requests:', err);
    }
  };

  const handleServiceOrderSelect = (order) => {
    setSelectedServiceOrder(order);
    fetchPicklist(order._id);
  };

  const handleRequestParts = async () => {
    if (!partsRequestForm.serviceOrderId || partsRequestForm.parts.length === 0) {
      alert('Please select service order and add parts');
      return;
    }

    try {
      await axios.post('http://localhost:5000/technician/parts-request/bulk', partsRequestForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Parts request sent to warehouse');
      setShowPartsRequestModal(false);
      setPartsRequestForm({ serviceOrderId: '', parts: [] });
      fetchPicklist(partsRequestForm.serviceOrderId);
    } catch (err) {
      console.error('Error requesting parts:', err);
      alert('Error requesting parts');
    }
  };

  const handleSignForParts = async (partsIssuanceId) => {
    const signature = prompt('Please enter your digital signature (simulated):');
    if (!signature) return;

    try {
      await axios.post('http://localhost:5000/technician/parts/sign', {
        partsIssuanceId,
        signatureData: signature
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Parts signed and received successfully');
      fetchPicklist(selectedServiceOrder?._id);
    } catch (err) {
      console.error('Error signing for parts:', err);
      alert('Error signing for parts');
    }
  };

  const handleCompleteService = async () => {
    if (!selectedServiceOrder || !completeServiceForm.workPerformed) {
      alert('Please fill in work performed');
      return;
    }

    try {
      await axios.put(`http://localhost:5000/technician/service-orders/${selectedServiceOrder._id}/complete`, completeServiceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Service completed and quality check requested');
      setShowCompleteServiceModal(false);
      setCompleteServiceForm({
        workPerformed: '',
        additionalRepairsNeeded: false,
        additionalRepairsNotes: ''
      });
      fetchAssignedServiceOrders();
      fetchQualityCheckRequests();
    } catch (err) {
      console.error('Error completing service:', err);
      alert('Error completing service');
    }
  };

  const addPartToRequest = () => {
    setPartsRequestForm(prev => ({
      ...prev,
      parts: [...prev.parts, { partId: '', quantity: 1 }]
    }));
  };

  const updatePartInRequest = (index, field, value) => {
    setPartsRequestForm(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const removePartFromRequest = (index) => {
    setPartsRequestForm(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'Scheduled': 'badge-secondary',
      'Checked In': 'badge-info',
      'In Progress': 'badge-primary',
      'Waiting Parts': 'badge-warning',
      'Quality Check': 'badge-warning',
      'Completed': 'badge-success',
      'Paid': 'badge-success'
    };
    return `badge ${statusClasses[status] || 'badge-secondary'}`;
  };

  return (
    <div className="container mt-4">
      <h2>Technician Dashboard</h2>
      
      {/* Service Orders Section */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Assigned Service Orders</h5>
            </div>
            <div className="card-body">
              <ul className="list-group">
                {serviceOrders.map(order => (
                  <li 
                    key={order._id} 
                    className={`list-group-item d-flex justify-content-between align-items-center ${
                      selectedServiceOrder?._id === order._id ? 'active' : ''
                    }`}
                    onClick={() => handleServiceOrderSelect(order)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <strong>Order #{order._id.substring(-6)}</strong>
                      <br />
                      <small>{order.cisData?.servicesRequested?.join(', ') || 'No services specified'}</small>
                    </div>
                    <span className={getStatusBadgeClass(order.status)}>
                      {order.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Digital Picklist Section */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>Digital Parts Picklist</h5>
              {selectedServiceOrder && (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setPartsRequestForm({ serviceOrderId: selectedServiceOrder._id, parts: [] });
                    setShowPartsRequestModal(true);
                  }}
                >
                  Request Parts
                </button>
              )}
            </div>
            <div className="card-body">
              {selectedServiceOrder ? (
                <>
                  <div className="mb-3">
                    <strong>Service Order:</strong> #{selectedServiceOrder._id.substring(-6)}
                    <br />
                    <strong>Status:</strong> <span className={getStatusBadgeClass(selectedServiceOrder.status)}>{selectedServiceOrder.status}</span>
                  </div>
                  
                  {partsPicklist.length > 0 ? (
                    <>
                      <h6>Parts Requests:</h6>
                      <ul className="list-group">
                        {partsPicklist.map(partRequest => (
                          <li key={partRequest._id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{partRequest.partId?.name || 'Unknown Part'}</strong>
                                <br />
                                <small>Quantity: {partRequest.quantityRequested}</small>
                              </div>
                              <span className={`badge ${
                                partRequest.status === 'Requested' ? 'badge-warning' :
                                partRequest.status === 'Prepared' ? 'badge-info' :
                                partRequest.status === 'Issued' ? 'badge-success' :
                                'badge-secondary'
                              }`}>
                                {partRequest.status}
                              </span>
                            </div>
                            
                            {/* Show sign button for ready parts */}
                            {partRequest.partsIssuanceId && partRequest.partsIssuanceId.status === 'Ready for Release' && (
                              <button 
                                className="btn btn-sm btn-success mt-2"
                                onClick={() => handleSignForParts(partRequest.partsIssuanceId._id)}
                              >
                                Sign for Parts
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-muted">No parts requests for this service order</p>
                  )}

                  {/* Complete Service Button */}
                  {selectedServiceOrder.status === 'In Progress' || selectedServiceOrder.status === 'Waiting Parts' ? (
                    <button 
                      className="btn btn-success mt-3"
                      onClick={() => setShowCompleteServiceModal(true)}
                    >
                      Complete Service
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="text-muted">Select a service order to view its picklist</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quality Check Requests Section */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5>Quality Check Requests</h5>
            </div>
            <div className="card-body">
              {qualityCheckRequests.length > 0 ? (
                <ul className="list-group">
                  {qualityCheckRequests.map(request => (
                    <li key={request._id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Order #{request.serviceOrderId?._id.substring(-6)}</strong>
                          <br />
                          <small>Type: {request.requestType}</small>
                          <br />
                          <small>Status: {request.status}</small>
                        </div>
                        <span className={`badge ${
                          request.status === 'Requested' ? 'badge-warning' :
                          request.status === 'In Progress' ? 'badge-info' :
                          request.status === 'Completed' ? 'badge-success' :
                          'badge-danger'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No pending quality check requests</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parts Request Modal */}
      {showPartsRequestModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Parts from Warehouse</h5>
                <button type="button" className="close" onClick={() => setShowPartsRequestModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Service Order</label>
                  <select 
                    className="form-control"
                    value={partsRequestForm.serviceOrderId}
                    onChange={(e) => setPartsRequestForm(prev => ({ ...prev, serviceOrderId: e.target.value }))}
                  >
                    <option value="">Select Service Order</option>
                    {serviceOrders.map(order => (
                      <option key={order._id} value={order._id}>
                        Order #{order._id.substring(-6)} - {order.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3">
                  <h6>Parts to Request:</h6>
                  {partsRequestForm.parts.map((part, index) => (
                    <div key={index} className="border p-2 mb-2">
                      <div className="row">
                        <div className="col-md-6">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Part ID"
                            value={part.partId}
                            onChange={(e) => updatePartInRequest(index, 'partId', e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <input 
                            type="number" 
                            className="form-control" 
                            placeholder="Quantity"
                            value={part.quantity}
                            onChange={(e) => updatePartInRequest(index, 'quantity', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="col-md-2">
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm"
                            onClick={() => removePartFromRequest(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addPartToRequest}>
                    Add Part
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPartsRequestModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleRequestParts}>
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Service Modal */}
      {showCompleteServiceModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Complete Service</h5>
                <button type="button" className="close" onClick={() => setShowCompleteServiceModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Work Performed</label>
                  <textarea 
                    className="form-control" 
                    rows="3"
                    value={completeServiceForm.workPerformed}
                    onChange={(e) => setCompleteServiceForm(prev => ({ ...prev, workPerformed: e.target.value }))}
                    placeholder="Describe the work performed..."
                  />
                </div>
                
                <div className="form-group">
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input"
                      checked={completeServiceForm.additionalRepairsNeeded}
                      onChange={(e) => setCompleteServiceForm(prev => ({ ...prev, additionalRepairsNeeded: e.target.checked }))}
                    />
                    <label className="form-check-label">
                      Additional repairs needed
                    </label>
                  </div>
                </div>

                {completeServiceForm.additionalRepairsNeeded && (
                  <div className="form-group">
                    <label>Additional Repairs Notes</label>
                    <textarea 
                      className="form-control" 
                      rows="2"
                      value={completeServiceForm.additionalRepairsNotes}
                      onChange={(e) => setCompleteServiceForm(prev => ({ ...prev, additionalRepairsNotes: e.target.value }))}
                      placeholder="Describe additional repairs needed..."
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompleteServiceModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success" onClick={handleCompleteService}>
                  Complete & Request QC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;
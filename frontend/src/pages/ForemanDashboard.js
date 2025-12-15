import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ForemanDashboard = ({ token }) => {
  const [serviceOrders, setServiceOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showRoadTestModal, setShowRoadTestModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [roadTestDetails, setRoadTestDetails] = useState(null);
  const [qcStatus, setQcStatus] = useState(null);

  // Inspection form data
  const [inspectionForm, setInspectionForm] = useState({
    inspectionType: 'Initial QC',
    inspectionItems: [
      { itemName: 'Engine Performance', status: '', notes: '' },
      { itemName: 'Brake System', status: '', notes: '' },
      { itemName: 'Electrical Systems', status: '', notes: '' },
      { itemName: 'Fluid Levels', status: '', notes: '' },
      { itemName: 'Tire Condition', status: '', notes: '' },
      { itemName: 'Interior Cleanliness', status: '', notes: '' },
      { itemName: 'Exterior Condition', status: '', notes: '' },
      { itemName: 'Lights & Signals', status: '', notes: '' },
      { itemName: 'Air Conditioning', status: '', notes: '' },
      { itemName: 'Safety Features', status: '', notes: '' }
    ],
    overallStatus: '',
    issuesFound: [],
    recommendations: [],
    roadTestRequired: false
  });

  // Road test form data
  const [roadTestForm, setRoadTestForm] = useState({
    testerName: '',
    startTime: '',
    endTime: '',
    routeCompliance: {
      routeFollowed: '',
      speedCompliance: true,
      trafficRulesCompliance: true,
      stopsCompliance: true,
      routeNotes: ''
    },
    testResults: {
      overallResult: '',
      mechanicalIssues: [],
      performanceIssues: [],
      safetyConcerns: [],
      additionalFindings: '',
      recommendations: ''
    }
  });

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
      console.error('Error fetching service orders:', err);
    }
  };

  const handleOrderSelect = async (order) => {
    setSelectedOrder(order);
    await fetchQCStatus(order._id);
  };

  const fetchQCStatus = async (serviceOrderId) => {
    try {
      const response = await axios.get(`http://localhost:5000/foreman/service-orders/${serviceOrderId}/qc-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQcStatus(response.data);
    } catch (err) {
      console.error('Error fetching QC status:', err);
    }
  };

  const fetchRoadTestDetails = async (serviceOrderId) => {
    try {
      const response = await axios.get(`http://localhost:5000/foreman/service-orders/${serviceOrderId}/road-test`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoadTestDetails(response.data);
    } catch (err) {
      console.error('Error fetching road test details:', err);
    }
  };

  // 5.1 Conduct QC Inspection
  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/foreman/service-orders/${selectedOrder._id}/qc-inspection`, 
        inspectionForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowInspectionModal(false);
      fetchServiceOrdersForQC();
      setInspectionForm({
        inspectionType: 'Initial QC',
        inspectionItems: inspectionForm.inspectionItems.map(item => ({ ...item, status: '', notes: '' })),
        overallStatus: '',
        issuesFound: [],
        recommendations: [],
        roadTestRequired: false
      });
    } catch (err) {
      console.error('Error submitting inspection:', err);
    }
  };

  const updateInspectionItem = (index, field, value) => {
    const updatedItems = [...inspectionForm.inspectionItems];
    updatedItems[index][field] = value;
    setInspectionForm({ ...inspectionForm, inspectionItems: updatedItems });
  };

  // 5.2 Road Test (If Required)
  const handleRoadTestCheck = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/foreman/service-orders/${selectedOrder._id}/road-test/authorization`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.authorized) {
        setRoadTestDetails(response.data.roadTest);
        setShowRoadTestModal(true);
      } else {
        alert('Road test not yet authorized by SA or Manager');
      }
    } catch (err) {
      console.error('Error checking road test authorization:', err);
    }
  };

  const handleRoadTestSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/foreman/service-orders/${selectedOrder._id}/road-test`, 
        roadTestForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowRoadTestModal(false);
      fetchServiceOrdersForQC();
      setRoadTestForm({
        testerName: '',
        startTime: '',
        endTime: '',
        routeCompliance: {
          routeFollowed: '',
          speedCompliance: true,
          trafficRulesCompliance: true,
          stopsCompliance: true,
          routeNotes: ''
        },
        testResults: {
          overallResult: '',
          mechanicalIssues: [],
          performanceIssues: [],
          safetyConcerns: [],
          additionalFindings: '',
          recommendations: ''
        }
      });
    } catch (err) {
      console.error('Error submitting road test:', err);
    }
  };

  // 5.3 QC Completion
  const handleForemanSign = async () => {
    try {
      await axios.post(`http://localhost:5000/foreman/service-orders/${selectedOrder._id}/sign`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQCStatus(selectedOrder._id);
      alert('Service Order signed by foreman successfully');
    } catch (err) {
      console.error('Error signing service order:', err);
    }
  };

  const handleTechnicianCounterSign = async () => {
    try {
      await axios.post(`http://localhost:5000/foreman/service-orders/${selectedOrder._id}/counter-sign`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQCStatus(selectedOrder._id);
      alert('Technician counter-signed successfully');
    } catch (err) {
      console.error('Error with technician counter-signature:', err);
    }
  };

  return (
    <div className="container mt-5">
      <h1>Foreman Dashboard - Quality Checking</h1>
      
      {/* Service Orders List */}
      <div className="row mt-4">
        <div className="col-md-6">
          <h3>Service Orders for QC</h3>
          <div className="list-group">
            {serviceOrders.map(order => (
              <button
                key={order._id}
                className={`list-group-item list-group-item-action ${selectedOrder?._id === order._id ? 'active' : ''}`}
                onClick={() => handleOrderSelect(order)}
              >
                <div className="d-flex w-100 justify-content-between">
                  <h6 className="mb-1">SO #{order._id}</h6>
                  <small className="text-muted">{order.status}</small>
                </div>
                <p className="mb-1">{order.vehicleId?.make} {order.vehicleId?.model} ({order.vehicleId?.plateNumber})</p>
                <small>Customer: {order.customerId?.name}</small>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Order Details */}
        <div className="col-md-6">
          {selectedOrder && (
            <>
              <h3>Service Order Details</h3>
              <div className="card">
                <div className="card-body">
                  <h5>Vehicle Information</h5>
                  <p><strong>Vehicle:</strong> {selectedOrder.vehicleId?.make} {selectedOrder.vehicleId?.model} ({selectedOrder.vehicleId?.plateNumber})</p>
                  <p><strong>Year:</strong> {selectedOrder.vehicleId?.year}</p>
                  
                  <h5>Customer Information</h5>
                  <p><strong>Name:</strong> {selectedOrder.customerId?.name}</p>
                  <p><strong>Phone:</strong> {selectedOrder.customerId?.phone}</p>
                  
                  <h5>Service Details</h5>
                  <p><strong>Status:</strong> <span className="badge bg-info">{selectedOrder.status}</span></p>
                  <p><strong>Technician:</strong> {selectedOrder.technicianId?.name}</p>
                  
                  {/* Action Buttons */}
                  <div className="mt-4">
                    <button 
                      className="btn btn-primary me-2" 
                      onClick={() => setShowInspectionModal(true)}
                    >
                      Conduct QC Inspection
                    </button>
                    
                    {selectedOrder.status === 'Waiting Road Test' && (
                      <button 
                        className="btn btn-warning me-2" 
                        onClick={handleRoadTestCheck}
                      >
                        Log Road Test
                      </button>
                    )}
                    
                    <button 
                      className="btn btn-success me-2" 
                      onClick={handleForemanSign}
                      disabled={qcStatus?.foremanSignature?.signed}
                    >
                      {qcStatus?.foremanSignature?.signed ? 'Signed ✓' : 'Sign Service Order'}
                    </button>
                  </div>
                </div>
              </div>

              {/* QC Status Display */}
              {qcStatus && (
                <div className="card mt-3">
                  <div className="card-body">
                    <h5>QC Status</h5>
                    <p><strong>Status:</strong> <span className="badge bg-secondary">{qcStatus.status}</span></p>
                    <p><strong>Overall Result:</strong> <span className="badge bg-info">{qcStatus.overallStatus}</span></p>
                    <p><strong>Foreman Signed:</strong> {qcStatus.foremanSignature?.signed ? '✓ Yes' : '✗ No'}</p>
                    <p><strong>Technician Counter-Signed:</strong> {qcStatus.technicianCounterSignature?.signed ? '✓ Yes' : '✗ No'}</p>
                    
                    {qcStatus.roadTestRequired && (
                      <p><strong>Road Test Required:</strong> ✓ Yes</p>
                    )}
                    
                    {qcStatus.issuesFound && qcStatus.issuesFound.length > 0 && (
                      <div>
                        <strong>Issues Found:</strong>
                        <ul>
                          {qcStatus.issuesFound.map((issue, index) => (
                            <li key={index}>{issue.description} ({issue.severity})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* QC Inspection Modal */}
      {showInspectionModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">QC Inspection - {selectedOrder?.vehicleId?.make} {selectedOrder?.vehicleId?.model}</h5>
                <button type="button" className="btn-close" onClick={() => setShowInspectionModal(false)}></button>
              </div>
              <form onSubmit={handleInspectionSubmit}>
                <div className="modal-body">
                  <div className="row">
                    {inspectionForm.inspectionItems.map((item, index) => (
                      <div key={index} className="col-md-6 mb-3">
                        <label className="form-label">{item.itemName}</label>
                        <select 
                          className="form-select mb-2" 
                          value={item.status} 
                          onChange={(e) => updateInspectionItem(index, 'status', e.target.value)}
                          required
                        >
                          <option value="">Select Status</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                          <option value="Needs Attention">Needs Attention</option>
                        </select>
                        <textarea 
                          className="form-control" 
                          placeholder="Notes (optional)"
                          value={item.notes}
                          onChange={(e) => updateInspectionItem(index, 'notes', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <label className="form-label">Overall Status</label>
                    <select 
                      className="form-select" 
                      value={inspectionForm.overallStatus} 
                      onChange={(e) => setInspectionForm({...inspectionForm, overallStatus: e.target.value})}
                      required
                    >
                      <option value="">Select Overall Status</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="Requires Road Test">Requires Road Test</option>
                      <option value="Pending Technician Review">Pending Technician Review</option>
                    </select>
                  </div>
                  
                  <div className="form-check mt-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="roadTestRequired"
                      checked={inspectionForm.roadTestRequired}
                      onChange={(e) => setInspectionForm({...inspectionForm, roadTestRequired: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="roadTestRequired">
                      Road Test Required
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInspectionModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Inspection</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Road Test Modal */}
      {showRoadTestModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Road Test - {selectedOrder?.vehicleId?.make} {selectedOrder?.vehicleId?.model}</h5>
                <button type="button" className="btn-close" onClick={() => setShowRoadTestModal(false)}></button>
              </div>
              <form onSubmit={handleRoadTestSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Tester Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={roadTestForm.testerName}
                        onChange={(e) => setRoadTestForm({...roadTestForm, testerName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Route Followed</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={roadTestForm.routeCompliance.routeFollowed}
                        onChange={(e) => setRoadTestForm({
                          ...roadTestForm, 
                          routeCompliance: {...roadTestForm.routeCompliance, routeFollowed: e.target.value}
                        })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <label className="form-label">Start Time</label>
                      <input 
                        type="datetime-local" 
                        className="form-control" 
                        value={roadTestForm.startTime}
                        onChange={(e) => setRoadTestForm({...roadTestForm, startTime: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">End Time</label>
                      <input 
                        type="datetime-local" 
                        className="form-control" 
                        value={roadTestForm.endTime}
                        onChange={(e) => setRoadTestForm({...roadTestForm, endTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="form-label">Overall Result</label>
                    <select 
                      className="form-select" 
                      value={roadTestForm.testResults.overallResult} 
                      onChange={(e) => setRoadTestForm({
                        ...roadTestForm, 
                        testResults: {...roadTestForm.testResults, overallResult: e.target.value}
                      })}
                      required
                    >
                      <option value="">Select Result</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="Needs Review">Needs Review</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRoadTestModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Road Test</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForemanDashboard;
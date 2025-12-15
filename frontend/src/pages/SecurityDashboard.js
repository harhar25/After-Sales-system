import React, { useState, useEffect } from 'react';
import {
  scanGatepass,
  validateSignature,
  releaseVehicle,
  getGatepassValidationStatus,
  getPendingGatepasses
} from '../services/api';

const SecurityDashboard = ({ token, user }) => {
  const [activeTab, setActiveTab] = useState('scan');
  const [gatepassNumber, setGatepassNumber] = useState('');
  const [scannedGatepass, setScannedGatepass] = useState(null);
  const [signatureValidation, setSignatureValidation] = useState(null);
  const [pendingGatepasses, setPendingGatepasses] = useState([]);
  const [selectedGatepass, setSelectedGatepass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingGatepasses();
    }
  }, [activeTab]);

  // Scan gatepass barcode
  const handleScanGatepass = async (e) => {
    e.preventDefault();
    if (!gatepassNumber.trim()) {
      setMessage('Please enter a gatepass number');
      return;
    }

    setLoading(true);
    try {
      const response = await scanGatepass(gatepassNumber.trim());
      if (response.data) {
        setScannedGatepass(response.data.gatepass);
        setSignatureValidation(response.data.signatureValidation);
        setMessage(response.data.message);
        
        // Clear form
        setGatepassNumber('');
      }
    } catch (error) {
      setMessage('Error scanning gatepass: ' + (error.response?.data?.message || error.message));
      setScannedGatepass(null);
      setSignatureValidation(null);
    }
    setLoading(false);
  };

  // Validate signature for a specific role
  const handleValidateSignature = async (signatureType) => {
    if (!scannedGatepass || !scannedGatepass._id) {
      setMessage('No gatepass selected');
      return;
    }

    setLoading(true);
    try {
      const response = await validateSignature(scannedGatepass._id, signatureType);
      if (response.data) {
        setMessage(response.data.message);
        setSignatureValidation(response.data.signatureValidation);
        
        // Refresh the gatepass data
        const statusResponse = await getGatepassValidationStatus(scannedGatepass._id);
        if (statusResponse.data) {
          setScannedGatepass(statusResponse.data.gatepass);
        }
      }
    } catch (error) {
      setMessage('Error validating signature: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  // Release vehicle after all signatures are validated
  const handleReleaseVehicle = async () => {
    if (!scannedGatepass || !scannedGatepass._id) {
      setMessage('No gatepass selected');
      return;
    }

    if (!signatureValidation?.isValid) {
      setMessage('Cannot release vehicle - missing required signatures');
      return;
    }

    if (!window.confirm('Are you sure you want to release this vehicle?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await releaseVehicle(scannedGatepass._id);
      if (response.data) {
        setMessage(response.data.message);
        setScannedGatepass(response.data.gatepass);
        setSignatureValidation({
          isValid: true,
          cashierSignature: true,
          accountingSignature: true,
          warrantySignature: true,
          serviceManagerSignature: true
        });
      }
    } catch (error) {
      setMessage('Error releasing vehicle: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  // Fetch pending gatepasses based on user role
  const fetchPendingGatepasses = async () => {
    setLoading(true);
    try {
      const response = await getPendingGatepasses();
      if (response.data) {
        setPendingGatepasses(response.data.gatepasses || []);
        setMessage(`Found ${response.data.count} pending gatepasses for your role`);
      }
    } catch (error) {
      setMessage('Error fetching pending gatepasses: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  // Select gatepass from pending list
  const handleSelectGatepass = async (gatepass) => {
    setLoading(true);
    try {
      const response = await getGatepassValidationStatus(gatepass._id);
      if (response.data) {
        setScannedGatepass(response.data.gatepass);
        setSignatureValidation(response.data.signatureValidation);
        setSelectedGatepass(gatepass);
        setActiveTab('scan');
        setMessage(`Loaded gatepass: ${gatepass.gatepassNumber}`);
      }
    } catch (error) {
      setMessage('Error loading gatepass details: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  // Render signature validation status
  const renderSignatureValidation = () => {
    if (!signatureValidation) return null;

    const signatures = [
      { key: 'cashierSignature', label: 'Cashier Signature', required: true },
      { key: 'accountingSignature', label: 'Accounting Signature', required: true },
      { key: 'warrantySignature', label: 'Warranty Signature', required: scannedGatepass?.warrantySignature?.isRequired },
      { key: 'serviceManagerSignature', label: 'Service Manager Signature', required: true }
    ];

    return (
      <div className="card mt-3">
        <div className="card-header">
          <h5>Signature Validation Status</h5>
        </div>
        <div className="card-body">
          <div className="row">
            {signatures.map((sig) => (
              (sig.required || signatureValidation[sig.key] !== undefined) && (
                <div key={sig.key} className="col-md-6 mb-3">
                  <div className={`p-3 border rounded ${signatureValidation[sig.key] ? 'border-success' : 'border-danger'}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">{sig.label}</span>
                      <span className={`badge ${signatureValidation[sig.key] ? 'bg-success' : 'bg-danger'}`}>
                        {signatureValidation[sig.key] ? 'Validated' : 'Pending'}
                      </span>
                    </div>
                    {!signatureValidation[sig.key] && (
                      <small className="text-muted">
                        Role: {getRoleForSignature(sig.key)}
                      </small>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
          
          <div className="alert alert-info mt-3">
            <strong>Overall Status:</strong> {signatureValidation.isValid ? 'All required signatures validated - Ready for vehicle release' : 'Missing required signatures'}
          </div>

          {/* Action buttons based on user role and validation status */}
          {renderActionButtons()}
        </div>
      </div>
    );
  };

  // Get role required for signature type
  const getRoleForSignature = (signatureType) => {
    const roles = {
      'cashierSignature': 'Cashier',
      'accountingSignature': 'Accounting',
      'warrantySignature': 'Warranty Officer',
      'serviceManagerSignature': 'Service Manager'
    };
    return roles[signatureType] || 'Unknown';
  };

  // Render action buttons based on user role
  const renderActionButtons = () => {
    if (!user || !user.role) return null;

    const buttons = [];

    // Add validation buttons based on user role
    if (user.role === 'Cashier' && !signatureValidation?.cashierSignature) {
      buttons.push(
        <button
          key="validate-cashier"
          className="btn btn-warning me-2"
          onClick={() => handleValidateSignature('cashier')}
          disabled={loading}
        >
          Validate Cashier Signature
        </button>
      );
    }

    if (user.role === 'Accounting' && !signatureValidation?.accountingSignature) {
      buttons.push(
        <button
          key="validate-accounting"
          className="btn btn-info me-2"
          onClick={() => handleValidateSignature('accounting')}
          disabled={loading}
        >
          Validate Accounting Signature
        </button>
      );
    }

    if ((user.role === 'Warranty Officer' || user.role === 'Service Manager') && 
        scannedGatepass?.warrantySignature?.isRequired && 
        !signatureValidation?.warrantySignature) {
      buttons.push(
        <button
          key="validate-warranty"
          className="btn btn-secondary me-2"
          onClick={() => handleValidateSignature('warranty')}
          disabled={loading}
        >
          Validate Warranty Signature
        </button>
      );
    }

    if ((user.role === 'Service Manager' || user.role === 'Admin') && !signatureValidation?.serviceManagerSignature) {
      buttons.push(
        <button
          key="validate-manager"
          className="btn btn-primary me-2"
          onClick={() => handleValidateSignature('serviceManager')}
          disabled={loading}
        >
          Validate Manager Signature
        </button>
      );
    }

    // Add vehicle release button for Security role
    if ((user.role === 'Security' || user.role === 'Admin') && signatureValidation?.isValid && !scannedGatepass?.vehicleReleased) {
      buttons.push(
        <button
          key="release-vehicle"
          className="btn btn-success"
          onClick={handleReleaseVehicle}
          disabled={loading}
        >
          🚗 Release Vehicle
        </button>
      );
    }

    return buttons.length > 0 ? (
      <div className="mt-3">
        <h6>Actions Available:</h6>
        {buttons}
      </div>
    ) : null;
  };

  // Render gatepass scanning form
  const renderScanGatepass = () => (
    <div className="tab-content">
      <h3>Scan Gatepass</h3>
      
      <div className="card mb-4">
        <div className="card-header">
          <h5>Gatepass Scanner</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleScanGatepass}>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Gatepass Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={gatepassNumber}
                  onChange={(e) => setGatepassNumber(e.target.value)}
                  placeholder="Enter or scan gatepass number..."
                  disabled={loading}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">&nbsp;</label>
                <button 
                  type="submit" 
                  className="btn btn-primary d-block w-100"
                  disabled={loading || !gatepassNumber.trim()}
                >
                  {loading ? 'Scanning...' : 'Scan Gatepass'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Gatepass Details */}
      {scannedGatepass && (
        <div className="card mb-3">
          <div className="card-header">
            <h5>Gatepass Details - {scannedGatepass.gatepassNumber}</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>Customer:</strong> {scannedGatepass.customerName}</p>
                <p><strong>Vehicle:</strong> {scannedGatepass.vehiclePlateNumber} - {scannedGatepass.vehicleModel}</p>
                <p><strong>Total Amount:</strong> ₱{scannedGatepass.totalAmount?.toLocaleString()}</p>
                <p><strong>Payment Status:</strong> 
                  <span className={`badge ms-2 ${
                    scannedGatepass.paymentStatus === 'Paid' ? 'bg-success' : 
                    scannedGatepass.paymentStatus === 'Warranty' ? 'bg-info' : 'bg-warning'
                  }`}>
                    {scannedGatepass.paymentStatus}
                  </span>
                </p>
              </div>
              <div className="col-md-6">
                <p><strong>Issue Date:</strong> {new Date(scannedGatepass.issueDate).toLocaleString()}</p>
                <p><strong>Expiry Date:</strong> {new Date(scannedGatepass.expiryDate).toLocaleString()}</p>
                <p><strong>Document Status:</strong> 
                  <span className={`badge ms-2 ${
                    scannedGatepass.documentStatus === 'Completed' ? 'bg-success' :
                    scannedGatepass.documentStatus === 'Signed' ? 'bg-info' : 'bg-warning'
                  }`}>
                    {scannedGatepass.documentStatus}
                  </span>
                </p>
                <p><strong>Vehicle Released:</strong> 
                  <span className={`badge ms-2 ${scannedGatepass.vehicleReleased ? 'bg-success' : 'bg-secondary'}`}>
                    {scannedGatepass.vehicleReleased ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderSignatureValidation()}
    </div>
  );

  // Render pending gatepasses
  const renderPendingGatepasses = () => (
    <div className="tab-content">
      <h3>Pending Gatepasses</h3>
      
      <div className="mb-3">
        <button className="btn btn-outline-primary" onClick={fetchPendingGatepasses} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {pendingGatepasses.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Gatepass Number</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Payment Status</th>
                <th>Document Status</th>
                <th>Issue Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingGatepasses.map((gatepass) => (
                <tr key={gatepass._id}>
                  <td>{gatepass.gatepassNumber}</td>
                  <td>{gatepass.customerName}</td>
                  <td>{gatepass.vehiclePlateNumber}</td>
                  <td>
                    <span className={`badge ${
                      gatepass.paymentStatus === 'Paid' ? 'bg-success' : 
                      gatepass.paymentStatus === 'Warranty' ? 'bg-info' : 'bg-warning'
                    }`}>
                      {gatepass.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      gatepass.documentStatus === 'Completed' ? 'bg-success' :
                      gatepass.documentStatus === 'Signed' ? 'bg-info' : 'bg-warning'
                    }`}>
                      {gatepass.documentStatus}
                    </span>
                  </td>
                  <td>{new Date(gatepass.issueDate).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleSelectGatepass(gatepass)}
                      disabled={loading}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info">
          No pending gatepasses found for your role.
        </div>
      )}
    </div>
  );

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-12">
          <h1>Security Dashboard - Gate Validation System</h1>
          <p className="text-muted">User: {user?.name} ({user?.role})</p>
          
          {/* Navigation Tabs */}
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'scan' ? 'active' : ''}`}
                onClick={() => setActiveTab('scan')}
              >
                🔍 Scan Gatepass
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                📋 Pending Gatepasses
              </button>
            </li>
          </ul>

          {/* Messages */}
          {loading && <div className="alert alert-info mt-3">Processing...</div>}
          {message && (
            <div className={`alert alert-${message.includes('Error') ? 'danger' : 'success'} mt-3`}>
              {message}
            </div>
          )}

          {/* Tab Content */}
          <div className="tab-content mt-3">
            {activeTab === 'scan' && renderScanGatepass()}
            {activeTab === 'pending' && renderPendingGatepasses()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
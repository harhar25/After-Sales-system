import React, { useState, useEffect } from 'react';
import {
  getServiceOrders,
  getSchedulingOrder,
  customerCheckIn,
  uploadCISData,
  initiateVehicleReportCard,
  updateVehicleReportCard,
  convertSchedulingOrder,
  createWalkInServiceOrder,
  checkWarrantyStatus,
  printDocuments,
  getDocumentLogs
} from '../services/api';

const ServiceAdvisorDashboard = ({ token }) => {
  const [serviceOrders, setServiceOrders] = useState([]);
  const [schedulingOrders, setSchedulingOrders] = useState([]);
  const [vehicleReportCards, setVehicleReportCards] = useState([]);
  const [documentLogs, setDocumentLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('checkin');
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState(null);
  const [vrcData, setVrcData] = useState({
    checklistItems: [
      { item: 'Engine Oil Level', status: '', notes: '' },
      { item: 'Brake Fluid Level', status: '', notes: '' },
      { item: 'Coolant Level', status: '', notes: '' },
      { item: 'Battery Condition', status: '', notes: '' },
      { item: 'Tire Pressure', status: '', notes: '' },
      { item: 'Windshield Wipers', status: '', notes: '' },
      { item: 'Headlights/Taillights', status: '', notes: '' },
      { item: 'Horn Function', status: '', notes: '' },
      { item: 'Air Conditioning', status: '', notes: '' },
      { item: 'Interior/Exterior Cleanliness', status: '', notes: '' }
    ],
    internalFindings: {
      engine: '',
      transmission: '',
      brakes: '',
      suspension: '',
      electrical: '',
      other: ''
    },
    externalFindings: {
      body: '',
      paint: '',
      tires: '',
      lights: '',
      glass: '',
      other: ''
    },
    customerSettingsConfirmed: false,
    settingsRestored: {
      radio: true,
      aircon: true,
      seats: true,
      mirrors: true,
      other: ''
    }
  });

  useEffect(() => {
    fetchServiceOrders();
  }, []);

  const fetchServiceOrders = async () => {
    try {
      setLoading(true);
      const response = await getServiceOrders();
      setServiceOrders(response.data);
    } catch (err) {
      console.error('Error fetching service orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulingOrder = async (customerId, appointmentId) => {
    try {
      setLoading(true);
      const response = await getSchedulingOrder(customerId, appointmentId);
      setSchedulingOrders([response.data]);
    } catch (err) {
      console.error('Error fetching scheduling order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCheckIn = async (id) => {
    try {
      setLoading(true);
      await customerCheckIn(id);
      await fetchServiceOrders();
      alert('Customer checked in successfully!');
    } catch (err) {
      console.error('Error checking in customer:', err);
      alert('Error checking in customer');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCIS = async (serviceOrderId, cisData) => {
    try {
      setLoading(true);
      await uploadCISData(serviceOrderId, cisData);
      await fetchServiceOrders();
      alert('CIS data uploaded successfully!');
    } catch (err) {
      console.error('Error uploading CIS data:', err);
      alert('Error uploading CIS data');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateVRC = async (serviceOrderId, vehicleId, customerId) => {
    try {
      setLoading(true);
      const response = await initiateVehicleReportCard({
        serviceOrderId,
        vehicleId,
        customerId
      });
      setVehicleReportCards([response.data]);
      alert('Vehicle Report Card initiated successfully!');
    } catch (err) {
      console.error('Error initiating VRC:', err);
      alert('Error initiating Vehicle Report Card');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVRC = async (vrcId) => {
    try {
      setLoading(true);
      const response = await updateVehicleReportCard(vrcId, vrcData);
      setVehicleReportCards([response.data]);
      alert('Vehicle Report Card updated successfully!');
    } catch (err) {
      console.error('Error updating VRC:', err);
      alert('Error updating Vehicle Report Card');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertSchedulingOrder = async (appointmentId, isWarranty, partsNeeded) => {
    try {
      setLoading(true);
      const response = await convertSchedulingOrder(appointmentId, {
        isWarranty,
        partsNeeded
      });
      await fetchServiceOrders();
      alert('Scheduling Order converted to Service Order successfully!');
    } catch (err) {
      console.error('Error converting scheduling order:', err);
      alert('Error converting scheduling order');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWalkInOrder = async (orderData) => {
    try {
      setLoading(true);
      const response = await createWalkInServiceOrder(orderData);
      await fetchServiceOrders();
      alert('Walk-in Service Order created successfully!');
    } catch (err) {
      console.error('Error creating walk-in order:', err);
      alert('Error creating walk-in service order');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintDocuments = async (serviceOrderId) => {
    try {
      setLoading(true);
      const documentTypes = [
        'ServiceOrder',
        'ServiceOrderConfirmation',
        'ServicePicklist',
        'VehicleReportCard',
        'CIS'
      ];
      const response = await printDocuments(serviceOrderId, documentTypes, 1);
      await fetchDocumentLogs(serviceOrderId);
      alert('Documents printed successfully!');
    } catch (err) {
      console.error('Error printing documents:', err);
      alert('Error printing documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentLogs = async (serviceOrderId) => {
    try {
      const response = await getDocumentLogs(serviceOrderId);
      setDocumentLogs(response.data);
    } catch (err) {
      console.error('Error fetching document logs:', err);
    }
  };

  const updateChecklistItem = (index, field, value) => {
    const updated = [...vrcData.checklistItems];
    updated[index] = { ...updated[index], [field]: value };
    setVrcData({ ...vrcData, checklistItems: updated });
  };

  const updateInternalFinding = (field, value) => {
    setVrcData({
      ...vrcData,
      internalFindings: { ...vrcData.internalFindings, [field]: value }
    });
  };

  const updateExternalFinding = (field, value) => {
    setVrcData({
      ...vrcData,
      externalFindings: { ...vrcData.externalFindings, [field]: value }
    });
  };

  const renderCheckInTab = () => (
    <div className="tab-pane active">
      <h3>2.1 Customer Check-In</h3>
      <div className="row">
        <div className="col-md-6">
          <h5>Scheduled Orders</h5>
          <div className="form-group">
            <label>Customer ID:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter customer ID"
              onChange={(e) => setSelectedCustomer(e.target.value)}
            />
            <button
              className="btn btn-primary mt-2"
              onClick={() => fetchSchedulingOrder(selectedCustomer)}
            >
              Retrieve Scheduling Order
            </button>
          </div>
          {schedulingOrders.map(order => (
            <div key={order._id} className="card mt-3">
              <div className="card-body">
                <h6>Scheduling Order: {order.slipNumber}</h6>
                <p>Customer: {order.customerId?.name}</p>
                <p>Vehicle: {order.vehicleId?.plateNo}</p>
                <button
                  className="btn btn-success"
                  onClick={() => handleCustomerCheckIn(order._id)}
                  disabled={loading}
                >
                  Customer Arrived - Time In
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="col-md-6">
          <h5>Active Service Orders</h5>
          {serviceOrders.filter(order => order.status === 'Scheduled').map(order => (
            <div key={order._id} className="card mt-3">
              <div className="card-body">
                <h6>Service Order: {order._id}</h6>
                <p>Customer: {order.customerId?.name}</p>
                <p>Vehicle: {order.vehicleId?.plateNo}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleCustomerCheckIn(order._id)}
                  disabled={loading}
                >
                  Check In
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCISTab = () => (
    <div className="tab-pane active">
      <h3>2.2 Receive CIS / Appointment Slip</h3>
      {serviceOrders.filter(order => order.status === 'Checked In').map(order => (
        <div key={order._id} className="card mt-3">
          <div className="card-body">
            <h6>Service Order: {order._id}</h6>
            <p>Customer: {order.customerId?.name}</p>
            <p>Vehicle: {order.vehicleId?.plateNo}</p>
            <button
              className="btn btn-info"
              onClick={() => handleUploadCIS(order._id, {
                slipNumber: 'CIS-' + Date.now(),
                servicesRequested: ['General Service'],
                customerNotes: 'Customer request'
              })}
              disabled={loading}
            >
              Upload/Verify CIS Data
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderVehicleDiagnosisTab = () => (
    <div className="tab-pane active">
      <h3>2.3 Vehicle Diagnosis</h3>
      <div className="row">
        <div className="col-md-6">
          <h5>Initiate Vehicle Report Card</h5>
          {serviceOrders.filter(order => order.status === 'Checked In').map(order => (
            <div key={order._id} className="card mt-3">
              <div className="card-body">
                <h6>Service Order: {order._id}</h6>
                <p>Vehicle: {order.vehicleId?.plateNo}</p>
                <button
                  className="btn btn-warning"
                  onClick={() => handleInitiateVRC(order._id, order.vehicleId._id, order.customerId._id)}
                  disabled={loading}
                >
                  Request Key & Initiate VRC
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="col-md-6">
          <h5>10-Point Checklist</h5>
          {vrcData.checklistItems.map((item, index) => (
            <div key={index} className="card mt-2">
              <div className="card-body">
                <h6>{item.item}</h6>
                <select
                  className="form-control mb-2"
                  value={item.status}
                  onChange={(e) => updateChecklistItem(index, 'status', e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="Good">Good</option>
                  <option value="Needs Attention">Needs Attention</option>
                  <option value="Replace">Replace</option>
                </select>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Notes"
                  value={item.notes}
                  onChange={(e) => updateChecklistItem(index, 'notes', e.target.value)}
                />
              </div>
            </div>
          ))}
          <h5 className="mt-4">Internal Findings</h5>
          {Object.keys(vrcData.internalFindings).map(key => (
            <div key={key} className="form-group">
              <label>{key.charAt(0).toUpperCase() + key.slice(1)}:</label>
              <textarea
                className="form-control"
                value={vrcData.internalFindings[key]}
                onChange={(e) => updateInternalFinding(key, e.target.value)}
              />
            </div>
          ))}
          <h5 className="mt-4">External Findings</h5>
          {Object.keys(vrcData.externalFindings).map(key => (
            <div key={key} className="form-group">
              <label>{key.charAt(0).toUpperCase() + key.slice(1)}:</label>
              <textarea
                className="form-control"
                value={vrcData.externalFindings[key]}
                onChange={(e) => updateExternalFinding(key, e.target.value)}
              />
            </div>
          ))}
          <div className="form-group mt-4">
            <label>
              <input
                type="checkbox"
                checked={vrcData.customerSettingsConfirmed}
                onChange={(e) => setVrcData({
                  ...vrcData,
                  customerSettingsConfirmed: e.target.checked
                })}
              />
              All settings restored to customer defaults
            </label>
          </div>
          {vehicleReportCards.map(vrc => (
            <button
              key={vrc._id}
              className="btn btn-success mt-3"
              onClick={() => handleUpdateVRC(vrc._id)}
              disabled={loading || !vrcData.customerSettingsConfirmed}
            >
              Save Vehicle Report Card
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderServiceOrderCreationTab = () => (
    <div className="tab-pane active">
      <h3>2.4 Service Order Creation</h3>
      <div className="row">
        <div className="col-md-6">
          <h5>Convert Scheduling Order to Service Order</h5>
          {schedulingOrders.map(order => (
            <div key={order._id} className="card mt-3">
              <div className="card-body">
                <h6>Scheduling Order: {order.slipNumber}</h6>
                <div className="form-group">
                  <label>
                    <input type="checkbox" /> Warranty Service
                  </label>
                </div>
                <div className="form-group">
                  <label>Parts Needed (comma-separated):</label>
                  <input type="text" className="form-control" placeholder="Oil Filter, Air Filter" />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleConvertSchedulingOrder(order._id, false, [])}
                  disabled={loading}
                >
                  Convert to Service Order
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="col-md-6">
          <h5>Create Walk-in Service Order</h5>
          <div className="card mt-3">
            <div className="card-body">
              <button
                className="btn btn-success"
                onClick={() => handleCreateWalkInOrder({
                  customerId: selectedCustomer,
                  vehicleId: 'vehicle_id_here',
                  servicesRequested: ['Walk-in Service'],
                  customerNotes: 'Customer walk-in'
                })}
                disabled={loading}
              >
                Create New Walk-in Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentPrintingTab = () => (
    <div className="tab-pane active">
      <h3>2.5 Document Printing</h3>
      {serviceOrders.filter(order => ['Checked In', 'In Progress'].includes(order.status)).map(order => (
        <div key={order._id} className="card mt-3">
          <div className="card-body">
            <h6>Service Order: {order._id}</h6>
            <p>Customer: {order.customerId?.name}</p>
            <p>Vehicle: {order.vehicleId?.plateNo}</p>
            <button
              className="btn btn-info"
              onClick={() => handlePrintDocuments(order._id)}
              disabled={loading}
            >
              Print All Documents
            </button>
            <button
              className="btn btn-secondary ml-2"
              onClick={() => fetchDocumentLogs(order._id)}
            >
              View Document Logs
            </button>
          </div>
        </div>
      ))}
      {documentLogs.length > 0 && (
        <div className="mt-4">
          <h5>Document Logs</h5>
          {documentLogs.map(log => (
            <div key={log._id} className="card">
              <div className="card-body">
                <p>Document Type: {log.documentType}</p>
                <p>Status: {log.status}</p>
                <p>Printed At: {new Date(log.printedAt).toLocaleString()}</p>
                <p>Copies: {log.copies}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mt-4">
      <h1>Service Advisor Dashboard - Customer Arrival Module</h1>
      
      <ul className="nav nav-tabs mt-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'checkin' ? 'active' : ''}`}
            onClick={() => setActiveTab('checkin')}
          >
            2.1 Customer Check-In
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'cis' ? 'active' : ''}`}
            onClick={() => setActiveTab('cis')}
          >
            2.2 CIS/Appointment Slip
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'diagnosis' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagnosis')}
          >
            2.3 Vehicle Diagnosis
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'creation' ? 'active' : ''}`}
            onClick={() => setActiveTab('creation')}
          >
            2.4 Service Order Creation
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'printing' ? 'active' : ''}`}
            onClick={() => setActiveTab('printing')}
          >
            2.5 Document Printing
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">
        {activeTab === 'checkin' && renderCheckInTab()}
        {activeTab === 'cis' && renderCISTab()}
        {activeTab === 'diagnosis' && renderVehicleDiagnosisTab()}
        {activeTab === 'creation' && renderServiceOrderCreationTab()}
        {activeTab === 'printing' && renderDocumentPrintingTab()}
      </div>

      {loading && (
        <div className="text-center mt-3">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceAdvisorDashboard;
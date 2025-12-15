import React, { useState, useEffect } from 'react';
import {
  getPmsDueList,
  contactCustomer,
  updateContactStatus,
  checkAvailability,
  createServiceSchedulingOrder,
  searchCustomer,
  createCustomer,
  createWalkInSchedulingOrder,
  getContactLogs
} from '../services/api';

const CRODashboard = ({ token }) => {
  const [activeTab, setActiveTab] = useState('pms-due');
  const [pmsDueList, setPmsDueList] = useState([]);
  const [filteredPmsList, setFilteredPmsList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [contactLogs, setContactLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Step 1.3 - Walk-in customer search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [searchResult, setSearchResult] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    contactInfo: '',
    address: ''
  });
  const [newVehicle, setNewVehicle] = useState({
    plateNo: '',
    makeModel: '',
    currentMileage: 0
  });

  useEffect(() => {
    if (activeTab === 'pms-due') {
      fetchPmsDueList();
    }
  }, [activeTab]);

  // Step 1.1: Fetch PMS Due List
  const fetchPmsDueList = async () => {
    setLoading(true);
    try {
      const response = await getPmsDueList();
      if (response.data.success) {
        setPmsDueList(response.data.report);
        setFilteredPmsList(response.data.report);
        setMessage(`Found ${response.data.totalRecords} vehicles due for PMS service`);
      }
    } catch (error) {
      setMessage('Error fetching PMS due list: ' + error.message);
    }
    setLoading(false);
  };

  // Filter PMS list by priority
  const filterByPriority = (priority) => {
    if (priority === 'all') {
      setFilteredPmsList(pmsDueList);
    } else {
      setFilteredPmsList(pmsDueList.filter(item => item.priority === priority));
    }
  };

  // Step 1.2: Contact Customer
  const handleContactCustomer = async (customer, contactType) => {
    setLoading(true);
    try {
      const response = await contactCustomer({
        customerId: customer.customerId,
        vehicleId: customer.vehicleId,
        contactType,
        notes: `Contacted for PMS service - ${contactType}`
      });
      
      if (response.data.success) {
        setMessage(`Customer contacted successfully via ${contactType}`);
        setSelectedCustomer(customer);
        // Refresh contact logs for this customer
        if (customer.customerId) {
          fetchContactLogs(customer.customerId);
        }
      }
    } catch (error) {
      setMessage('Error contacting customer: ' + error.message);
    }
    setLoading(false);
  };

  // Fetch contact logs for customer
  const fetchContactLogs = async (customerId) => {
    try {
      const response = await getContactLogs(customerId);
      if (response.data.success) {
        setContactLogs(response.data.contactLogs);
      }
    } catch (error) {
      console.error('Error fetching contact logs:', error);
    }
  };

  // Check availability and schedule appointment
  const handleScheduleAppointment = async (customer, preferredDateTime) => {
    setLoading(true);
    try {
      // First check availability
      const availabilityResponse = await checkAvailability({ preferredDateTime });
      
      if (availabilityResponse.data.success) {
        const { availableBays, availableTechnicians, availableSAs } = availabilityResponse.data;
        
        if (availableBays === 0 || availableTechnicians === 0 || availableSAs === 0) {
          setMessage('No availability for the requested time slot');
          return;
        }

        // Create service scheduling order
        const schedulingResponse = await createServiceSchedulingOrder({
          customerId: customer.customerId,
          vehicleId: customer.vehicleId,
          scheduledDateTime: preferredDateTime,
          bayId: 'available-bay-id', // This would be selected from available bays
          saId: 'available-sa-id',   // This would be selected from available SAs
          serviceType: 'PMS'
        });

        if (schedulingResponse.data.success) {
          setMessage('Appointment scheduled successfully!');
          fetchPmsDueList(); // Refresh the list
        }
      }
    } catch (error) {
      setMessage('Error scheduling appointment: ' + error.message);
    }
    setLoading(false);
  };

  // Step 1.3: Search Customer
  const handleSearchCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await searchCustomer(searchTerm, searchBy);
      if (response.data.success) {
        setSearchResult(response.data.customer);
        if (response.data.customer) {
          setMessage('Customer found');
        } else {
          setMessage('Customer not found - ready to register');
        }
      }
    } catch (error) {
      setMessage('Error searching customer: ' + error.message);
    }
    setLoading(false);
  };

  // Create new customer
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createCustomer(newCustomer);
      if (response.data.success) {
        setMessage('Customer registered successfully!');
        setSearchResult(response.data.customer);
        setNewCustomer({ name: '', contactInfo: '', address: '' });
      }
    } catch (error) {
      setMessage('Error creating customer: ' + error.message);
    }
    setLoading(false);
  };

  // Create walk-in scheduling order
  const handleWalkInScheduling = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createWalkInSchedulingOrder({
        customerId: searchResult._id,
        vehicleData: newVehicle,
        preferredDateTime: new Date(),
        serviceType: 'Walk-in Service'
      });

      if (response.data.success) {
        setMessage('Walk-in service scheduled successfully!');
        setNewVehicle({ plateNo: '', makeModel: '', currentMileage: 0 });
      }
    } catch (error) {
      setMessage('Error scheduling walk-in service: ' + error.message);
    }
    setLoading(false);
  };

  const renderPmsDueList = () => (
    <div className="tab-content">
      <h3>PMS Due List</h3>
      <div className="mb-3">
        <button className="btn btn-outline-primary me-2" onClick={() => filterByPriority('all')}>
          All ({pmsDueList.length})
        </button>
        <button className="btn btn-outline-danger me-2" onClick={() => filterByPriority('High')}>
          High Priority ({pmsDueList.filter(item => item.priority === 'High').length})
        </button>
        <button className="btn btn-outline-warning me-2" onClick={() => filterByPriority('Medium')}>
          Medium Priority ({pmsDueList.filter(item => item.priority === 'Medium').length})
        </button>
        <button className="btn btn-outline-info" onClick={fetchPmsDueList}>
          Refresh
        </button>
      </div>
      
      {loading && <div className="alert alert-info">Loading...</div>}
      {message && <div className="alert alert-success">{message}</div>}
      
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Vehicle</th>
              <th>Plate No</th>
              <th>Last Service</th>
              <th>Next Due</th>
              <th>Days Until Due</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPmsList.map((item, index) => (
              <tr key={index}>
                <td>{item.customerName}</td>
                <td>{item.contactInfo}</td>
                <td>{item.makeModel}</td>
                <td>{item.plateNo}</td>
                <td>{item.lastServiceDate ? new Date(item.lastServiceDate).toLocaleDateString() : 'Never'}</td>
                <td>{item.nextServiceDueDate ? new Date(item.nextServiceDueDate).toLocaleDateString() : 'Unknown'}</td>
                <td>{item.daysUntilDue || 'N/A'}</td>
                <td>
                  <span className={`badge bg-${item.priority === 'High' ? 'danger' : item.priority === 'Medium' ? 'warning' : 'secondary'}`}>
                    {item.priority}
                  </span>
                </td>
                <td>
                  <div className="btn-group" role="group">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleContactCustomer(item, 'call')}
                      disabled={loading}
                    >
                      Call
                    </button>
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => handleContactCustomer(item, 'sms')}
                      disabled={loading}
                    >
                      SMS
                    </button>
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={() => {
                        const datetime = prompt('Enter appointment date and time (YYYY-MM-DD HH:MM):');
                        if (datetime) {
                          handleScheduleAppointment(item, new Date(datetime));
                        }
                      }}
                      disabled={loading}
                    >
                      Schedule
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContactLogs = () => (
    <div className="tab-content">
      <h3>Contact Logs</h3>
      {contactLogs.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Contact Type</th>
                <th>Status</th>
                <th>Vehicle</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {contactLogs.map((log, index) => (
                <tr key={index}>
                  <td>{new Date(log.attemptedDateTime).toLocaleString()}</td>
                  <td>{log.contactType}</td>
                  <td>
                    <span className={`badge bg-${log.status === 'successful' ? 'success' : 'warning'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>{log.vehicleId ? `${log.vehicleId.plateNo} - ${log.vehicleId.makeModel}` : 'N/A'}</td>
                  <td>{log.notes || 'No notes'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No contact logs found.</p>
      )}
    </div>
  );

  const renderWalkInCustomer = () => (
    <div className="tab-content">
      <h3>Walk-In Customer Registration</h3>
      
      {/* Search Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>Search Customer</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSearchCustomer} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Search By</label>
              <select 
                className="form-select" 
                value={searchBy} 
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="contact">Contact Number</option>
                <option value="plateNo">Plate Number</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Search Term</label>
              <input 
                type="text" 
                className="form-control" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter search term..."
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">&nbsp;</label>
              <button type="submit" className="btn btn-primary d-block w-100" disabled={loading}>
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Search Result */}
      {searchResult && (
        <div className="alert alert-success">
          <h6>Customer Found:</h6>
          <p><strong>Name:</strong> {searchResult.name}</p>
          <p><strong>Contact:</strong> {searchResult.contactInfo}</p>
          <p><strong>Address:</strong> {searchResult.address}</p>
        </div>
      )}

      {/* New Customer Registration */}
      {!searchResult && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Register New Customer</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateCustomer}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Contact Info *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newCustomer.contactInfo}
                    onChange={(e) => setNewCustomer({...newCustomer, contactInfo: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Address *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="mt-3">
                <button type="submit" className="btn btn-success" disabled={loading}>
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Information */}
      {searchResult && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Vehicle Information</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleWalkInScheduling}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Plate Number *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newVehicle.plateNo}
                    onChange={(e) => setNewVehicle({...newVehicle, plateNo: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Make & Model *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newVehicle.makeModel}
                    onChange={(e) => setNewVehicle({...newVehicle, makeModel: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Current Mileage</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newVehicle.currentMileage}
                    onChange={(e) => setNewVehicle({...newVehicle, currentMileage: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="mt-3">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Schedule Walk-in Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <div className="alert alert-info">Processing...</div>}
      {message && <div className="alert alert-success">{message}</div>}
    </div>
  );

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-12">
          <h1>CRO Dashboard - Customer Appointment & Scheduling</h1>
          
          {/* Navigation Tabs */}
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'pms-due' ? 'active' : ''}`}
                onClick={() => setActiveTab('pms-due')}
              >
                1.1 PMS Due List
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`}
                onClick={() => setActiveTab('contact')}
              >
                1.2 Contact & Schedule
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'walk-in' ? 'active' : ''}`}
                onClick={() => setActiveTab('walk-in')}
              >
                1.3 Walk-in Registration
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="tab-content mt-3">
            {activeTab === 'pms-due' && renderPmsDueList()}
            {activeTab === 'contact' && renderContactLogs()}
            {activeTab === 'walk-in' && renderWalkInCustomer()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRODashboard;
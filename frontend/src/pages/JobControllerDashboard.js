import React, { useState, useEffect } from 'react';
import {
  getActiveServiceOrders,
  getAvailableTechnicians,
  assignTechnician,
  clockInTechnician,
  clockOutTechnician,
  getTechnicianAssignments,
  getLaborTracking,
  completeAssignment
} from '../services/api';

const JobControllerDashboard = ({ token }) => {
  const [activeServiceOrders, setActiveServiceOrders] = useState([]);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
  const [technicianAssignments, setTechnicianAssignments] = useState([]);
  const [selectedServiceOrder, setSelectedServiceOrder] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [activeTab, setActiveTab] = useState('assignment');
  const [loading, setLoading] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [workPerformed, setWorkPerformed] = useState([]);

  useEffect(() => {
    fetchActiveServiceOrders();
    fetchAvailableTechnicians();
    fetchTechnicianAssignments();
  }, []);

  const fetchActiveServiceOrders = async () => {
    try {
      setLoading(true);
      const response = await getActiveServiceOrders();
      setActiveServiceOrders(response.data);
    } catch (err) {
      console.error('Error fetching active service orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTechnicians = async () => {
    try {
      const response = await getAvailableTechnicians();
      setAvailableTechnicians(response.data);
    } catch (err) {
      console.error('Error fetching available technicians:', err);
    }
  };

  const fetchTechnicianAssignments = async () => {
    try {
      const response = await getTechnicianAssignments();
      setTechnicianAssignments(response.data);
    } catch (err) {
      console.error('Error fetching technician assignments:', err);
    }
  };

  const handleAssignTechnician = async (serviceOrderId) => {
    if (!selectedTechnician) {
      alert('Please select a technician');
      return;
    }

    try {
      setLoading(true);
      const assignmentData = {
        technicianId: selectedTechnician,
        estimatedHours: parseFloat(estimatedHours) || 0,
        notes: assignmentNotes
      };

      await assignTechnician(serviceOrderId, assignmentData);
      
      // Reset form
      setSelectedTechnician(null);
      setEstimatedHours('');
      setAssignmentNotes('');
      
      // Refresh data
      await fetchActiveServiceOrders();
      await fetchAvailableTechnicians();
      await fetchTechnicianAssignments();
      
      alert('Technician assigned successfully!');
    } catch (err) {
      console.error('Error assigning technician:', err);
      alert('Error assigning technician');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (assignmentId) => {
    try {
      setLoading(true);
      await clockInTechnician(assignmentId);
      await fetchTechnicianAssignments();
      alert('Technician clocked in successfully!');
    } catch (err) {
      console.error('Error clocking in:', err);
      alert('Error clocking in technician');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async (assignmentId) => {
    try {
      setLoading(true);
      const workData = {
        workPerformed: workPerformed.filter(item => item.trim() !== '')
      };
      
      await clockOutTechnician(assignmentId, workData);
      
      // Reset work performed
      setWorkPerformed([]);
      await fetchTechnicianAssignments();
      alert('Technician clocked out successfully!');
    } catch (err) {
      console.error('Error clocking out:', err);
      alert('Error clocking out technician');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAssignment = async (assignmentId) => {
    try {
      setLoading(true);
      await completeAssignment(assignmentId);
      await fetchTechnicianAssignments();
      await fetchAvailableTechnicians();
      alert('Assignment completed successfully!');
    } catch (err) {
      console.error('Error completing assignment:', err);
      alert('Error completing assignment');
    } finally {
      setLoading(false);
    }
  };

  const addWorkPerformed = () => {
    setWorkPerformed([...workPerformed, '']);
  };

  const updateWorkPerformed = (index, value) => {
    const updated = [...workPerformed];
    updated[index] = value;
    setWorkPerformed(updated);
  };

  const removeWorkPerformed = (index) => {
    const updated = workPerformed.filter((_, i) => i !== index);
    setWorkPerformed(updated);
  };

  const renderAssignmentTab = () => (
    <div className="tab-pane active">
      <h3>3.1 Technician Assignment</h3>
      <div className="row">
        <div className="col-md-6">
          <h5>Active Service Orders</h5>
          {activeServiceOrders.map(order => (
            <div key={order._id} className="card mt-3">
              <div className="card-body">
                <h6>Service Order: {order._id}</h6>
                <p><strong>Customer:</strong> {order.customerId?.name}</p>
                <p><strong>Vehicle:</strong> {order.vehicleId?.plateNo}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Services:</strong> {order.cisData?.servicesRequested?.join(', ') || 'N/A'}</p>
                
                {order.technicianId ? (
                  <div className="alert alert-info">
                    <strong>Assigned to:</strong> {order.technicianId.name}
                  </div>
                ) : (
                  <div className="assignment-form">
                    <div className="form-group">
                      <label>Select Technician:</label>
                      <select
                        className="form-control"
                        value={selectedServiceOrder === order._id ? selectedTechnician : ''}
                        onChange={(e) => {
                          setSelectedServiceOrder(order._id);
                          setSelectedTechnician(e.target.value);
                        }}
                      >
                        <option value="">Choose Technician</option>
                        {availableTechnicians.map(tech => (
                          <option key={tech._id} value={tech._id}>
                            {tech.name} - {tech.skills?.join(', ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Estimated Hours:</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter estimated hours"
                        value={selectedServiceOrder === order._id ? estimatedHours : ''}
                        onChange={(e) => {
                          setSelectedServiceOrder(order._id);
                          setEstimatedHours(e.target.value);
                        }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Assignment Notes:</label>
                      <textarea
                        className="form-control"
                        placeholder="Enter assignment notes"
                        value={selectedServiceOrder === order._id ? assignmentNotes : ''}
                        onChange={(e) => {
                          setSelectedServiceOrder(order._id);
                          setAssignmentNotes(e.target.value);
                        }}
                      />
                    </div>
                    
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAssignTechnician(order._id)}
                      disabled={loading || !selectedTechnician}
                    >
                      Assign Technician
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="col-md-6">
          <h5>Available Technicians</h5>
          {availableTechnicians.map(tech => (
            <div key={tech._id} className="card mt-3">
              <div className="card-body">
                <h6>{tech.name}</h6>
                <p><strong>Status:</strong> <span className="badge badge-success">{tech.currentStatus}</span></p>
                <p><strong>Skills:</strong> {tech.skills?.join(', ') || 'N/A'}</p>
                <p><strong>Rating:</strong> {tech.rating}/5 ⭐</p>
                <p><strong>Completed Jobs:</strong> {tech.completedJobs}</p>
                <p><strong>Schedule:</strong> {tech.availabilitySchedule}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLaborTrackingTab = () => (
    <div className="tab-pane active">
      <h3>Labor Tracking & Clock-In/Out</h3>
      {technicianAssignments.map(assignment => (
        <div key={assignment._id} className="card mt-3">
          <div className="card-body">
            <h6>Assignment: {assignment._id}</h6>
            <p><strong>Service Order:</strong> {assignment.serviceOrderId?._id}</p>
            <p><strong>Technician:</strong> {assignment.technicianId?.name}</p>
            <p><strong>Status:</strong> {assignment.status}</p>
            <p><strong>Estimated Hours:</strong> {assignment.estimatedHours}</p>
            <p><strong>Actual Hours:</strong> {assignment.actualHours || 0}</p>
            
            {assignment.laborTrackingId && (
              <div className="labor-tracking-info">
                <p><strong>Clock In:</strong> {assignment.laborTrackingId.clockInTime ? 
                  new Date(assignment.laborTrackingId.clockInTime).toLocaleString() : 'Not clocked in'}</p>
                <p><strong>Clock Out:</strong> {assignment.laborTrackingId.clockOutTime ? 
                  new Date(assignment.laborTrackingId.clockOutTime).toLocaleString() : 'Not clocked out'}</p>
                <p><strong>Total Worked Hours:</strong> {assignment.laborTrackingId.totalWorkedHours || 0}</p>
                <p><strong>Status:</strong> {assignment.laborTrackingId.status}</p>
                
                {assignment.laborTrackingId.workPerformed && assignment.laborTrackingId.workPerformed.length > 0 && (
                  <div>
                    <strong>Work Performed:</strong>
                    <ul>
                      {assignment.laborTrackingId.workPerformed.map((work, index) => (
                        <li key={index}>{work}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="button-group mt-3">
                  {!assignment.laborTrackingId.clockInTime || assignment.laborTrackingId.clockOutTime ? (
                    <button
                      className="btn btn-success mr-2"
                      onClick={() => handleClockIn(assignment._id)}
                      disabled={loading}
                    >
                      Clock In
                    </button>
                  ) : (
                    <button
                      className="btn btn-warning mr-2"
                      onClick={() => handleClockOut(assignment._id)}
                      disabled={loading}
                    >
                      Clock Out
                    </button>
                  )}
                  
                  {assignment.status !== 'Completed' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleCompleteAssignment(assignment._id)}
                      disabled={loading}
                    >
                      Complete Assignment
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mt-4">
      <h1>Job Controller Dashboard - Technician Assignment Module</h1>
      
      <ul className="nav nav-tabs mt-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'assignment' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignment')}
          >
            3.1 Technician Assignment
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'tracking' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracking')}
          >
            Labor Tracking
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">
        {activeTab === 'assignment' && renderAssignmentTab()}
        {activeTab === 'tracking' && renderLaborTrackingTab()}
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

export default JobControllerDashboard;
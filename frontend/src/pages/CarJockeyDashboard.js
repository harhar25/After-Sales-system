import React, { useState, useEffect } from 'react';
import {
  getJockeyDashboard,
  generateCarWashInstruction,
  startTask,
  completeTask,
  logVehicleMovement,
  manageKey,
  getTaskHistory
} from '../services/api';

const CarJockeyDashboard = ({ token }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [taskHistory, setTaskHistory] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [carWashForm, setCarWashForm] = useState({
    serviceOrderId: '',
    washType: 'Standard',
    specialNotes: '',
    estimatedDuration: 30
  });
  
  const [taskCompletionForm, setTaskCompletionForm] = useState({
    completionNotes: '',
    keyReturned: false,
    currentLocation: ''
  });
  
  const [vehicleMovementForm, setVehicleMovementForm] = useState({
    fromLocation: '',
    toLocation: '',
    notes: ''
  });

  useEffect(() => {
    fetchDashboardData();
    fetchTaskHistory();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getJockeyDashboard();
      setDashboardData(response.data.data);
    } catch (err) {
      console.error('Error fetching jockey dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskHistory = async (page = 1) => {
    try {
      const response = await getTaskHistory(page);
      setTaskHistory(response.data.tasks);
    } catch (err) {
      console.error('Error fetching task history:', err);
    }
  };

  const handleGenerateCarWashInstruction = async (e) => {
    e.preventDefault();
    if (!carWashForm.serviceOrderId) {
      alert('Please enter Service Order ID');
      return;
    }

    try {
      setLoading(true);
      await generateCarWashInstruction(carWashForm);
      
      // Reset form
      setCarWashForm({
        serviceOrderId: '',
        washType: 'Standard',
        specialNotes: '',
        estimatedDuration: 30
      });
      
      // Refresh dashboard data
      await fetchDashboardData();
      alert('Move to Car Wash instruction generated successfully!');
    } catch (err) {
      console.error('Error generating car wash instruction:', err);
      alert('Error generating car wash instruction');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      setLoading(true);
      await startTask(taskId);
      await fetchDashboardData();
      alert('Task started successfully!');
    } catch (err) {
      console.error('Error starting task:', err);
      alert('Error starting task');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setLoading(true);
      await completeTask(taskId, taskCompletionForm);
      
      // Reset form
      setTaskCompletionForm({
        completionNotes: '',
        keyReturned: false,
        currentLocation: ''
      });
      setSelectedTask(null);
      
      // Refresh dashboard data
      await fetchDashboardData();
      alert('Task completed successfully!');
    } catch (err) {
      console.error('Error completing task:', err);
      alert('Error completing task');
    } finally {
      setLoading(false);
    }
  };

  const handleLogVehicleMovement = async (transferId) => {
    try {
      setLoading(true);
      await logVehicleMovement(transferId, vehicleMovementForm);
      
      // Reset form
      setVehicleMovementForm({
        fromLocation: '',
        toLocation: '',
        notes: ''
      });
      
      alert('Vehicle movement logged successfully!');
    } catch (err) {
      console.error('Error logging vehicle movement:', err);
      alert('Error logging vehicle movement');
    } finally {
      setLoading(false);
    }
  };

  const handleManageKey = async (taskId, action) => {
    try {
      setLoading(true);
      await manageKey(taskId, { action });
      await fetchDashboardData();
      alert(`Key ${action}ed successfully!`);
    } catch (err) {
      console.error('Error managing key:', err);
      alert('Error managing key');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboardTab = () => (
    <div className="tab-pane active">
      <div className="row">
        <div className="col-md-12">
          <h3>Car Jockey Dashboard</h3>
          
          {dashboardData && (
            <div className="summary-cards row">
              <div className="col-md-4">
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <h5>Pending Tasks</h5>
                    <h3>{dashboardData.summary.pendingTasks}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-warning text-white">
                  <div className="card-body">
                    <h5>In Progress Tasks</h5>
                    <h3>{dashboardData.summary.inProgressTasks}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-success text-white">
                  <div className="card-body">
                    <h5>Available Car Wash Instructions</h5>
                    <h3>{dashboardData.summary.availableCarWashInstructions}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <h5>Active Tasks</h5>
          {dashboardData?.activeTasks?.map(task => (
            <div key={task._id} className="card mt-3">
              <div className="card-body">
                <h6>Task: {task.taskType}</h6>
                <p><strong>Service Order:</strong> {task.serviceOrderId?._id}</p>
                <p><strong>Vehicle:</strong> {task.vehicleId?.plateNo}</p>
                <p><strong>From:</strong> {task.currentLocation}</p>
                <p><strong>To:</strong> {task.targetLocation}</p>
                <p><strong>Status:</strong> <span className={`badge badge-${task.status === 'Pending' ? 'warning' : 'primary'}`}>{task.status}</span></p>
                <p><strong>Key Status:</strong> {task.keyStatus}</p>
                
                <div className="button-group">
                  {task.status === 'Pending' && (
                    <button
                      className="btn btn-success btn-sm mr-2"
                      onClick={() => handleStartTask(task._id)}
                      disabled={loading}
                    >
                      Start Task
                    </button>
                  )}
                  
                  <button
                    className="btn btn-info btn-sm mr-2"
                    onClick={() => {
                      setSelectedTask(task._id);
                      setTaskCompletionForm({
                        completionNotes: '',
                        keyReturned: task.taskType === 'Return Key',
                        currentLocation: task.targetLocation
                      });
                    }}
                    disabled={loading}
                  >
                    Complete Task
                  </button>
                  
                  {task.keyStatus === 'Not Received' && (
                    <button
                      className="btn btn-secondary btn-sm mr-2"
                      onClick={() => handleManageKey(task._id, 'receive')}
                      disabled={loading}
                    >
                      Receive Key
                    </button>
                  )}
                  
                  {task.keyStatus === 'With Jockey' && (
                    <button
                      className="btn btn-secondary btn-sm mr-2"
                      onClick={() => handleManageKey(task._id, 'return')}
                      disabled={loading}
                    >
                      Return Key
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-md-6">
          <h5>Recent Completed Tasks</h5>
          {dashboardData?.completedTasks?.map(task => (
            <div key={task._id} className="card mt-3">
              <div className="card-body">
                <h6>Task: {task.taskType}</h6>
                <p><strong>Service Order:</strong> {task.serviceOrderId?._id}</p>
                <p><strong>Vehicle:</strong> {task.vehicleId?.plateNo}</p>
                <p><strong>Completed:</strong> {new Date(task.completedTime).toLocaleString()}</p>
                <p><strong>Key Status:</strong> {task.keyStatus}</p>
                {task.completionNotes && (
                  <p><strong>Notes:</strong> {task.completionNotes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCarWashInstructionsTab = () => (
    <div className="tab-pane active">
      <h3>Move to Car Wash Instructions</h3>
      
      <div className="row">
        <div className="col-md-6">
          <h5>Available Instructions</h5>
          {dashboardData?.carWashInstructions?.map(instruction => (
            <div key={instruction._id} className="card mt-3">
              <div className="card-body">
                <h6>Car Wash: {instruction.serviceOrderId?._id}</h6>
                <p><strong>Vehicle:</strong> {instruction.vehicleId?.plateNo}</p>
                <p><strong>Wash Type:</strong> {instruction.carWashInstructions?.washType}</p>
                <p><strong>Estimated Duration:</strong> {instruction.carWashInstructions?.estimatedDuration} minutes</p>
                {instruction.carWashInstructions?.specialNotes && (
                  <p><strong>Special Notes:</strong> {instruction.carWashInstructions.specialNotes}</p>
                )}
                <p><strong>Priority:</strong> <span className={`badge badge-${instruction.priority === 'High' ? 'danger' : instruction.priority === 'Medium' ? 'warning' : 'secondary'}`}>{instruction.priority}</span></p>
              </div>
            </div>
          ))}
        </div>

        <div className="col-md-6">
          <h5>Generate New Instruction</h5>
          <div className="card mt-3">
            <div className="card-body">
              <form onSubmit={handleGenerateCarWashInstruction}>
                <div className="form-group">
                  <label>Service Order ID:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={carWashForm.serviceOrderId}
                    onChange={(e) => setCarWashForm({...carWashForm, serviceOrderId: e.target.value})}
                    placeholder="Enter Service Order ID"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Wash Type:</label>
                  <select
                    className="form-control"
                    value={carWashForm.washType}
                    onChange={(e) => setCarWashForm({...carWashForm, washType: e.target.value})}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Deluxe">Deluxe</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Estimated Duration (minutes):</label>
                  <input
                    type="number"
                    className="form-control"
                    value={carWashForm.estimatedDuration}
                    onChange={(e) => setCarWashForm({...carWashForm, estimatedDuration: parseInt(e.target.value)})}
                    min="15"
                    max="120"
                  />
                </div>
                
                <div className="form-group">
                  <label>Special Notes:</label>
                  <textarea
                    className="form-control"
                    value={carWashForm.specialNotes}
                    onChange={(e) => setCarWashForm({...carWashForm, specialNotes: e.target.value})}
                    placeholder="Enter any special instructions"
                    rows="3"
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Generate Car Wash Instruction
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaskHistoryTab = () => (
    <div className="tab-pane active">
      <h3>Task History</h3>
      
      {taskHistory.map(task => (
        <div key={task._id} className="card mt-3">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Task: {task.taskType}</h6>
                <p><strong>Service Order:</strong> {task.serviceOrderId?._id}</p>
                <p><strong>Vehicle:</strong> {task.vehicleId?.plateNo}</p>
                <p><strong>From:</strong> {task.currentLocation}</p>
                <p><strong>To:</strong> {task.targetLocation}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Status:</strong> <span className={`badge badge-${task.status === 'Completed' ? 'success' : 'warning'}`}>{task.status}</span></p>
                <p><strong>Assigned:</strong> {new Date(task.assignedTime).toLocaleString()}</p>
                {task.completedTime && (
                  <p><strong>Completed:</strong> {new Date(task.completedTime).toLocaleString()}</p>
                )}
                <p><strong>Key Status:</strong> {task.keyStatus}</p>
                {task.completionNotes && (
                  <p><strong>Notes:</strong> {task.completionNotes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Task Completion Modal
  const renderTaskCompletionModal = () => {
    if (!selectedTask) return null;
    
    const task = dashboardData?.activeTasks?.find(t => t._id === selectedTask);
    if (!task) return null;

    return (
      <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Complete Task: {task.taskType}</h5>
              <button
                type="button"
                className="close"
                onClick={() => setSelectedTask(null)}
              >
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label>Current Location:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={taskCompletionForm.currentLocation}
                    onChange={(e) => setTaskCompletionForm({...taskCompletionForm, currentLocation: e.target.value})}
                    placeholder="Enter current location"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Completion Notes:</label>
                  <textarea
                    className="form-control"
                    value={taskCompletionForm.completionNotes}
                    onChange={(e) => setTaskCompletionForm({...taskCompletionForm, completionNotes: e.target.value})}
                    placeholder="Enter completion notes"
                    rows="3"
                  />
                </div>
                
                {task.taskType === 'Return Key' && (
                  <div className="form-group">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="keyReturned"
                        checked={taskCompletionForm.keyReturned}
                        onChange={(e) => setTaskCompletionForm({...taskCompletionForm, keyReturned: e.target.checked})}
                      />
                      <label className="form-check-label" htmlFor="keyReturned">
                        Key has been returned
                      </label>
                    </div>
                  </div>
                )}
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleCompleteTask(selectedTask)}
                disabled={loading}
              >
                Complete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <h1>Car Jockey Dashboard - Vehicle Transfer Module</h1>
      
      <ul className="nav nav-tabs mt-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'carwash' ? 'active' : ''}`}
            onClick={() => setActiveTab('carwash')}
          >
            Car Wash Instructions
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Task History
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'carwash' && renderCarWashInstructionsTab()}
        {activeTab === 'history' && renderTaskHistoryTab()}
      </div>

      {renderTaskCompletionModal()}

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

export default CarJockeyDashboard;
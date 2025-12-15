import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CRODashboard from './pages/CRODashboard';
import ServiceAdvisorDashboard from './pages/ServiceAdvisorDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import ForemanDashboard from './pages/ForemanDashboard';
import CashierDashboard from './pages/CashierDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Decode token to get user info, or fetch user
      // For simplicity, assume user is stored or decode JWT
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const ProtectedRoute = ({ children, role }) => {
    if (!token) return <Navigate to="/" />;
    if (user && user.role !== role) return <Navigate to={`/${user.role.toLowerCase()}`} />;
    return children;
  };

  return (
    <Router>
      <div className="App">
        {token && (
          <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
              <span className="navbar-brand">After-Sales System</span>
              <button className="btn btn-outline-danger" onClick={handleLogout}>Logout</button>
            </div>
          </nav>
        )}
        <Routes>
          <Route path="/" element={<Login setUser={setUser} setToken={setToken} />} />
          <Route path="/cro" element={<ProtectedRoute role="CRO"><CRODashboard token={token} /></ProtectedRoute>} />
          <Route path="/sa" element={<ProtectedRoute role="SA"><ServiceAdvisorDashboard token={token} /></ProtectedRoute>} />
          <Route path="/technician" element={<ProtectedRoute role="Technician"><TechnicianDashboard token={token} /></ProtectedRoute>} />
          <Route path="/foreman" element={<ProtectedRoute role="Foreman"><ForemanDashboard token={token} /></ProtectedRoute>} />
          <Route path="/cashier" element={<ProtectedRoute role="Cashier"><CashierDashboard token={token} /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

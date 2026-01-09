import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole) {
    // Allow both 'admin' and 'teacher' roles to access admin routes
    // (teachers are admins in this system)
    const allowedRoles = requiredRole === 'admin' ? ['admin', 'teacher'] : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      return (
        <div className="access-denied">
          <div className="access-denied-content">
            <h2>🚫 Access Denied</h2>
            <p>You don't have permission to access this page.</p>
            <p>Required role: <strong>{requiredRole === 'admin' ? 'Admin or Teacher' : requiredRole}</strong></p>
            <p>Your role: <strong>{user.role}</strong></p>
            <button 
              className="btn-primary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;

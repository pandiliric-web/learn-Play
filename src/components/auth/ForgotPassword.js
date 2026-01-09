import React, { useState } from 'react';
import './AuthForms.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ForgotPassword = ({ onBackToLogin, onResetSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to send password reset code' }));
        setError(errorData.message || 'Failed to send password reset code');
        return;
      }

      const data = await response.json();
      setSuccess(data.message || 'If an account exists with this email, a password reset code has been sent.');
      
      // Call callback after a delay to show success message
      setTimeout(() => {
        if (onResetSent) {
          onResetSent(email);
        }
      }, 2000);

    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Network error. Please check if the server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Forgot Password?</h2>
      <p className="auth-subtitle">Enter your email address and we'll send you a verification code to reset your password</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            required
            placeholder="Enter your email address"
            disabled={loading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message" style={{ color: '#28a745', marginBottom: '15px' }}>{success}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </form>

      <div className="auth-switch">
        <p>
          <button type="button" onClick={onBackToLogin} className="link-btn" disabled={loading}>
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;


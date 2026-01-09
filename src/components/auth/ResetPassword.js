import React, { useState, useEffect } from 'react';
import './AuthForms.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ResetPassword = ({ email, onPasswordReset, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordRequirement, setPasswordRequirement] = useState('medium');

  const getPasswordRequirement = () => {
    try {
      const saved = localStorage.getItem('learnplay-settings');
      if (!saved) return 'medium';
      const parsed = JSON.parse(saved);
      return parsed.passwordRequirements || 'medium';
    } catch (_err) {
      return 'medium';
    }
  };

  // Update password requirement when component mounts or settings change
  useEffect(() => {
    const updateRequirement = () => {
      const requirement = getPasswordRequirement();
      setPasswordRequirement(requirement);
    };

    updateRequirement();
    
    // Listen for custom event (when admin saves settings in same tab)
    const handleSettingsUpdate = () => {
      updateRequirement();
    };
    
    // Listen for storage changes (when admin saves settings in different tab)
    const handleStorageChange = (e) => {
      if (e.key === 'learnplay-settings') {
        updateRequirement();
      }
    };
    
    window.addEventListener('learnplay-settings-updated', handleSettingsUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('learnplay-settings-updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getPasswordPlaceholder = () => {
    switch (passwordRequirement) {
      case 'strong':
        return 'Min. 8 chars with number & symbol';
      case 'medium':
        return 'Min. 8 characters';
      case 'easy':
        return 'Min. 6 characters';
      default:
        return 'Min. 8 characters';
    }
  };

  const validatePassword = (pwd) => {
    if (passwordRequirement === 'strong') {
      const hasLength = pwd.length >= 8;
      const hasNumber = /\d/.test(pwd);
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
      if (!hasLength || !hasNumber || !hasSymbol) {
        return 'Password must be at least 8 characters and include a number and a symbol';
      }
      return '';
    }
    if (passwordRequirement === 'medium') {
      if (pwd.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      return '';
    }
    // easy
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.otp.trim()) {
      setError('Please enter the verification code');
      setLoading(false);
      return;
    }

    if (formData.otp.length !== 6) {
      setError('Verification code must be 6 digits');
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          otp: formData.otp,
          newPassword: formData.newPassword,
          passwordRequirement: passwordRequirement
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to reset password' }));
        setError(errorData.message || 'Failed to reset password');
        return;
      }

      const data = await response.json();
      setSuccess(data.message || 'Password has been reset successfully!');
      
      // Call callback after showing success message
      setTimeout(() => {
        if (onPasswordReset) {
          onPasswordReset();
        }
      }, 2000);

    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Network error. Please check if the server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setFormData({
        ...formData,
        otp: value
      });
      setError('');
    }
  };

  return (
    <div className="auth-form">
      <h2>Reset Your Password</h2>
      <p className="auth-subtitle">Enter the verification code sent to {email}</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="otp">Verification Code</label>
          <input
            type="text"
            id="otp"
            name="otp"
            value={formData.otp}
            onChange={handleOtpChange}
            required
            placeholder="Enter 6-digit code"
            maxLength="6"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            placeholder={getPasswordPlaceholder()}
            minLength={passwordRequirement === 'easy' ? 6 : 8}
            disabled={loading}
          />
          {formData.newPassword && validatePassword(formData.newPassword) && (
            <small style={{ 
              color: '#dc3545', 
              fontSize: '0.85rem', 
              display: 'block', 
              marginTop: '0.25rem' 
            }}>
              {validatePassword(formData.newPassword)}
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm new password"
            disabled={loading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message" style={{ color: '#28a745', marginBottom: '15px' }}>{success}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading || formData.otp.length !== 6}>
          {loading ? 'Resetting Password...' : 'Reset Password'}
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

export default ResetPassword;


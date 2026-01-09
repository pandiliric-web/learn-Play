import React, { useState, useEffect } from 'react';
import './OtpVerification.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OtpVerification = ({ email, onVerificationSuccess, onBackToLogin, onResendOtp }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Automatically send OTP when component mounts
  useEffect(() => {
    const sendInitialOtp = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/otp/send-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to send verification code' }));
          setError(errorData.message || 'Failed to send verification code');
          return;
        }

        const data = await response.json();
        setSuccess('Verification code sent to your email');
        setCountdown(60); // Start cooldown for resend
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('OTP send error:', err);
        setError(err.message || 'Network error. Please check if the server is running and try again.');
      } finally {
        setLoading(false);
      }
    };

    // Only send if we have an email and this is the first load
    if (email) {
      sendInitialOtp();
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (otp.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Verification failed' }));
        setError(errorData.message || 'Verification failed');
        return;
      }

      const data = await response.json();
      setSuccess('Email verified successfully!');
      setTimeout(() => {
        onVerificationSuccess(data.user);
      }, 1500);
    } catch (err) {
      console.error('OTP verify error:', err);
      setError(err.message || 'Network error. Please check if the server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/otp/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to resend code' }));
        setError(errorData.message || 'Failed to resend code');
        return;
      }

      const data = await response.json();
      setSuccess('New verification code sent to your email');
      setCountdown(60); // 60 second cooldown
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('OTP resend error:', err);
      setError(err.message || 'Network error. Please check if the server is running and try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
      setError(''); // Clear error when user starts typing
    }
  };

  return (
    <div className="otp-verification-container">
      <div className="otp-verification-card">
        <div className="otp-header">
          <h2>Verify Your Email</h2>
          <p>We've sent a 6-digit code to</p>
          <p className="otp-email">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="otp-form">
          <div className="otp-input-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOtpChange}
              placeholder="Enter 6-digit code"
              maxLength="6"
              className="otp-input"
              disabled={loading}
            />
          </div>

          {error && <div className="otp-error">{error}</div>}
          {success && <div className="otp-success">{success}</div>}

          <button
            type="submit"
            className="otp-submit-btn"
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="otp-actions">
          <button
            type="button"
            onClick={handleResendOtp}
            className="otp-resend-btn"
            disabled={resendLoading || countdown > 0}
          >
            {resendLoading ? 'Sending...' :
             countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="otp-back-btn"
            disabled={loading}
          >
            Back to Login
          </button>
        </div>

        <div className="otp-info">
          <p>Didn't receive the code? Check your spam folder.</p>
          <p>The code expires in 10 minutes.</p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;

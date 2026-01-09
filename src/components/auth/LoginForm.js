import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import OtpVerification from './OtpVerification';
import './AuthForms.css';

const LoginForm = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const { login, completeEmailVerification } = useAuth();

  // Function to completely reset the form
  const resetForm = () => {
    setFormData({
      email: '',
      password: ''
    });
    setError('');
    
    // Force clear DOM elements
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
      emailInput.value = '';
      emailInput.setAttribute('value', '');
    }
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.setAttribute('value', '');
    }
  };

  // Clear form data when component mounts (when user logs out)
  useEffect(() => {
    resetForm();
    
    // Clear again after a short delay to handle browser autofill
    setTimeout(resetForm, 100);
  }, []);

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

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      // If email verification is required, show OTP verification
      if (result.requiresVerification) {
        setVerificationEmail(result.email || formData.email);
        setShowOtpVerification(true);
        setLoading(false);
        return;
      }
      
      // Show error message
      setError(result.error);
      
      // If account is locked, show more detailed message
      if (result.accountLocked && result.lockedUntil) {
        const lockedUntil = new Date(result.lockedUntil);
        const now = new Date();
        const minutesRemaining = Math.ceil((lockedUntil - now) / (1000 * 60));
        setError(`Account locked. Please try again in ${minutesRemaining} minute(s).`);
      }
    }
    
    setLoading(false);
  };

  const handleOtpVerificationSuccess = async (user) => {
    // Email verified successfully, complete the login process
    // This will fetch fresh user data and redirect to home
    await completeEmailVerification(user);
  };

  const handleBackToLogin = () => {
    setShowOtpVerification(false);
    setVerificationEmail('');
  };

  // Show OTP verification if email verification is required
  if (showOtpVerification) {
    return (
      <OtpVerification
        email={verificationEmail}
        onVerificationSuccess={handleOtpVerificationSuccess}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  return (
    <motion.div 
      className="auth-form"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4,
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          delay: 0.15,
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      >
        Welcome Back!
      </motion.h2>
      <motion.p 
        className="auth-subtitle"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          delay: 0.25,
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      >
        Sign in to continue learning
      </motion.p>
      
      <form onSubmit={handleSubmit}>
        <motion.div 
          className="form-group"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            delay: 0.35,
            type: "spring",
            stiffness: 300,
            damping: 28
          }}
        >
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </motion.div>

        <motion.div 
          className="form-group"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            delay: 0.45,
            type: "spring",
            stiffness: 300,
            damping: 28
          }}
        >
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            delay: 0.55,
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </motion.button>
      </form>

      <motion.div 
        className="auth-switch"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          delay: 0.65,
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      >
        <p>Don't have an account? <button type="button" onClick={onSwitchToRegister} className="link-btn">Sign Up</button></p>
        <p style={{ marginTop: '10px' }}>
          <button type="button" onClick={() => {
            if (onSwitchToForgotPassword) {
              onSwitchToForgotPassword();
            }
          }} className="link-btn" style={{ fontSize: '0.9em' }}>
            Forgot Password?
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default LoginForm;

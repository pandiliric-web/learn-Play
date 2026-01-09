import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import OtpVerification from './OtpVerification';
import './AuthForms.css';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [passwordRequirement, setPasswordRequirement] = useState('medium');
  const [passwordHint, setPasswordHint] = useState('');
  const { register, completeEmailVerification } = useAuth();

  // Read password policy from saved system settings (localStorage)
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
      
      // Set password hint based on requirement
      switch (requirement) {
        case 'strong':
          setPasswordHint('Password must be at least 8 characters and include a number and a symbol');
          break;
        case 'medium':
          setPasswordHint('Password must be at least 8 characters long');
          break;
        case 'easy':
          setPasswordHint('Password must be at least 6 characters long');
          break;
        default:
          setPasswordHint('Password must be at least 8 characters long');
      }
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

    // Check if registration is allowed
    try {
      const saved = localStorage.getItem('learnplay-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.allowRegistration === false) {
          setError('Registration is currently disabled. Please contact an administrator.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error checking registration settings:', err);
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    // Force all public registrations to be 'student' role for security
    const result = await register(formData.name, formData.email, formData.password, 'student', passwordRequirement);

    if (!result.success) {
      setError(result.error);
    } else {
      // Registration successful, show OTP verification
      setRegisteredEmail(formData.email);
      setShowOtpVerification(true);
    }

    setLoading(false);
  };

  const handleOtpVerificationSuccess = async (user) => {
    // Email verified successfully, complete the login process
    await completeEmailVerification(user);
  };

  const handleBackToLogin = () => {
    setShowOtpVerification(false);
    onSwitchToLogin();
  };

  // Show OTP verification if user just registered
  if (showOtpVerification) {
    return (
      <OtpVerification
        email={registeredEmail}
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
        Join LearnPlay!
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
        Create your account to start learning
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
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />
        </motion.div>

        <motion.div 
          className="form-group"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            delay: 0.4,
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
            placeholder={getPasswordPlaceholder()}
            minLength={passwordRequirement === 'easy' ? 6 : 8}
          />
          {passwordHint && (
            <small style={{ 
              color: '#6c757d', 
              fontSize: '0.85rem', 
              display: 'block', 
              marginTop: '0.25rem' 
            }}>
              {passwordHint}
            </small>
          )}
          {formData.password && validatePassword(formData.password) && (
            <small style={{ 
              color: '#dc3545', 
              fontSize: '0.85rem', 
              display: 'block', 
              marginTop: '0.25rem' 
            }}>
              {validatePassword(formData.password)}
            </small>
          )}
        </motion.div>

        <motion.div 
          className="form-group"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            delay: 0.5,
            type: "spring",
            stiffness: 300,
            damping: 28
          }}
        >
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
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
            delay: 0.6,
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </motion.button>
      </form>

      <motion.div 
        className="auth-switch"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          delay: 0.7,
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      >
        <p>Already have an account? <button type="button" onClick={onSwitchToLogin} className="link-btn">Sign In</button></p>
      </motion.div>
    </motion.div>
  );
};

export default RegisterForm;

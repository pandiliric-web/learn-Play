import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot-password', 'reset-password', 'otp-verification'
  const [resetEmail, setResetEmail] = useState('');
  const [siteName, setSiteName] = useState('LearnPlay');
  const [siteDescription, setSiteDescription] = useState('Lambajon Elementary School');

  // Load site settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('learnplay-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.siteName) setSiteName(parsed.siteName);
          if (parsed.siteDescription) setSiteDescription(parsed.siteDescription);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    
    loadSettings();
    
    // Listen for settings updates
    const handleUpdate = () => loadSettings();
    window.addEventListener('learnplay-settings-updated', handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'learnplay-settings') loadSettings();
    });
    
    return () => {
      window.removeEventListener('learnplay-settings-updated', handleUpdate);
    };
  }, []);

  const switchToRegister = () => {
    setView('register');
    // Clear any form data when switching
    setTimeout(() => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => form.reset());
    }, 100);
  };
  
  const switchToLogin = () => {
    setView('login');
    setResetEmail('');
    // Clear any form data when switching
    setTimeout(() => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => form.reset());
    }, 100);
  };

  const switchToForgotPassword = () => {
    setView('forgot-password');
    setResetEmail('');
  };

  const handleResetSent = (email) => {
    setResetEmail(email);
    setView('reset-password');
  };

  const handlePasswordReset = () => {
    setView('login');
    setResetEmail('');
  };

  if (!isOpen) return null;

  const renderForm = () => {
    switch (view) {
      case 'login':
        return <LoginForm onSwitchToRegister={switchToRegister} onSwitchToForgotPassword={switchToForgotPassword} />;
      case 'register':
        return <RegisterForm onSwitchToLogin={switchToLogin} />;
      case 'forgot-password':
        return <ForgotPassword onBackToLogin={switchToLogin} onResetSent={handleResetSent} />;
      case 'reset-password':
        return <ResetPassword email={resetEmail} onPasswordReset={handlePasswordReset} onBackToLogin={switchToLogin} />;
      default:
        return <LoginForm onSwitchToRegister={switchToRegister} onSwitchToForgotPassword={switchToForgotPassword} />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="auth-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="auth-modal-content"
          initial={{ scale: 0.85, opacity: 0, rotateY: -10 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.85, opacity: 0, rotateY: 10 }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 35,
            mass: 0.8
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="auth-modal-background">
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>
          </div>

          {/* Branding Header */}
          <motion.div 
            className="auth-branding"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              delay: 0.2,
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <motion.div 
              className="brand-logo"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="logo-icon">🎮</span>
            </motion.div>
            <div className="brand-text">
              <h1 className="brand-name">{siteName}</h1>
              <p className="brand-tagline">{siteDescription}</p>
            </div>
          </motion.div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ 
                rotateY: view === 'register' ? 90 : -90,
                opacity: 0,
                scale: 0.85,
                x: view === 'register' ? 50 : -50
              }}
              animate={{ 
                rotateY: 0,
                opacity: 1,
                scale: 1,
                x: 0
              }}
              exit={{ 
                rotateY: view === 'register' ? -90 : 90,
                opacity: 0,
                scale: 0.85,
                x: view === 'register' ? -50 : 50
              }}
              transition={{ 
                duration: 0.6,
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
              style={{ 
                transformStyle: "preserve-3d",
                perspective: "1000px"
              }}
            >
              {renderForm()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;

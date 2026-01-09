import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import './WelcomeNotification.css';

const WelcomeNotification = ({ pageId, title, message, icon = '👋' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  // Ensure component is mounted and document.body exists
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only show for students - always show when page loads (removed localStorage check)
    if (user && user.role === 'student') {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [pageId, user]);

  const handleClose = () => {
    setIsVisible(false);
    // Removed localStorage save - notification will show again on next visit
  };

  // Don't show if user is not a student
  if (!user || user.role !== 'student') {
    return null;
  }

  // Don't render portal if not mounted or document.body doesn't exist
  if (!mounted || typeof document === 'undefined' || !document.body) {
    return null;
  }

  // Use portal to render at document body level to avoid z-index/overflow issues
  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="welcome-notification"
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25 
          }}
        >
          <div className="notification-content">
            <div className="notification-icon">{icon}</div>
            <div className="notification-text">
              <h3 className="notification-title">{title}</h3>
              <p className="notification-message">{message}</p>
            </div>
            <button 
              className="notification-close"
              onClick={handleClose}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
          <div className="notification-progress"></div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default WelcomeNotification;


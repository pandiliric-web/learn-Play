import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import pwaManager from '../utils/pwa';
import './PWAInstaller.css';

const PWAInstaller = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if app is already installed
    setIsInstalled(pwaManager.isAppInstalled());
    
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setShowInstallPrompt(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    try {
      await pwaManager.installApp();
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error installing app:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="pwa-installer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="pwa-installer-card"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
        >
          <div className="pwa-installer-header">
            <div className="pwa-icon">📱</div>
            <h3>Install LearnPlay</h3>
            <button className="close-btn" onClick={handleDismiss}>×</button>
          </div>
          
          <div className="pwa-installer-content">
            <p>Install LearnPlay on your device for a better experience!</p>
            
            <div className="pwa-features">
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <span>Faster loading</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📱</span>
                <span>App-like experience</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🔒</span>
                <span>Offline access</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🔔</span>
                <span>Push notifications</span>
              </div>
            </div>
          </div>
          
          <div className="pwa-installer-actions">
            <button className="btn-secondary" onClick={handleDismiss}>
              Maybe Later
            </button>
            <button className="btn-primary" onClick={handleInstall}>
              Install Now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstaller;

// Offline Indicator Component
// Shows sync status and offline notifications

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import offlineSyncService from '../services/offlineSync';
import './OfflineIndicator.css';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Check if there's actually data to sync before showing message
      offlineSyncService.getSyncStatus().then(status => {
        if (status.unsyncedQuizzes > 0 || status.unsyncedGames > 0) {
          setNotificationMessage('Connection restored! Syncing data...');
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 2000);
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNotificationMessage('You are offline. Your work will be saved locally.');
      setShowNotification(true);
      // Auto-hide after 2 seconds so it doesn't block navigation
      setTimeout(() => setShowNotification(false), 2000);
    };

    // Listen for sync events
    const handleSyncEvent = (event) => {
      if (event.type === 'sync_started') {
        // Clear any existing timeout
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        setSyncStatus('syncing');
        // Auto-hide syncing status after 2 seconds max to not block navigation
        syncTimeoutRef.current = setTimeout(() => {
          setSyncStatus(null);
        }, 2000);
      } else if (event.type === 'sync_completed') {
        // Clear sync timeout if sync completes
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        setSyncStatus('synced');
        setNotificationMessage(`Synced ${event.quizCount || 0} quiz results!`);
        setShowNotification(true);
        // Auto-hide quickly so it doesn't block navigation
        setTimeout(() => {
          setSyncStatus(null);
          setShowNotification(false);
        }, 2000);
      } else if (event.type === 'sync_error') {
        setSyncStatus('error');
        setNotificationMessage('Sync failed. Will retry when online.');
        setShowNotification(true);
        // Auto-hide quickly so it doesn't block navigation
        setTimeout(() => {
          setSyncStatus(null);
          setShowNotification(false);
        }, 2000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    offlineSyncService.addSyncListener(handleSyncEvent);

    // Update sync status periodically (but don't show pending status)
    let intervalId = null;
    const timeoutId = setTimeout(() => {
      const updateSyncStatus = async () => {
        const status = await offlineSyncService.getSyncStatus();
        // Clear pending status if no unsynced items
        if (status.unsyncedQuizzes === 0 && status.unsyncedGames === 0 && syncStatus === 'pending') {
          setSyncStatus(null);
        }
      };
      
      updateSyncStatus();
      // Check less frequently - every 30 seconds
      intervalId = setInterval(updateSyncStatus, 30000);
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      offlineSyncService.removeSyncListener(handleSyncEvent);
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  // Global function for showing offline notifications
  useEffect(() => {
    window.showOfflineNotification = (message) => {
      setNotificationMessage(message);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    return () => {
      delete window.showOfflineNotification;
    };
  }, []);

  // Only show if offline, actively syncing, or showing a notification
  // Don't show "pending" status as it's too intrusive
  // Also auto-hide after a short time to not block navigation
  const shouldShow = (!isOnline && showNotification) || syncStatus === 'syncing' || (syncStatus === 'synced' && showNotification) || (syncStatus === 'error' && showNotification);
  
  if (!shouldShow) {
    return null;
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className={`offline-indicator ${!isOnline ? 'offline' : ''} ${syncStatus ? `sync-${syncStatus}` : ''}`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="indicator-content">
            {!isOnline ? (
              <>
                <span className="indicator-icon">📡</span>
                <span className="indicator-text">You are offline</span>
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <span className="indicator-icon spinning">🔄</span>
                <span className="indicator-text">Syncing data...</span>
              </>
            ) : syncStatus === 'synced' ? (
              <>
                <span className="indicator-icon">✅</span>
                <span className="indicator-text">{notificationMessage || 'Data synced!'}</span>
              </>
            ) : (
              <>
                <span className="indicator-icon">📡</span>
                <span className="indicator-text">{notificationMessage}</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;


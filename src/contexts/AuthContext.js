import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authAPI } from '../services/api';
import indexedDBManager from '../utils/indexedDB';
import offlineSyncService from '../services/offlineSync';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const sessionTimeoutRef = useRef(null);
  const logoutRef = useRef(null);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Store logout function in ref for use in timeout
  useEffect(() => {
    logoutRef.current = logout;
  });

  // Session timeout management
  useEffect(() => {
    if (!user) {
      // Clear any existing timeout
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      return;
    }

    // Get session timeout from settings
    const getSessionTimeout = () => {
      try {
        const saved = localStorage.getItem('learnplay-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.sessionTimeout || 30; // default 30 minutes
        }
      } catch (err) {
        console.error('Error reading session timeout:', err);
      }
      return 30; // default 30 minutes
    };

    const timeoutMinutes = getSessionTimeout();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    // Set up session timeout
    const setupTimeout = () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      
      sessionTimeoutRef.current = setTimeout(async () => {
        console.log('Session timeout - logging out user');
        if (logoutRef.current) {
          await logoutRef.current();
          alert(`Your session has expired after ${timeoutMinutes} minutes of inactivity. Please log in again.`);
        }
      }, timeoutMs);
    };

    // Setup timeout on login
    setupTimeout();

    // Reset timeout on user activity
    const resetTimeout = () => {
      setupTimeout();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Listen for settings changes
    const handleSettingsUpdate = () => {
      setupTimeout();
    };
    window.addEventListener('learnplay-settings-updated', handleSettingsUpdate);

    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
      window.removeEventListener('learnplay-settings-updated', handleSettingsUpdate);
    };
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      // First, try to get token from IndexedDB for offline login
      await indexedDBManager.init();
      const storedToken = await indexedDBManager.getAuthToken();
      
      // If we have a valid token and we're offline, use it
      if (storedToken && !navigator.onLine) {
        console.log('Offline mode: Using stored token');
        if (await indexedDBManager.isTokenValid()) {
          setUser(storedToken.user);
          setShowAuthModal(false);
          setLoading(false);
          return;
        } else {
          // Token expired, clear it
          await indexedDBManager.deleteAuthToken();
        }
      }

      // Try online authentication
      if (navigator.onLine) {
        const response = await authAPI.getMe();
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setShowAuthModal(false);
          
          // Save token for offline use (if provided by backend)
          if (data.token) {
            await indexedDBManager.saveAuthToken({
              token: data.token,
              userId: data.user._id || data.user.id,
              user: data.user,
              expiresAt: data.expiresAt || null
            });
          }
        } else {
          // If online auth fails, try stored token
          if (storedToken && await indexedDBManager.isTokenValid()) {
            setUser(storedToken.user);
            setShowAuthModal(false);
          } else {
            setUser(null);
            setShowAuthModal(true);
          }
        }
      } else {
        // Offline: use stored token if valid
        if (storedToken && await indexedDBManager.isTokenValid()) {
          setUser(storedToken.user);
          setShowAuthModal(false);
        } else {
          setUser(null);
          setShowAuthModal(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Fallback to stored token if available
      try {
        const storedToken = await indexedDBManager.getAuthToken();
        if (storedToken && await indexedDBManager.isTokenValid()) {
          setUser(storedToken.user);
          setShowAuthModal(false);
        } else {
          setUser(null);
          setShowAuthModal(true);
        }
      } catch (fallbackError) {
        setUser(null);
        setShowAuthModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Get lockout settings from localStorage
      let loginAttemptsLimit = 5; // default
      let lockoutDuration = 15; // default (minutes)
      
      try {
        const saved = localStorage.getItem('learnplay-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          loginAttemptsLimit = parsed.loginAttemptsLimit || 5;
          lockoutDuration = parsed.lockoutDuration || 15;
        }
      } catch (err) {
        console.error('Error reading lockout settings:', err);
      }
      
      const response = await authAPI.login(email, password, loginAttemptsLimit, lockoutDuration);
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setShowAuthModal(false);
        
        // Save authentication token for offline use
        if (data.token) {
          await indexedDBManager.saveAuthToken({
            token: data.token,
            userId: data.user._id || data.user.id,
            user: data.user,
            expiresAt: data.expiresAt || null
          });
        }
        
        // Trigger sync if online
        if (navigator.onLine) {
          setTimeout(() => offlineSyncService.syncAll(), 1000);
        }
        
        return { success: true };
      } else {
        // Handle email verification required (403)
        if (response.status === 403 && data.requiresVerification) {
          return { 
            success: false, 
            error: data.message,
            requiresVerification: true,
            user: data.user,
            email: email
          };
        }
        // Handle account locked status (423)
        if (response.status === 423) {
          return { 
            success: false, 
            error: data.message,
            accountLocked: true,
            lockedUntil: data.lockedUntil
          };
        }
        return { success: false, error: data.message, remainingAttempts: data.remainingAttempts };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const register = async (name, email, password, role = 'student', passwordRequirement = 'medium') => {
    try {
      // Get registration settings from localStorage
      let allowRegistration = true;
      let maxUsers = 1000;
      
      try {
        const saved = localStorage.getItem('learnplay-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          allowRegistration = parsed.allowRegistration !== false;
          maxUsers = parsed.maxUsers || 1000;
        }
      } catch (err) {
        console.error('Error reading registration settings:', err);
      }
      
      const response = await authAPI.register(name, email, password, role, passwordRequirement, allowRegistration, maxUsers);
      const data = await response.json();

      if (response.ok) {
        // Registration successful, but user needs to verify email
        // Don't set user or close modal yet
        return { success: true, user: data.user, requiresVerification: data.requiresVerification };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const completeEmailVerification = async (user) => {
    // Fetch fresh user data from backend to ensure we have the correct role
    try {
      const response = await authAPI.getMe();
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setShowAuthModal(false);
        
        // Save authentication token after OTP verification (first-time login)
        if (data.token) {
          await indexedDBManager.saveAuthToken({
            token: data.token,
            userId: data.user._id || data.user.id,
            user: data.user,
            expiresAt: data.expiresAt || null
          });
          console.log('Auth token saved after OTP verification');
        }
        
        // Trigger sync if online
        if (navigator.onLine) {
          setTimeout(() => offlineSyncService.syncAll(), 1000);
        }
        
        // Redirect to home page to avoid any protected route issues
        window.location.href = '/';
      } else {
        // Fallback to the user object from verification if getMe fails
        setUser(user);
        setShowAuthModal(false);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error fetching user after verification:', error);
      // Fallback to the user object from verification
      setUser(user);
      setShowAuthModal(false);
      window.location.href = '/';
    }
  };

  const logout = async () => {
    try {
      // Try to logout online if possible
      if (navigator.onLine) {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Online logout failed:', error);
        }
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setShowAuthModal(true);
      
      // Clear all offline data including auth token
      try {
        await indexedDBManager.clearAllData();
        console.log('All offline data cleared');
      } catch (error) {
        console.error('Error clearing offline data:', error);
      }
      
      // Clear any cached form data and force form reset
      if (typeof window !== 'undefined') {
        // Clear localStorage if any auth data is stored there
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('learnplay-device-id');
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Force a page reload to clear any browser autofill data
        // This ensures a clean slate for the next login
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  };

  const value = {
    user,
    loading,
    showAuthModal,
    setShowAuthModal,
    login,
    register,
    completeEmailVerification,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

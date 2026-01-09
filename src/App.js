import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import './App.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Header from './components/Header';
import Home from './components/Home';
import Subjects from './components/Subjects';
import MathGame from './components/games/MathGame';
import FilipinoGame from './components/games/FilipinoGame';
import EnglishGame from './components/games/EnglishGame';
import Quiz from './components/Quiz';
import Progress from './components/Progress';
import Footer from './components/Footer';
import AuthModal from './components/auth/AuthModal';
import AdminDashboard from './components/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PWAInstaller from './components/PWAInstaller';
import OfflineIndicator from './components/OfflineIndicator';

// PWA Utils
import pwaManager from './utils/pwa';

const AppContent = () => {
  const { user, loading, showAuthModal, setShowAuthModal } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Initialize PWA features and load settings
  useEffect(() => {
    // PWA manager is already initialized in the utils file
    console.log('PWA Manager initialized');
    
    // Load site settings and maintenance mode
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('learnplay-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Update page title
          if (parsed.siteName) {
            document.title = parsed.siteName;
          }
          
          // Update meta description
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription && parsed.siteDescription) {
            metaDescription.setAttribute('content', parsed.siteDescription);
          }
          
          // Check maintenance mode (admin/teacher can still access)
          setMaintenanceMode(parsed.maintenanceMode === true && (!user || (user.role !== 'admin' && user.role !== 'teacher')));
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
  }, [user]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show maintenance mode (except for admin users)
  if (maintenanceMode) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem',
        color: 'white'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          padding: '3rem 2rem',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '600px',
          width: '100%',
          color: '#2c3e50'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🔧</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Under Maintenance</h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>We're currently performing scheduled maintenance.</p>
          <p>Please check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <AuthModal 
        isOpen={showAuthModal && !user} 
        onClose={() => {}} // Prevent closing - user must authenticate
      />
      
      {/* PWA Installer */}
      <PWAInstaller />
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {user && (
        <>
          <Header />
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/math-game" element={<MathGame />} />
              <Route path="/filipino-game" element={<FilipinoGame />} />
              <Route path="/english-game" element={<EnglishGame />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/progress" element={<Progress />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </motion.main>
          <Footer />
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const profileMenuRef = useRef(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (!event.target.closest('.games-menu')) {
        setIsGamesOpen(false);
      }
      // Close mobile menu when clicking outside
      if (isMenuOpen && !event.target.closest('.nav') && !event.target.closest('.hamburger')) {
        setIsMenuOpen(false);
      }
    };

    if (isProfileOpen || isGamesOpen || isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isProfileOpen, isGamesOpen, isMenuOpen]);

  // Toggle body scroll lock when mobile menu opens/closes
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/subjects', label: 'Subjects', icon: '📚' },
    { path: '/quiz', label: 'Quiz', icon: '❓' }
  ];

  // Only show Progress to teachers or admins
  if (user && (user.role === 'teacher' || user.role === 'admin')) {
    navItems.push({ path: '/progress', label: 'Progress', icon: '📊' });
  }

  const gameLinks = [
    { path: '/english-game', label: 'English Game', icon: '📝' },
    { path: '/filipino-game', label: 'Filipino Game', icon: '📖' },
    { path: '/math-game', label: 'Mathematics Game', icon: '🔢' }
  ];

  // Add admin link if user is admin or teacher (teachers are admins)
  if (user && (user.role === 'admin' || user.role === 'teacher')) {
    navItems.push({ path: '/admin', label: 'Teacher', icon: '⚙️' });
  }

  return (
    <motion.header 
      className="header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container">
        <Link to="/" className="logo">
          <motion.div 
            className="logo-icon"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            🎮
          </motion.div>
          <div className="logo-text">
            <h1>{siteName}</h1>
            <p>{siteDescription}</p>
          </div>
        </Link>

        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsGamesOpen(false);
                    setIsProfileOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
            <li className="games-menu">
              <button
                className={`nav-link games-toggle ${isGamesOpen ? 'active' : ''}`}
                onClick={() => {
                  setIsGamesOpen((prev) => !prev);
                  setIsProfileOpen(false);
                }}
                aria-expanded={isGamesOpen}
              >
                <span className="nav-icon">🎯</span>
                <span className="nav-label">Games</span>
                <span className="caret">{isGamesOpen ? '▲' : '▼'}</span>
              </button>
              <div className={`games-dropdown ${isGamesOpen ? 'open' : ''}`}>
                {gameLinks.map((game) => (
                  <Link
                    key={game.path}
                    to={game.path}
                    className={`game-link ${location.pathname === game.path ? 'active' : ''}`}
                    onClick={() => {
                      setIsGamesOpen(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    <span className="game-icon">{game.icon}</span>
                    <div className="game-info">
                      <span className="game-label">{game.label}</span>
                      <span className="game-meta">Play & learn</span>
                    </div>
                  </Link>
                ))}
              </div>
            </li>
            {user && (
              <li className="user-menu" ref={profileMenuRef}>
                <button
                  className="profile-avatar-btn"
                  onClick={() => {
                    setIsProfileOpen((prev) => !prev);
                    setIsGamesOpen(false);
                  }}
                  aria-expanded={isProfileOpen}
                  title={user.name}
                >
                  <div className="avatar">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} />
                    ) : (
                      <span>{user.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </button>
                <div className={`profile-dropdown ${isProfileOpen ? 'open' : ''}`}>
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} />
                      ) : (
                        <span>{user.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="profile-dropdown-info">
                      <div className="profile-dropdown-name">{user.name}</div>
                      <div className="profile-dropdown-role">{user.role === 'admin' ? 'Teacher' : user.role}</div>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider"></div>
                  <button 
                    className="profile-dropdown-item"
                    onClick={() => {
                      setShowProfile(true);
                      setIsProfileOpen(false);
                    }}
                  >
                    <span className="profile-item-icon">✏️</span>
                    <span className="profile-item-label">Edit Profile</span>
                  </button>
                  <div className="profile-dropdown-divider"></div>
                  <button 
                    className="profile-dropdown-item logout-item"
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                  >
                    <span className="profile-item-icon">🚪</span>
                    <span className="profile-item-label">Sign Out</span>
                  </button>
                </div>
              </li>
            )}
          </ul>
        </nav>

        <button
          className={`hamburger ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </motion.header>
  );
};

export default Header;

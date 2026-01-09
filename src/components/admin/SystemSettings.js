import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './SystemSettings.css';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'LearnPlay',
    siteDescription: 'Interactive E-Learning Platform for Lambajon Elementary School',
    maintenanceMode: false,
    allowRegistration: true,
    maxUsers: 1000,
    sessionTimeout: 30,
    emailNotifications: true,
    gameDifficulty: 'medium',
    quizTimeLimit: 15,
    theme: 'default',
    language: 'en',
    // Security settings
    passwordRequirements: 'medium',
    loginAttemptsLimit: 5,
    lockoutDuration: 15,
    twoFactorAuth: true,
    logActivities: true,
    // Appearance settings
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    // Notification settings
    notifyNewUsers: true,
    notifyErrors: true,
    weeklyReports: false,
    smtpServer: 'smtp.gmail.com',
    adminEmail: 'admin@learnplay.com',
    // Game settings
    maxQuestionsPerQuiz: 20,
    passingScore: 70,
    allowRetakes: true,
    showCorrectAnswers: true
  });

  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Function to apply theme to the entire application
  const applyTheme = (themeName, primaryColor, secondaryColor) => {
    const root = document.documentElement;
    
    // Remove all existing theme classes
    root.className = root.className.replace(/theme-\w+/g, '');
    
    // Add current theme class
    if (themeName) {
      root.classList.add(`theme-${themeName}`);
    }

    // Apply CSS variables for colors
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--secondary-color', secondaryColor);

    // Apply theme-specific colors
    switch (themeName) {
      case 'dark':
        root.style.setProperty('--bg-color', '#1a1a2e');
        root.style.setProperty('--surface-color', '#16213e');
        root.style.setProperty('--text-color', '#eeeeee');
        root.style.setProperty('--text-secondary', '#b8b8b8');
        root.style.setProperty('--border-color', '#2d3748');
        document.body.style.backgroundColor = '#1a1a2e';
        document.body.style.color = '#eeeeee';
        break;
      
      case 'colorful':
        root.style.setProperty('--bg-color', '#f0f4f8');
        root.style.setProperty('--surface-color', '#ffffff');
        root.style.setProperty('--text-color', '#1a202c');
        root.style.setProperty('--text-secondary', '#4a5568');
        root.style.setProperty('--border-color', '#e2e8f0');
        document.body.style.backgroundColor = '#f0f4f8';
        document.body.style.color = '#1a202c';
        break;
      
      case 'minimal':
        root.style.setProperty('--bg-color', '#fafafa');
        root.style.setProperty('--surface-color', '#ffffff');
        root.style.setProperty('--text-color', '#212121');
        root.style.setProperty('--text-secondary', '#757575');
        root.style.setProperty('--border-color', '#e0e0e0');
        document.body.style.backgroundColor = '#fafafa';
        document.body.style.color = '#212121';
        break;
      
      default: // default theme
        root.style.setProperty('--bg-color', '#f8f9fa');
        root.style.setProperty('--surface-color', '#ffffff');
        root.style.setProperty('--text-color', '#2c3e50');
        root.style.setProperty('--text-secondary', '#6c757d');
        root.style.setProperty('--border-color', '#dee2e6');
        document.body.style.backgroundColor = '#f8f9fa';
        document.body.style.color = '#2c3e50';
        break;
    }

    // Dynamically update button and UI element styles
    const styleId = 'learnplay-theme-styles';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Convert hex color to rgba for shadow
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    styleElement.textContent = `
      .btn-primary,
      .save-btn.has-changes,
      .nav-tab.active,
      button.btn-primary,
      a.btn-primary {
        background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important;
        border-color: ${primaryColor} !important;
      }
      .btn-primary:hover,
      .save-btn.has-changes:hover,
      button.btn-primary:hover,
      a.btn-primary:hover {
        box-shadow: 0 8px 25px ${hexToRgba(primaryColor, 0.4)} !important;
        transform: translateY(-2px);
      }
      .nav-tab.active {
        background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%) !important;
      }
      .system-settings,
      .settings-section {
        background-color: var(--surface-color) !important;
        color: var(--text-color) !important;
      }
      .setting-item label {
        color: var(--text-color) !important;
      }
      .setting-item input,
      .setting-item select,
      .setting-item textarea {
        background-color: var(--surface-color) !important;
        color: var(--text-color) !important;
        border-color: var(--border-color) !important;
      }
    `;
  };

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('learnplay-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
        // Apply saved theme immediately
        applyTheme(
          parsedSettings.theme || 'default', 
          parsedSettings.primaryColor || '#667eea', 
          parsedSettings.secondaryColor || '#764ba2'
        );
      } catch (error) {
        console.error('Error loading settings:', error);
        // Apply default theme if loading fails
        applyTheme('default', '#667eea', '#764ba2');
      }
    } else {
      // Apply default theme on first load
      applyTheme('default', '#667eea', '#764ba2');
    }
  }, []);

  // Apply theme changes in real-time when settings change
  useEffect(() => {
    applyTheme(settings.theme, settings.primaryColor, settings.secondaryColor);
  }, [settings.theme, settings.primaryColor, settings.secondaryColor]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => {
      const newSettings = {
      ...prev,
      [key]: value
      };
      
      // Apply theme changes immediately for appearance settings
      if (key === 'theme' || key === 'primaryColor' || key === 'secondaryColor') {
        applyTheme(
          key === 'theme' ? value : newSettings.theme,
          key === 'primaryColor' ? value : newSettings.primaryColor,
          key === 'secondaryColor' ? value : newSettings.secondaryColor
        );
      }
      
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage (in a real app, this would be sent to backend)
      localStorage.setItem('learnplay-settings', JSON.stringify(settings));
      
      // Apply Site Name - Update page title
      if (settings.siteName) {
        document.title = settings.siteName;
      }
      
      // Apply Site Description - Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && settings.siteDescription) {
        metaDescription.setAttribute('content', settings.siteDescription);
      }
      
      // Dispatch custom event to notify other components (like RegisterForm) of settings update
      window.dispatchEvent(new CustomEvent('learnplay-settings-updated', {
        detail: settings
      }));
      
      // Also trigger storage event for cross-tab communication
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'learnplay-settings',
        newValue: JSON.stringify(settings)
      }));
      
      // Ensure theme is applied when saving (if appearance settings exist)
      if (settings.theme && settings.primaryColor && settings.secondaryColor) {
        applyTheme(settings.theme, settings.primaryColor, settings.secondaryColor);
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      alert('Settings saved successfully! Changes will take effect immediately.');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings = {
        siteName: 'LearnPlay',
        siteDescription: 'Interactive E-Learning Platform for Lambajon Elementary School',
        maintenanceMode: false,
        allowRegistration: true,
        maxUsers: 1000,
        sessionTimeout: 30,
        emailNotifications: true,
        gameDifficulty: 'medium',
        quizTimeLimit: 15,
        theme: 'default',
        language: 'en',
        passwordRequirements: 'medium',
        loginAttemptsLimit: 5,
        lockoutDuration: 15,
        twoFactorAuth: true,
        logActivities: true,
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        notifyNewUsers: true,
        notifyErrors: true,
        weeklyReports: false,
        smtpServer: 'smtp.gmail.com',
        adminEmail: 'admin@learnplay.com',
        maxQuestionsPerQuiz: 20,
        passingScore: 70,
        allowRetakes: true,
        showCorrectAnswers: true
      };
      setSettings(defaultSettings);
      // Apply default theme
      applyTheme('default', '#667eea', '#764ba2');
      setHasChanges(true);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings settings={settings} onChange={handleSettingChange} />;
      case 'security':
        return <SecuritySettings settings={settings} onChange={handleSettingChange} />;
      case 'notifications':
        return <NotificationSettings settings={settings} onChange={handleSettingChange} />;
      default:
        return <GeneralSettings settings={settings} onChange={handleSettingChange} />;
    }
  };

  return (
    <div className="system-settings">
      <div className="settings-header">
        <h2>System Settings</h2>
        <div className="header-actions">
          <button 
            className="reset-btn" 
            onClick={handleResetSettings}
            disabled={saving}
          >
            🔄 Reset
          </button>
          <button 
            className={`save-btn ${hasChanges ? 'has-changes' : ''}`} 
            onClick={handleSaveSettings}
            disabled={saving || !hasChanges}
          >
            {saving ? '💾 Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          <ul>
            {tabs.map(tab => (
              <li key={tab.id}>
                <button
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="settings-content">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

const GeneralSettings = ({ settings, onChange }) => (
  <div className="settings-section">
    <h3>General Settings</h3>
    <div className="settings-grid">
      <div className="setting-item">
        <label>Site Name</label>
        <input
          type="text"
          value={settings.siteName}
          onChange={(e) => onChange('siteName', e.target.value)}
          placeholder="Enter site name"
        />
      </div>
      
      <div className="setting-item">
        <label>Site Description</label>
        <textarea
          value={settings.siteDescription}
          onChange={(e) => onChange('siteDescription', e.target.value)}
          placeholder="Enter site description"
          rows="3"
        />
      </div>
      
      <div className="setting-item">
        <label>Maximum Users</label>
        <input
          type="number"
          value={settings.maxUsers}
          onChange={(e) => onChange('maxUsers', parseInt(e.target.value))}
          min="1"
          max="10000"
        />
      </div>
      
      <div className="setting-item">
        <label>Session Timeout (minutes)</label>
        <input
          type="number"
          value={settings.sessionTimeout}
          onChange={(e) => onChange('sessionTimeout', parseInt(e.target.value))}
          min="5"
          max="120"
        />
      </div>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.allowRegistration}
            onChange={(e) => onChange('allowRegistration', e.target.checked)}
          />
          <span className="checkmark"></span>
          Allow new user registration
        </label>
      </div>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => onChange('maintenanceMode', e.target.checked)}
          />
          <span className="checkmark"></span>
          Maintenance mode
        </label>
      </div>
    </div>
  </div>
);

const SecuritySettings = ({ settings, onChange }) => (
  <div className="settings-section">
    <h3>Security Settings</h3>
    <div className="settings-grid">
      <div className="setting-item">
        <label>Password Requirements</label>
        <select
          value={settings.passwordRequirements}
          onChange={(e) => onChange('passwordRequirements', e.target.value)}
        >
          <option value="easy">Minimum 6 characters</option>
          <option value="medium">Minimum 8 characters</option>
          <option value="strong">Strong password (8+ chars, numbers, symbols)</option>
        </select>
      </div>
      
      <div className="setting-item">
        <label>Login Attempts Limit</label>
        <input
          type="number"
          value={settings.loginAttemptsLimit}
          onChange={(e) => onChange('loginAttemptsLimit', parseInt(e.target.value))}
          min="3"
          max="10"
        />
      </div>
      
      <div className="setting-item">
        <label>Account Lockout Duration (minutes)</label>
        <input
          type="number"
          value={settings.lockoutDuration}
          onChange={(e) => onChange('lockoutDuration', parseInt(e.target.value))}
          min="5"
          max="60"
        />
      </div>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.twoFactorAuth}
            onChange={(e) => onChange('twoFactorAuth', e.target.checked)}
          />
          <span className="checkmark"></span>
          Enable two-factor authentication
        </label>
      </div>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.logActivities}
            onChange={(e) => onChange('logActivities', e.target.checked)}
          />
          <span className="checkmark"></span>
          Log all user activities
        </label>
      </div>
    </div>
  </div>
);

const AppearanceSettings = ({ settings, onChange }) => {
  const themes = [
    { name: 'default', label: 'Default', icon: '🎨', description: 'Clean and professional' },
    { name: 'dark', label: 'Dark Mode', icon: '🌙', description: 'Easy on the eyes' },
    { name: 'colorful', label: 'Colorful', icon: '🌈', description: 'Bright and vibrant' },
    { name: 'minimal', label: 'Minimal', icon: '✨', description: 'Simple and elegant' }
  ];

  return (
  <div className="settings-section">
    <h3>Appearance Settings</h3>
      <p style={{ color: 'var(--text-secondary, #6c757d)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Customize the look and feel of your LearnPlay website. Changes apply immediately to the entire site.
      </p>
    <div className="settings-grid">
        <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
          <label>Website Theme</label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem', 
            marginTop: '0.5rem',
            marginBottom: '1rem'
          }}>
            {themes.map((themeOption) => (
              <div
                key={themeOption.name}
                onClick={() => onChange('theme', themeOption.name)}
                style={{
                  border: `3px solid ${settings.theme === themeOption.name ? settings.primaryColor : 'transparent'}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  backgroundColor: settings.theme === themeOption.name ? `${settings.primaryColor}15` : 'var(--surface-color, #ffffff)',
                  boxShadow: settings.theme === themeOption.name ? `0 4px 16px ${settings.primaryColor}30` : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (settings.theme !== themeOption.name) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (settings.theme !== themeOption.name) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{themeOption.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-color, #2c3e50)' }}>{themeOption.label}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #6c757d)' }}>{themeOption.description}</div>
              </div>
            ))}
          </div>
        <select
          value={settings.theme}
          onChange={(e) => onChange('theme', e.target.value)}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {themes.map(themeOption => (
              <option key={themeOption.name} value={themeOption.name}>
                {themeOption.label} - {themeOption.description}
              </option>
            ))}
        </select>
      </div>
      
      <div className="setting-item">
          <label>
            Primary Color
            <span 
              style={{
                display: 'inline-block',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                border: '2px solid var(--border-color, #dee2e6)',
                marginLeft: '10px',
                verticalAlign: 'middle',
                backgroundColor: settings.primaryColor,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              title={settings.primaryColor}
            ></span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="color"
          value={settings.primaryColor}
          onChange={(e) => onChange('primaryColor', e.target.value)}
              style={{ width: '60px', height: '40px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={settings.primaryColor}
              onChange={(e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                  onChange('primaryColor', e.target.value);
                }
              }}
              style={{ flex: 1, padding: '0.75rem' }}
              placeholder="#667eea"
            />
          </div>
          <small style={{ color: 'var(--text-secondary, #6c757d)', fontSize: '0.85rem' }}>
            Used for buttons, links, and primary UI elements
          </small>
      </div>
      
      <div className="setting-item">
          <label>
            Secondary Color
            <span 
              style={{
                display: 'inline-block',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                border: '2px solid var(--border-color, #dee2e6)',
                marginLeft: '10px',
                verticalAlign: 'middle',
                backgroundColor: settings.secondaryColor,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              title={settings.secondaryColor}
            ></span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="color"
          value={settings.secondaryColor}
          onChange={(e) => onChange('secondaryColor', e.target.value)}
              style={{ width: '60px', height: '40px', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={settings.secondaryColor}
              onChange={(e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                  onChange('secondaryColor', e.target.value);
                }
              }}
              style={{ flex: 1, padding: '0.75rem' }}
              placeholder="#764ba2"
            />
          </div>
          <small style={{ color: 'var(--text-secondary, #6c757d)', fontSize: '0.85rem' }}>
            Used for gradients and secondary UI elements
          </small>
      </div>
      
      <div className="setting-item">
        <label>Language</label>
        <select
          value={settings.language}
          onChange={(e) => onChange('language', e.target.value)}
        >
          <option value="en">English</option>
          <option value="fil">Filipino</option>
          <option value="es">Spanish</option>
        </select>
          <small style={{ color: 'var(--text-secondary, #6c757d)', fontSize: '0.85rem' }}>
            Default language for the website interface
          </small>
      </div>
      
      <div className="setting-item">
        <label>Logo Upload</label>
        <input
          type="file"
          accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  console.log('Logo uploaded:', event.target.result);
                  alert('Logo upload feature coming soon!');
                };
                reader.readAsDataURL(e.target.files[0]);
              }
            }}
          />
          <small style={{ color: 'var(--text-secondary, #6c757d)', fontSize: '0.85rem' }}>
            Upload your organization logo (Recommended: 200x50px PNG)
          </small>
      </div>
    </div>
  </div>
);
};

const NotificationSettings = ({ settings, onChange }) => (
  <div className="settings-section">
    <h3>Notification Settings</h3>
    <div className="settings-grid">
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(e) => onChange('emailNotifications', e.target.checked)}
          />
          <span className="checkmark"></span>
          Enable email notifications
        </label>
      </div>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.notifyNewUsers}
            onChange={(e) => onChange('notifyNewUsers', e.target.checked)}
          />
          <span className="checkmark"></span>
          Notify on new user registration
        </label>
      </div>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.notifyErrors}
            onChange={(e) => onChange('notifyErrors', e.target.checked)}
          />
          <span className="checkmark"></span>
          Notify on system errors
        </label>
      </div>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.weeklyReports}
            onChange={(e) => onChange('weeklyReports', e.target.checked)}
          />
          <span className="checkmark"></span>
          Weekly usage reports
        </label>
      </div>
      
      <div className="setting-item">
        <label>SMTP Server</label>
        <input
          type="text"
          value={settings.smtpServer}
          onChange={(e) => onChange('smtpServer', e.target.value)}
          placeholder="smtp.gmail.com"
        />
      </div>
      
      <div className="setting-item">
        <label>Email Address</label>
        <input
          type="email"
          value={settings.adminEmail}
          onChange={(e) => onChange('adminEmail', e.target.value)}
          placeholder="admin@learnplay.com"
        />
      </div>
    </div>
  </div>
);

const GameSettings = ({ settings, onChange }) => (
  <div className="settings-section">
    <h3>Games & Quizzes Settings</h3>
    <div className="settings-grid">
      <div className="setting-item">
        <label>Default Game Difficulty</label>
        <select
          value={settings.gameDifficulty}
          onChange={(e) => onChange('gameDifficulty', e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      
      <div className="setting-item">
        <label>Quiz Time Limit (minutes)</label>
        <input
          type="number"
          value={settings.quizTimeLimit}
          onChange={(e) => onChange('quizTimeLimit', parseInt(e.target.value))}
          min="5"
          max="60"
        />
      </div>
      
      <div className="setting-item">
        <label>Maximum Questions per Quiz</label>
        <input
          type="number"
          value={settings.maxQuestionsPerQuiz}
          onChange={(e) => onChange('maxQuestionsPerQuiz', parseInt(e.target.value))}
          min="5"
          max="50"
        />
      </div>
      
      <div className="setting-item">
        <label>Passing Score (%)</label>
        <input
          type="number"
          value={settings.passingScore}
          onChange={(e) => onChange('passingScore', parseInt(e.target.value))}
          min="50"
          max="100"
        />
      </div>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.allowRetakes}
            onChange={(e) => onChange('allowRetakes', e.target.checked)}
          />
          <span className="checkmark"></span>
          Allow quiz retakes
        </label>
      </div>
      
      <div className="setting-item checkbox-item">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.showCorrectAnswers}
            onChange={(e) => onChange('showCorrectAnswers', e.target.checked)}
          />
          <span className="checkmark"></span>
          Show correct answers after quiz
        </label>
      </div>
    </div>
  </div>
);

export default SystemSettings;

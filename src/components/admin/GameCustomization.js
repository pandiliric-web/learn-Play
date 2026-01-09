import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gameSettingsAPI } from '../../services/api';
import { getAllGames, getGamesBySubject } from '../../utils/gameRegistry';
import './GameCustomization.css';

const GameCustomization = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);

  useEffect(() => {
    loadGames();
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedGame) {
      loadSettings();
    }
  }, [selectedGame]);

  const loadGames = () => {
    const allGames = selectedSubject === 'all' 
      ? getAllGames() 
      : getGamesBySubject(selectedSubject);
    setAvailableGames(allGames);
    
    // Auto-select first game if available
    if (allGames.length > 0 && !selectedGame) {
      setSelectedGame(allGames[0].id);
    }
  };

  const loadSettings = async () => {
    if (!selectedGame) return;

    try {
      setLoading(true);
      const response = await gameSettingsAPI.getGameSettings(selectedGame);
      const data = await response.json();

      if (response.ok && data.success) {
        // Database returns settings with general at root level
        // Transform to match our form structure if needed
        const dbSettings = data.settings;
        setSettings(dbSettings);
      } else {
        // Initialize with default settings from registry
        const game = getAllGames().find(g => g.id === selectedGame);
        if (game && game.settingsSchema) {
          setSettings(generateDefaultSettings(game.settingsSchema));
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('❌ Error loading game settings');
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultSettings = (schema) => {
    const defaults = {};
    
    Object.keys(schema).forEach(section => {
      if (section === 'general') {
        // General settings go at root level in database
        Object.keys(schema[section]).forEach(key => {
          defaults[key] = schema[section][key].default;
        });
      } else {
        // Difficulty settings go in their own objects
        defaults[section] = {};
        Object.keys(schema[section]).forEach(key => {
          defaults[section][key] = schema[section][key].default;
        });
      }
    });
    
    return defaults;
  };

  const handleSave = async () => {
    if (!selectedGame || !settings) return;

    try {
      setSaving(true);
      setMessage('');

      const response = await gameSettingsAPI.updateGameSettings(selectedGame, settings);
      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✅ Game settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ Error: ${data.message || 'Failed to save settings'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message || 'Failed to save settings'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default values?')) {
      return;
    }

    if (!selectedGame) return;

    try {
      setSaving(true);
      setMessage('');

      const response = await gameSettingsAPI.resetGameSettings(selectedGame);
      const data = await response.json();

      if (response.ok && data.success) {
        setSettings(data.settings);
        setMessage('✅ Settings reset to default values!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ Error: ${data.message || 'Failed to reset settings'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message || 'Failed to reset settings'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: typeof value === 'string' ? value : Number(value)
      }
    }));
  };

  const handleGeneralSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: typeof value === 'boolean' ? value : value
    }));
  };

  const renderSettingsForm = () => {
    if (!selectedGame || !settings) return null;

    const game = getAllGames().find(g => g.id === selectedGame);
    if (!game || !game.settingsSchema) return null;

    const schema = game.settingsSchema;

    return (
      <div className="settings-form">
        {/* General Settings */}
        {schema.general && (
          <div className="settings-section">
            <h3>General Settings</h3>
            <div className="settings-grid">
              {Object.keys(schema.general).map(field => {
                const fieldSchema = schema.general[field];
                return renderField(field, fieldSchema, settings[field], (value) => 
                  handleGeneralSettingChange(field, value)
                );
              })}
            </div>
          </div>
        )}

        {/* Difficulty Settings */}
        {schema.easy && (
          <>
            <div className="settings-section">
              <h3>Easy Mode Settings</h3>
              <div className="settings-grid">
                {Object.keys(schema.easy).map(field => {
                  const fieldSchema = schema.easy[field];
                  return renderField(field, fieldSchema, settings.easy?.[field], (value) => 
                    handleSettingChange('easy', field, value)
                  );
                })}
              </div>
            </div>

            {schema.medium && (
              <div className="settings-section">
                <h3>Medium Mode Settings</h3>
                <div className="settings-grid">
                  {Object.keys(schema.medium).map(field => {
                    const fieldSchema = schema.medium[field];
                    return renderField(field, fieldSchema, settings.medium?.[field], (value) => 
                      handleSettingChange('medium', field, value)
                    );
                  })}
                </div>
              </div>
            )}

            {schema.hard && (
              <div className="settings-section">
                <h3>Hard Mode Settings</h3>
                <div className="settings-grid">
                  {Object.keys(schema.hard).map(field => {
                    const fieldSchema = schema.hard[field];
                    return renderField(field, fieldSchema, settings.hard?.[field], (value) => 
                      handleSettingChange('hard', field, value)
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderField = (field, fieldSchema, value, onChange) => {
    const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    if (fieldSchema.type === 'boolean') {
      return (
        <div key={field} className="setting-item checkbox-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={value !== undefined ? value : fieldSchema.default}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span>{label}</span>
          </label>
        </div>
      );
    }

    if (fieldSchema.type === 'select') {
      return (
        <div key={field} className="setting-item">
          <label>{label}</label>
          <select
            value={value !== undefined ? value : fieldSchema.default}
            onChange={(e) => onChange(e.target.value)}
          >
            {fieldSchema.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {fieldSchema.description && <small>{fieldSchema.description}</small>}
        </div>
      );
    }

    if (fieldSchema.type === 'number') {
      return (
        <div key={field} className="setting-item">
          <label>{label}</label>
          <input
            type="number"
            value={value !== undefined ? value : fieldSchema.default}
            onChange={(e) => onChange(e.target.value)}
            min={fieldSchema.min}
            max={fieldSchema.max}
            step={field === 'animationSpeedMin' || field === 'animationSpeedMax' ? 0.1 : 1}
          />
          <small>
            {fieldSchema.min !== undefined && fieldSchema.max !== undefined
              ? `Range: ${fieldSchema.min}-${fieldSchema.max}`
              : fieldSchema.description || ''}
          </small>
        </div>
      );
    }

    return null;
  };

  const subjects = ['all', 'English', 'Mathematics', 'Filipino'];
  const currentGame = getAllGames().find(g => g.id === selectedGame);

  return (
    <div className="game-customization">
      <div className="customization-header">
        <h2>🎮 Game Customization</h2>
        <p>Customize game settings for all available games</p>
      </div>

      {message && (
        <motion.div
          className={`message ${message.includes('✅') ? 'success' : 'error'}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {message}
        </motion.div>
      )}

      <div className="game-selector-section">
        <div className="subject-filter">
          <label>Filter by Subject:</label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedGame(null);
            }}
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject === 'all' ? 'All Subjects' : subject}
              </option>
            ))}
          </select>
        </div>

        <div className="game-list">
          <h3>Select Game to Customize:</h3>
          <div className="games-grid">
            {availableGames.map(game => (
              <motion.div
                key={game.id}
                className={`game-card ${selectedGame === game.id ? 'active' : ''}`}
                onClick={() => setSelectedGame(game.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="game-icon">{game.icon}</div>
                <h4>{game.name}</h4>
                <p>{game.description}</p>
                <span className="game-subject">{game.subject}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {selectedGame && (
        <div className="customization-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading game settings...</p>
            </div>
          ) : (
            <>
              <div className="selected-game-header">
                <h3>
                  {currentGame?.icon} {currentGame?.name} Settings
                </h3>
                <p className="game-description">{currentGame?.description}</p>
              </div>

              {renderSettingsForm()}

              <div className="customization-actions">
                <button onClick={handleReset} className="reset-btn" disabled={saving}>
                  Reset to Default
                </button>
                <button onClick={handleSave} className="save-btn" disabled={saving || !settings}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {availableGames.length === 0 && (
        <div className="no-games">
          <p>No games available for the selected subject.</p>
        </div>
      )}
    </div>
  );
};

export default GameCustomization;


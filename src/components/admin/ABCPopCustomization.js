import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gameSettingsAPI } from '../../services/api';
import './ABCPopCustomization.css';

const ABCPopCustomization = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    easy: {
      bubbleCount: 12,
      targetInstances: 3,
      animationSpeedMin: 4,
      animationSpeedMax: 6,
      scorePoints: 10
    },
    medium: {
      bubbleCount: 12,
      targetInstances: 2,
      animationSpeedMin: 2,
      animationSpeedMax: 3.5,
      scorePoints: 15
    },
    hard: {
      bubbleCount: 6,
      targetInstances: 1,
      animationSpeedMin: 1.5,
      animationSpeedMax: 2.5,
      scorePoints: 20
    },
    enabled: true,
    soundEnabled: true,
    showRoundCounter: true,
    showScore: true,
    letterRange: 'A-Z'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await gameSettingsAPI.getGameSettings('abc-pop');
      const data = await response.json();

      if (response.ok && data.success) {
        setSettings({
          easy: data.settings.easy || settings.easy,
          medium: data.settings.medium || settings.medium,
          hard: data.settings.hard || settings.hard,
          enabled: data.settings.enabled !== undefined ? data.settings.enabled : true,
          soundEnabled: data.settings.soundEnabled !== undefined ? data.settings.soundEnabled : true,
          showRoundCounter: data.settings.showRoundCounter !== undefined ? data.settings.showRoundCounter : true,
          showScore: data.settings.showScore !== undefined ? data.settings.showScore : true,
          letterRange: data.settings.letterRange || 'A-Z'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('❌ Error loading game settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      const response = await gameSettingsAPI.updateGameSettings('abc-pop', settings);
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

    try {
      setSaving(true);
      setMessage('');

      const response = await gameSettingsAPI.resetGameSettings('abc-pop');
      const data = await response.json();

      if (response.ok && data.success) {
        setSettings({
          easy: data.settings.easy,
          medium: data.settings.medium,
          hard: data.settings.hard,
          enabled: data.settings.enabled,
          soundEnabled: data.settings.soundEnabled,
          showRoundCounter: data.settings.showRoundCounter,
          showScore: data.settings.showScore,
          letterRange: data.settings.letterRange
        });
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

  const handleSettingChange = (difficulty, field, value) => {
    setSettings(prev => ({
      ...prev,
      [difficulty]: {
        ...prev[difficulty],
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

  if (loading) {
    return (
      <div className="abc-pop-customization">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading game settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="abc-pop-customization">
      <div className="customization-header">
        <h2>🎈 ABC Pop Game Customization</h2>
        <p>Customize the ABC Pop game settings for all difficulty levels</p>
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

      <div className="customization-content">
        {/* General Settings */}
        <div className="settings-section">
          <h3>General Settings</h3>
          <div className="settings-grid">
            <div className="setting-item checkbox-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleGeneralSettingChange('enabled', e.target.checked)}
                />
                <span>Game Enabled</span>
              </label>
            </div>
            <div className="setting-item checkbox-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleGeneralSettingChange('soundEnabled', e.target.checked)}
                />
                <span>Sound Effects Enabled</span>
              </label>
            </div>
            <div className="setting-item checkbox-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.showRoundCounter}
                  onChange={(e) => handleGeneralSettingChange('showRoundCounter', e.target.checked)}
                />
                <span>Show Round Counter</span>
              </label>
            </div>
            <div className="setting-item checkbox-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.showScore}
                  onChange={(e) => handleGeneralSettingChange('showScore', e.target.checked)}
                />
                <span>Show Score Display</span>
              </label>
            </div>
            <div className="setting-item">
              <label>Letter Range</label>
              <select
                value={settings.letterRange}
                onChange={(e) => handleGeneralSettingChange('letterRange', e.target.value)}
              >
                <option value="A-F">A-F</option>
                <option value="A-M">A-M</option>
                <option value="A-Z">A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Easy Mode Settings */}
        <div className="settings-section">
          <h3>Easy Mode Settings</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Bubble Count</label>
              <input
                type="number"
                value={settings.easy.bubbleCount}
                onChange={(e) => handleSettingChange('easy', 'bubbleCount', e.target.value)}
                min="6"
                max="20"
              />
              <small>Number of letter bubbles on screen (6-20)</small>
            </div>
            <div className="setting-item">
              <label>Target Letter Instances</label>
              <input
                type="number"
                value={settings.easy.targetInstances}
                onChange={(e) => handleSettingChange('easy', 'targetInstances', e.target.value)}
                min="1"
                max="5"
              />
              <small>How many times the target letter appears (1-5)</small>
            </div>
            <div className="setting-item">
              <label>Animation Speed (Min seconds)</label>
              <input
                type="number"
                step="0.1"
                value={settings.easy.animationSpeedMin}
                onChange={(e) => handleSettingChange('easy', 'animationSpeedMin', e.target.value)}
                min="1"
                max="10"
              />
              <small>Minimum animation cycle time (1-10 seconds)</small>
            </div>
            <div className="setting-item">
              <label>Animation Speed (Max seconds)</label>
              <input
                type="number"
                step="0.1"
                value={settings.easy.animationSpeedMax}
                onChange={(e) => handleSettingChange('easy', 'animationSpeedMax', e.target.value)}
                min="1"
                max="10"
              />
              <small>Maximum animation cycle time (1-10 seconds)</small>
            </div>
            <div className="setting-item">
              <label>Score Points</label>
              <input
                type="number"
                value={settings.easy.scorePoints}
                onChange={(e) => handleSettingChange('easy', 'scorePoints', e.target.value)}
                min="1"
                max="100"
              />
              <small>Points awarded for correct answer (1-100)</small>
            </div>
          </div>
        </div>

        {/* Medium Mode Settings */}
        <div className="settings-section">
          <h3>Medium Mode Settings</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Bubble Count</label>
              <input
                type="number"
                value={settings.medium.bubbleCount}
                onChange={(e) => handleSettingChange('medium', 'bubbleCount', e.target.value)}
                min="6"
                max="20"
              />
              <small>Number of letter bubbles on screen (6-20)</small>
            </div>
            <div className="setting-item">
              <label>Target Letter Instances</label>
              <input
                type="number"
                value={settings.medium.targetInstances}
                onChange={(e) => handleSettingChange('medium', 'targetInstances', e.target.value)}
                min="1"
                max="5"
              />
              <small>How many times the target letter appears (1-5)</small>
            </div>
            <div className="setting-item">
              <label>Animation Speed (Min seconds)</label>
              <input
                type="number"
                step="0.1"
                value={settings.medium.animationSpeedMin}
                onChange={(e) => handleSettingChange('medium', 'animationSpeedMin', e.target.value)}
                min="1"
                max="10"
              />
              <small>Minimum animation cycle time (1-10 seconds)</small>
            </div>
            <div className="setting-item">
              <label>Animation Speed (Max seconds)</label>
              <input
                type="number"
                step="0.1"
                value={settings.medium.animationSpeedMax}
                onChange={(e) => handleSettingChange('medium', 'animationSpeedMax', e.target.value)}
                min="1"
                max="10"
              />
              <small>Maximum animation cycle time (1-10 seconds)</small>
            </div>
            <div className="setting-item">
              <label>Score Points</label>
              <input
                type="number"
                value={settings.medium.scorePoints}
                onChange={(e) => handleSettingChange('medium', 'scorePoints', e.target.value)}
                min="1"
                max="100"
              />
              <small>Points awarded for correct answer (1-100)</small>
            </div>
          </div>
        </div>

        {/* Hard Mode Settings */}
        <div className="settings-section">
          <h3>Hard Mode Settings</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Bubble Count</label>
              <input
                type="number"
                value={settings.hard.bubbleCount}
                onChange={(e) => handleSettingChange('hard', 'bubbleCount', e.target.value)}
                min="4"
                max="10"
              />
              <small>Number of letter bubbles on screen (4-10)</small>
            </div>
            <div className="setting-item">
              <label>Target Letter Instances</label>
              <input
                type="number"
                value={settings.hard.targetInstances}
                onChange={(e) => handleSettingChange('hard', 'targetInstances', e.target.value)}
                min="1"
                max="2"
              />
              <small>How many times the target letter appears (1-2)</small>
            </div>
            <div className="setting-item">
              <label>Animation Speed (Min seconds)</label>
              <input
                type="number"
                step="0.1"
                value={settings.hard.animationSpeedMin}
                onChange={(e) => handleSettingChange('hard', 'animationSpeedMin', e.target.value)}
                min="0.5"
                max="5"
              />
              <small>Minimum animation cycle time (0.5-5 seconds)</small>
            </div>
            <div className="setting-item">
              <label>Animation Speed (Max seconds)</label>
              <input
                type="number"
                step="0.1"
                value={settings.hard.animationSpeedMax}
                onChange={(e) => handleSettingChange('hard', 'animationSpeedMax', e.target.value)}
                min="0.5"
                max="5"
              />
              <small>Maximum animation cycle time (0.5-5 seconds)</small>
            </div>
            <div className="setting-item">
              <label>Score Points</label>
              <input
                type="number"
                value={settings.hard.scorePoints}
                onChange={(e) => handleSettingChange('hard', 'scorePoints', e.target.value)}
                min="1"
                max="100"
              />
              <small>Points awarded for correct answer (1-100)</small>
            </div>
          </div>
        </div>
      </div>

      <div className="customization-actions">
        <button onClick={handleReset} className="reset-btn" disabled={saving}>
          Reset to Default
        </button>
        <button onClick={handleSave} className="save-btn" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default ABCPopCustomization;


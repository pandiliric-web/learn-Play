import GameSettings from '../models/GameSettings.js';
import mongoose from 'mongoose';

/**
 * Get game settings by game name
 */
export const getGameSettings = async (req, res) => {
  try {
    const { gameName } = req.params;

    if (!gameName) {
      return res.status(400).json({
        success: false,
        message: 'Game name is required'
      });
    }

    let settings = await GameSettings.findOne({ gameName });

    // If settings don't exist, create default settings
    if (!settings) {
      settings = new GameSettings({
        gameName,
        lastModifiedBy: req.user?.id || req.user?._id
      });
      await settings.save();
    }

    // Convert Mongoose document to plain object
    const settingsObj = settings.toObject ? settings.toObject() : settings;
    // Remove MongoDB internal fields
    delete settingsObj.__v;
    delete settingsObj._id;

    res.json({
      success: true,
      settings: settingsObj
    });
  } catch (error) {
    console.error('[GameSettings] Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get game settings'
    });
  }
};

/**
 * Update game settings
 */
export const updateGameSettings = async (req, res) => {
  try {
    const { gameName } = req.params;
    const updateData = req.body;

    if (!gameName) {
      return res.status(400).json({
        success: false,
        message: 'Game name is required'
      });
    }

    // Validate that user is admin
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and teachers can update game settings'
      });
    }

    // Find or create settings
    let settings = await GameSettings.findOne({ gameName });

    if (!settings) {
      settings = new GameSettings({
        gameName,
        ...updateData,
        lastModifiedBy: req.user.id || req.user._id
      });
    } else {
      // Update existing settings
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (typeof updateData[key] === 'object' && !Array.isArray(updateData[key])) {
            // Merge nested objects (e.g., easy, medium, hard)
            settings[key] = { ...settings[key], ...updateData[key] };
          } else {
            settings[key] = updateData[key];
          }
        }
      });
      settings.lastModifiedBy = req.user.id || req.user._id;
    }

    await settings.save();

    // Convert Mongoose document to plain object
    const settingsObj = settings.toObject ? settings.toObject() : settings;
    delete settingsObj.__v;
    delete settingsObj._id;

    console.log('[GameSettings] Settings saved for', gameName, ':', JSON.stringify(settingsObj, null, 2));

    res.json({
      success: true,
      message: 'Game settings updated successfully',
      settings: settingsObj
    });
  } catch (error) {
    console.error('[GameSettings] Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update game settings'
    });
  }
};

/**
 * Reset game settings to default
 */
export const resetGameSettings = async (req, res) => {
  try {
    const { gameName } = req.params;

    if (!gameName) {
      return res.status(400).json({
        success: false,
        message: 'Game name is required'
      });
    }

    // Validate that user is admin
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and teachers can reset game settings'
      });
    }

    // Delete existing settings to reset to defaults
    await GameSettings.findOneAndDelete({ gameName });

    // Create new default settings
    const defaultSettings = new GameSettings({
      gameName,
      lastModifiedBy: req.user.id || req.user._id
    });
    await defaultSettings.save();

    // Convert Mongoose document to plain object
    const settingsObj = defaultSettings.toObject ? defaultSettings.toObject() : defaultSettings;
    delete settingsObj.__v;
    delete settingsObj._id;

    res.json({
      success: true,
      message: 'Game settings reset to default values',
      settings: settingsObj
    });
  } catch (error) {
    console.error('[GameSettings] Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset game settings'
    });
  }
};

/**
 * Get all game settings (admin only)
 */
export const getAllGameSettings = async (req, res) => {
  try {
    // Validate that user is admin
    if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and teachers can view all game settings'
      });
    }

    const settings = await GameSettings.find().populate('lastModifiedBy', 'name email');

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('[GameSettings] Error getting all settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get game settings'
    });
  }
};


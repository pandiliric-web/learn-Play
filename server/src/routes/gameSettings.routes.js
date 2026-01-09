import express from 'express';
import {
  getGameSettings,
  updateGameSettings,
  resetGameSettings,
  getAllGameSettings
} from '../controllers/gameSettings.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get settings for a specific game (public, but creates default if doesn't exist)
router.get('/:gameName', getGameSettings);

// Get all game settings (admin/teacher only)
router.get('/', requireAuth, getAllGameSettings);

// Update game settings (admin/teacher only)
router.put('/:gameName', requireAuth, updateGameSettings);

// Reset game settings to default (admin/teacher only)
router.delete('/:gameName/reset', requireAuth, resetGameSettings);

export default router;


import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  sendProgressReport,
  sendWeeklySummary,
  getProgressReportData
} from '../controllers/progressReport.controller.js';

const router = express.Router();

// Middleware to require teacher or admin
const requireTeacherOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Teacher or admin access required' });
  }
  next();
};

// All progress report routes require authentication
router.use(requireAuth);

// Send progress report email (admin/teacher only)
router.post('/send', requireTeacherOrAdmin, sendProgressReport);

// Send weekly summary email (admin/teacher only)
router.post('/weekly-summary', requireTeacherOrAdmin, sendWeeklySummary);

// Get progress report data (admin/teacher only) - for preview
router.get('/data/:studentId', requireTeacherOrAdmin, getProgressReportData);

export default router;


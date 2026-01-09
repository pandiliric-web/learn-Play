import express from 'express';
import { getStudents, getStudentProgress, saveProgress, testProgressConnection } from '../controllers/progress.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect progress endpoints: only authenticated teachers or admins may access
const requireTeacherOrAdmin = (req, res, next) => {
	if (!req.user) return res.status(401).json({ message: 'Authentication required' });
	if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
		return res.status(403).json({ message: 'Teacher or admin access required' });
	}
	return next();
};

// Allow authenticated users (students) to save their own progress
router.use(requireAuth);
router.post('/', saveProgress); // Students can save their own progress
router.get('/students', requireTeacherOrAdmin, getStudents);
router.get('/students/:id/progress', requireTeacherOrAdmin, getStudentProgress);
router.get('/test', requireTeacherOrAdmin, testProgressConnection); // Test endpoint for admins

export default router;

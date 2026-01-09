import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { getSubjects, createSubject, deleteSubject } from '../controllers/subject.controller.js';

const router = express.Router();

// Public: list subjects
router.get('/', getSubjects);

// Create and delete subject routes. In production both routes require admin.
if (process.env.NODE_ENV === 'production') {
  router.post('/', requireAuth, requireAdmin, createSubject);
  router.delete('/:id', requireAuth, requireAdmin, deleteSubject);
} else {
  router.post('/', createSubject);
  router.delete('/:id', deleteSubject);
}

export default router;

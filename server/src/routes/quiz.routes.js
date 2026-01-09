import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quiz.controller.js';
import {
  uploadDocumentAndGenerateQuiz,
  upload
} from '../controllers/quizUpload.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getQuizzes);
router.post('/', requireAdmin, createQuiz);
router.post('/upload-document', requireAdmin, upload.single('document'), uploadDocumentAndGenerateQuiz);
router.put('/:id', requireAdmin, updateQuiz);
router.delete('/:id', requireAdmin, deleteQuiz);

export default router;

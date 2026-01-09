import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { parseDocumentToQuestions } from '../services/documentParser.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'quiz-documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `quiz-${uniqueSuffix}${ext}`);
  }
});

// File filter for PDF and Word documents
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Upload document and generate quiz questions
 */
export const uploadDocumentAndGenerateQuiz = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    try {
      // Parse document and extract questions
      const questions = await parseDocumentToQuestions(filePath, fileExtension);

      // Clean up uploaded file
      await fs.unlink(filePath).catch(() => {}); // Ignore errors if file already deleted

      res.json({
        success: true,
        questions: questions,
        message: `Successfully extracted ${questions.length} question(s) from the document.`
      });
    } catch (parseError) {
      // Clean up uploaded file on error
      await fs.unlink(filePath).catch(() => {});
      throw parseError;
    }
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({
      message: error.message || 'Error processing document'
    });
  }
};

export default {
  uploadDocumentAndGenerateQuiz,
  upload
};

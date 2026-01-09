import mongoose from 'mongoose';
import Progress from '../models/Progress.js';
import User from '../models/User.js';

export const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email avatarUrl createdAt');
    return res.json({ data: students });
  } catch (err) {
    console.error('[progress] getStudents error', err);
    return res.status(500).json({ message: 'Unable to load students' });
  }
};

export const getStudentProgress = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await User.findById(id).select('name avatarUrl');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const progress = await Progress.find({ studentId: id }).sort({ createdAt: 1 }).lean();
    console.log(`[progress] Found ${progress.length} progress records for student ${id}`);
    return res.json({ student, data: progress });
  } catch (err) {
    console.error('[progress] getStudentProgress error', err);
    return res.status(500).json({ message: 'Unable to load student progress' });
  }
};

// Test endpoint to verify MongoDB connection and collection
export const testProgressConnection = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collectionName = Progress.collection.name;
    
    // Get collection stats
    const stats = await db.collection(collectionName).stats();
    const count = await Progress.countDocuments();
    const sample = await Progress.find().limit(5).lean();
    
    return res.json({
      success: true,
      message: 'MongoDB connection is working',
      database: db.databaseName,
      collection: collectionName,
      stats: {
        count: count,
        size: stats.size,
        storageSize: stats.storageSize
      },
      sampleRecords: sample,
      connectionState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  } catch (err) {
    console.error('[progress] testProgressConnection error', err);
    return res.status(500).json({ 
      success: false,
      message: 'Test failed: ' + err.message,
      error: err.stack 
    });
  }
};

export const saveProgress = async (req, res) => {
  try {
    const { subject, quizScore, totalQuestions, correctAnswers, timeSpent, difficulty, gameType } = req.body;
    
    console.log('[progress] saveProgress called with data:', {
      subject,
      quizScore,
      totalQuestions,
      correctAnswers,
      timeSpent,
      difficulty,
      gameType,
      userId: req.user?.id || req.user?._id,
      userRole: req.user?.role,
      fullUser: req.user
    });
    
    // Validate required fields
    if (!subject || quizScore === undefined || !totalQuestions || correctAnswers === undefined || timeSpent === undefined) {
      console.error('[progress] Missing required fields');
      return res.status(400).json({ message: 'Missing required fields: subject, quizScore, totalQuestions, correctAnswers, timeSpent' });
    }

    // Validate subject enum
    const validSubjects = ['Mathematics', 'English', 'Filipino'];
    if (!validSubjects.includes(subject)) {
      console.error('[progress] Invalid subject:', subject);
      return res.status(400).json({ message: 'Invalid subject. Must be Mathematics, English, or Filipino' });
    }

    // Use current user as studentId (students save their own progress)
    // JWT payload uses 'id' field, not '_id'
    const studentId = req.user.id || req.user._id;
    if (!studentId) {
      console.error('[progress] No user ID found. User object:', req.user);
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate quizScore range
    if (quizScore < 0 || quizScore > 100) {
      console.error('[progress] Invalid quizScore:', quizScore);
      return res.status(400).json({ message: 'quizScore must be between 0 and 100' });
    }

    // Prepare progress data
    const progressData = {
      studentId,
      subject,
      quizScore: Math.round(quizScore),
      totalQuestions: parseInt(totalQuestions),
      correctAnswers: parseInt(correctAnswers),
      timeSpent: Math.round(timeSpent), // Ensure integer
      difficulty: difficulty || 'Medium',
      gameType: gameType || 'Quiz'
    };

    // Validate that studentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.error('[progress] Invalid studentId format:', studentId);
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    // Convert studentId string to ObjectId
    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    progressData.studentId = studentObjectId;

    console.log('[progress] Creating progress record in MongoDB:', progressData);

    // Create progress record in MongoDB Atlas
    const progress = await Progress.create(progressData);

    console.log('[progress] Progress saved successfully to MongoDB Atlas. ID:', progress._id);

    return res.status(201).json({ 
      message: 'Progress saved successfully to database',
      progress: progress.toObject()
    });
  } catch (err) {
    console.error('[progress] saveProgress error:', err);
    console.error('[progress] Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    return res.status(500).json({ 
      message: 'Failed to save progress to database: ' + err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
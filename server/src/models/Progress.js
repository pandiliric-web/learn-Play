import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  subject: { 
    type: String, 
    enum: ['Mathematics', 'English', 'Filipino'], 
    required: true 
  },
  quizScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  totalQuestions: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  correctAnswers: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  timeSpent: { 
    type: Number, 
    required: true, 
    min: 0 
  }, // in seconds
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard'], 
    default: 'Medium' 
  },
  gameType: { 
    type: String, 
    enum: ['Quiz', 'Game', 'Practice'], 
    default: 'Quiz' 
  }
}, { timestamps: true });

// Index for efficient queries
progressSchema.index({ studentId: 1, createdAt: -1 });
progressSchema.index({ subject: 1, createdAt: -1 });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;

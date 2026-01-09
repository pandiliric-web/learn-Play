import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  icon: { type: String, trim: true, default: '📚' },
  color: { type: String, trim: true, default: '#3498db' },
  gamesCount: { type: Number, default: 0 },
  quizzesCount: { type: Number, default: 0 },
  lessonsCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String, trim: true, default: '' },
  parentName: { type: String, trim: true, default: '' }, // Parent's name
  parentEmail: { type: String, trim: true, default: '', lowercase: true }, // Parent's email for progress reports
  emailReportsEnabled: { type: Boolean, default: true }, // Whether email progress reports are enabled
  isEmailVerified: { type: Boolean, default: false }, // Email verification status
  emailVerificationToken: { type: String, trim: true, default: '' }, // For email verification links (optional)
  failedLoginAttempts: { type: Number, default: 0 }, // Track failed login attempts
  accountLockedUntil: { type: Date, default: null } // When account will be unlocked (null if not locked)
}, { timestamps: true });

userSchema.methods.comparePassword = function(passwordPlain) {
  return bcrypt.compare(passwordPlain, this.passwordHash);
};

userSchema.statics.hashPassword = async function(passwordPlain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(passwordPlain, salt);
};

const User = mongoose.model('User', userSchema);
export default User;

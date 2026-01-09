import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRouter from './src/routes/auth.routes.js';
import otpRouter from './src/routes/otp.routes.js';
import quizRouter from './src/routes/quiz.routes.js';
import subjectRouter from './src/routes/subject.routes.js';
import progressRouter from './src/routes/progress.routes.js';
import progressReportRouter from './src/routes/progressReport.routes.js';
import gameSettingsRouter from './src/routes/gameSettings.routes.js';
import { notFoundHandler, errorHandler } from './src/middleware/error.middleware.js';
import { verifyEmailConfig } from './src/services/email.service.js';


const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://learn_play_user:<db_password>@learnplay.zt3ds7d.mongodb.net/?appName=learnplay';

// Log which MongoDB URI is being used (mask credentials if present)
function maskedUri(uri) {
  try {
    const u = new URL(uri);
    if (u.username || u.password) {
      u.password = '****';
      return u.toString();
    }
    return uri;
  } catch (_err) {
    return uri;
  }
}
console.log('[server] Using MONGO_URI:', maskedUri(MONGO_URI));

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log(`[TEST] Testing email service with: ${email}`);
    const { sendOTPEmail } = await import('./src/services/email.service.js');
    await sendOTPEmail(email, '123456'); // Test OTP

    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('[TEST] Email test failed:', error);
    res.status(500).json({ message: 'Test email failed', error: error.message });
  }
});
app.use('/api/auth', authRouter);
app.use('/api/otp', otpRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/subjects', subjectRouter);
app.use('/api/progress', progressRouter);
app.use('/api/progress-reports', progressReportRouter);
app.use('/api/game-settings', gameSettingsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    // Connect to MongoDB Atlas with better error handling
    const connectionOptions = {
      // Ensure we're using the latest connection options
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };
    
    await mongoose.connect(MONGO_URI, connectionOptions);
    console.log('✅ MongoDB Atlas connected successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🔗 Connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');

    // Verify email configuration
    const emailReady = await verifyEmailConfig();
    if (!emailReady) {
      console.warn('⚠️  Email service is not configured properly. OTP emails may not work.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 API running on :${PORT}`);
      console.log(`📡 Progress API endpoint: POST /api/progress`);
    });
  } catch (err) {
    console.error('❌ Server start failed:', err);
    console.error('MongoDB connection error details:', {
      name: err.name,
      message: err.message,
      code: err.code
    });
    process.exit(1);
  }
}

start();

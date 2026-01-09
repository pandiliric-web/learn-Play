import { Router } from 'express';
import { sendVerificationOTP, verifyOTP, resendOTP } from '../controllers/otp.controller.js';

const router = Router();

// Send verification OTP
router.post('/send-verification', sendVerificationOTP);

// Verify OTP
router.post('/verify', verifyOTP);

// Resend OTP
router.post('/resend', resendOTP);

export default router;

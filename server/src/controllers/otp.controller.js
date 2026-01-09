import OTP from '../models/Otp.js';
import User from '../models/User.js';
import { sendOTPEmail, sendWelcomeEmail } from '../services/email.service.js';

// Send OTP for email verification (during registration)
export async function sendVerificationOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists and is not already verified
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Check for existing unverified OTP and increment attempts or create new one
    let existingOTP = await OTP.findOne({
      email,
      type: 'email_verification',
      isVerified: false,
      expiresAt: { $gt: new Date() }
    });

    if (existingOTP) {
      // Check rate limiting (max 3 attempts per hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentAttempts = await OTP.countDocuments({
        email,
        type: 'email_verification',
        createdAt: { $gt: oneHourAgo }
      });

      if (recentAttempts >= 3) {
        return res.status(429).json({
          message: 'Too many OTP requests. Please try again in an hour.'
        });
      }

      // Generate new OTP and update existing record
      existingOTP.otp = OTP.generateOTP();
      existingOTP.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Reset expiration
      existingOTP.attempts = 0; // Reset attempts for new OTP
      await existingOTP.save();
    } else {
      // Create new OTP
      const otp = OTP.generateOTP();
      existingOTP = await OTP.create({
        email,
        otp,
        type: 'email_verification'
      });
    }

    // Send OTP email
    try {
      console.log(`[OTP] Sending verification email to: ${email}`);
      await sendOTPEmail(email, existingOTP.otp);
      console.log(`[OTP] Verification email sent successfully to: ${email}`);
    } catch (emailError) {
      console.error('[OTP] Failed to send OTP email:', emailError);
      console.error('[OTP] Email error details:', emailError.message);
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }

    return res.json({
      message: 'Verification code sent to your email',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ message: 'Failed to send verification code' });
  }
}

// Verify OTP and complete email verification
export async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find valid OTP
    const otpRecord = await OTP.findValidOTP(email, otp, 'email_verification');

    if (!otpRecord) {
      return res.status(400).json({
        message: 'Invalid or expired verification code'
      });
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Check if max attempts reached
    if (otpRecord.attempts >= 3) {
      return res.status(400).json({
        message: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Mark OTP as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Update user email verification status
    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, user.name).catch(err =>
      console.error('Welcome email failed:', err)
    );

    // Clean up other OTPs for this email
    await OTP.deleteMany({
      email,
      type: 'email_verification',
      isVerified: false
    });

    return res.json({
      message: 'Email verified successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Failed to verify code' });
  }
}

// Resend OTP (same logic as sendVerificationOTP)
export async function resendOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Rate limiting: max 3 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await OTP.countDocuments({
      email,
      type: 'email_verification',
      createdAt: { $gt: oneHourAgo }
    });

    if (recentRequests >= 3) {
      return res.status(429).json({
        message: 'Too many requests. Please try again in an hour.'
      });
    }

    // Create new OTP (invalidate old ones)
    const otp = OTP.generateOTP();
    await OTP.create({
      email,
      otp,
      type: 'email_verification'
    });

    // Send email
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error('Failed to resend OTP email:', emailError);
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    return res.json({
      message: 'New verification code sent',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ message: 'Failed to resend verification code' });
  }
}

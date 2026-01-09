import User from '../models/User.js';
import OTP from '../models/Otp.js';
import { signUserToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { sendPasswordResetEmail, sendPasswordChangeConfirmation, sendOTPEmail } from '../services/email.service.js';

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl || '',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// Validate password based on requirement level
function validatePassword(password, requirement = 'medium') {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (requirement === 'strong') {
    const hasLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasLength || !hasNumber || !hasSymbol) {
      return {
        valid: false,
        message: 'Password must be at least 8 characters and include a number and a symbol'
      };
    }
  } else if (requirement === 'medium') {
    if (password.length < 8) {
      return {
        valid: false,
        message: 'Password must be at least 8 characters long'
      };
    }
  } else if (requirement === 'easy') {
    if (password.length < 6) {
      return {
        valid: false,
        message: 'Password must be at least 6 characters long'
      };
    }
  }

  return { valid: true };
}

export async function register(req, res) {
  try {
    const { email, name, password, role, passwordRequirement, allowRegistration, maxUsers } = req.body;
    if (!email || !name || !password) return res.status(400).json({ message: 'Missing required fields' });

    // Check if registration is allowed
    if (allowRegistration === false) {
      return res.status(403).json({ message: 'Registration is currently disabled. Please contact an administrator.' });
    }

    // Check maximum users limit
    const userCount = await User.countDocuments();
    const maxUsersLimit = maxUsers || 1000;
    if (userCount >= maxUsersLimit) {
      return res.status(403).json({ message: `Maximum user limit (${maxUsersLimit}) has been reached. Registration is currently closed.` });
    }

    // Validate password based on requirement (default to medium)
    const requirement = passwordRequirement || 'medium';
    const passwordValidation = validatePassword(password, requirement);
    
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    // Security: Force all public registrations to be 'student' role only
    // Teacher and admin roles can only be assigned by existing admins through the admin panel
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      email,
      name,
      role: 'student', // Always 'student' for public registrations
      passwordHash,
      isEmailVerified: false // Explicitly set to false for new registrations
    });

    // Don't automatically log in - user needs to verify email first
    return res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      requiresVerification: true
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password, loginAttemptsLimit, lockoutDuration } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Get lockout settings (defaults: 5 attempts, 15 minutes)
    const maxAttempts = loginAttemptsLimit || 5;
    const lockoutMinutes = lockoutDuration || 15;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.accountLockedUntil - new Date()) / (1000 * 60));
      return res.status(423).json({ 
        message: `Account is locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        accountLocked: true,
        lockedUntil: user.accountLockedUntil
      });
    }

    // If lockout period has expired, unlock the account
    if (user.accountLockedUntil && user.accountLockedUntil <= new Date()) {
      user.accountLockedUntil = null;
      user.failedLoginAttempts = 0;
      await user.save();
    }

    const ok = await user.comparePassword(password);
    
    if (!ok) {
      // Increment failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      // Check if limit reached
      if (user.failedLoginAttempts >= maxAttempts) {
        // Lock the account
        const lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
        user.accountLockedUntil = lockoutUntil;
        await user.save();
        
        return res.status(423).json({ 
          message: `Too many failed login attempts. Your account has been locked for ${lockoutMinutes} minute(s).`,
          accountLocked: true,
          lockedUntil: lockoutUntil
        });
      }
      
      // Save failed attempt count
      await user.save();
      
      const remainingAttempts = maxAttempts - user.failedLoginAttempts;
      return res.status(401).json({ 
        message: `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lockout.`,
        remainingAttempts
      });
    }

    // Successful login - reset failed attempts and unlock account
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    await user.save();

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          isEmailVerified: user.isEmailVerified
        }
      });
    }

    const token = signUserToken({ id: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function updateMe(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, avatarUrl } = req.body;
    if (name !== undefined) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export function logout(_req, res) {
  clearAuthCookie(res);
  return res.json({ message: 'Logged out' });
}

// Admin functions
export async function getAllUsers(req, res) {
  try {
    const users = await User.find({}).select('-passwordHash');
    const sanitizedUsers = users.map(user => sanitizeUser(user));
    return res.json({ users: sanitizedUsers });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, role, avatarUrl } = req.body;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.avatarUrl = avatarUrl !== undefined ? avatarUrl : user.avatarUrl;
    
    await user.save();
    
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await User.findByIdAndDelete(id);
    
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Admin function to create users with any role and send email verification
export async function createUser(req, res) {
  try {
    const { email, name, password, role, passwordRequirement } = req.body;
    
    // Validate required fields
    if (!email || !name || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate role - allow student or teacher (teacher is the admin role)
    // Map 'admin' to 'teacher' for backward compatibility
    const validRoles = ['student', 'teacher'];
    let userRole = 'student';
    if (role === 'teacher' || role === 'admin') {
      userRole = 'teacher'; // Teacher is the admin role
    }

    // Validate password based on requirement (default to medium)
    const requirement = passwordRequirement || 'medium';
    const passwordValidation = validatePassword(password, requirement);
    
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Create the user
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      email,
      name,
      role: userRole,
      passwordHash,
      isEmailVerified: false // User needs to verify email
    });

    // Create and send OTP for email verification
    try {
      const otp = OTP.generateOTP();
      await OTP.create({
        email,
        otp,
        type: 'email_verification'
      });

      // Send OTP email
      await sendOTPEmail(email, otp);
      console.log(`[AUTH] User created by admin. Verification OTP sent to: ${email}`);
    } catch (emailError) {
      console.error('[AUTH] Failed to send verification email:', emailError);
      // Don't fail the user creation if email fails, but log it
      // The user can request a new OTP later
    }

    return res.status(201).json({
      message: 'User created successfully. Verification code sent to email.',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      requiresVerification: true
    });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create user' });
  }
}

// Forgot password - send OTP to email
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        message: 'If an account exists with this email, a password reset code has been sent.'
      });
    }

    // Check for existing unverified OTP and increment attempts or create new one
    let existingOTP = await OTP.findOne({
      email,
      type: 'password_reset',
      isVerified: false,
      expiresAt: { $gt: new Date() }
    });

    if (existingOTP) {
      // Check rate limiting (max 3 attempts per hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentAttempts = await OTP.countDocuments({
        email,
        type: 'password_reset',
        createdAt: { $gt: oneHourAgo }
      });

      if (recentAttempts >= 3) {
        return res.status(429).json({
          message: 'Too many password reset requests. Please try again in an hour.'
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
        type: 'password_reset'
      });
    }

    // Send password reset email
    try {
      console.log(`[AUTH] Sending password reset email to: ${email}`);
      await sendPasswordResetEmail(email, existingOTP.otp);
      console.log(`[AUTH] Password reset email sent successfully to: ${email}`);
    } catch (emailError) {
      console.error('[AUTH] Failed to send password reset email:', emailError);
      console.error('[AUTH] Email error details:', emailError.message);
      return res.status(500).json({ message: 'Failed to send password reset email. Please try again.' });
    }

    // Don't reveal if email exists or not for security
    return res.json({
      message: 'If an account exists with this email, a password reset code has been sent.',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Failed to process password reset request' });
  }
}

// Reset password - verify OTP and update password
export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword, passwordRequirement } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    // Validate password based on requirement (default to medium)
    const requirement = passwordRequirement || 'medium';
    const passwordValidation = validatePassword(newPassword, requirement);
    
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Find valid OTP
    const otpRecord = await OTP.findValidOTP(email, otp, 'password_reset');

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

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    const passwordHash = await User.hashPassword(newPassword);
    user.passwordHash = passwordHash;
    await user.save();

    // Mark OTP as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Send password change confirmation email (non-blocking)
    sendPasswordChangeConfirmation(email, user.name).catch(err =>
      console.error('Password change confirmation email failed:', err)
    );

    // Clean up other OTPs for this email
    await OTP.deleteMany({
      email,
      type: 'password_reset',
      isVerified: false
    });

    return res.json({
      message: 'Password has been reset successfully. Please login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
}

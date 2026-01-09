import nodemailer from 'nodemailer';

let transporter = null;

// Create transporter based on environment (lazy initialization)
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[EMAIL] EMAIL_USER or EMAIL_PASS not configured in environment variables');
    return null;
  }

  // Always use configured SMTP (Gmail) for now since you want real emails
  const newTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your email password or app password
    },
    // For services like SendGrid, Brevo, etc.
    // service: process.env.EMAIL_SERVICE || 'gmail',
  });

  return newTransporter;
};

// Get transporter (lazy initialization)
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// Verify transporter configuration
export const verifyEmailConfig = async () => {
  try {
    const emailTransporter = getTransporter();
    if (!emailTransporter) {
      console.error('[EMAIL] Email transporter not initialized. Check EMAIL_USER and EMAIL_PASS environment variables.');
      return false;
    }
    await emailTransporter.verify();
    console.log('[EMAIL] Email service is ready');
    return true;
  } catch (error) {
    console.error('[EMAIL] Email service configuration error:', error.message);
    return false;
  }
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    console.log(`[EMAIL] Attempting to send OTP email to: ${email}, OTP: ${otp}`);

    const emailTransporter = getTransporter();
    if (!emailTransporter) {
      throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    }

    if (!process.env.EMAIL_USER) {
      throw new Error('EMAIL_USER environment variable is not set');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LearnPlay'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Welcome to LearnPlay! Please use the verification code below to complete your registration.
            </p>
            <div style="background-color: #fff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 30px;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="font-size: 14px; color: #888; margin-bottom: 20px;">
              This code will expire in 10 minutes.
            </p>
            <p style="font-size: 14px; color: #888;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #999;">
              © 2025 LearnPlay. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        Your Email Verification Code

        Welcome to LearnPlay!

        Your verification code is: ${otp}

        This code will expire in 10 minutes.

        If you didn't request this code, please ignore this email.
      `
    };

    console.log('[EMAIL] Mail options prepared:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('[EMAIL] OTP email sent successfully:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending OTP email:', error.message);
    console.error('[EMAIL] Full error object:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// Send password reset OTP email
export const sendPasswordResetEmail = async (email, otp) => {
  try {
    console.log(`[EMAIL] Attempting to send password reset email to: ${email}, OTP: ${otp}`);

    const emailTransporter = getTransporter();
    if (!emailTransporter) {
      throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    }

    if (!process.env.EMAIL_USER) {
      throw new Error('EMAIL_USER environment variable is not set');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LearnPlay'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              You requested to reset your password for your LearnPlay account. Use the verification code below to proceed.
            </p>
            <div style="background-color: #fff; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 30px;">
              <h1 style="color: #dc3545; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="font-size: 14px; color: #888; margin-bottom: 20px;">
              This code will expire in 10 minutes.
            </p>
            <p style="font-size: 14px; color: #888; margin-bottom: 20px;">
              <strong>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</strong>
            </p>
            <p style="font-size: 14px; color: #888;">
              For security reasons, please do not share this code with anyone.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #999;">
              © 2025 LearnPlay. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        Password Reset Request

        You requested to reset your password for your LearnPlay account.

        Your verification code is: ${otp}

        This code will expire in 10 minutes.

        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

        For security reasons, please do not share this code with anyone.
      `
    };

    console.log('[EMAIL] Password reset mail options prepared:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('[EMAIL] Password reset email sent successfully:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending password reset email:', error.message);
    console.error('[EMAIL] Full error object:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// Send password change confirmation email
export const sendPasswordChangeConfirmation = async (email, name) => {
  try {
    const emailTransporter = getTransporter();
    if (!emailTransporter || !process.env.EMAIL_USER) {
      console.warn('[EMAIL] Cannot send password change confirmation - email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LearnPlay'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Changed Successfully</h2>
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Hi ${name},
            </p>
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Your password has been successfully changed. If you did not make this change, please contact our support team immediately.
            </p>
            <div style="background-color: #28a745; color: white; padding: 15px 30px; border-radius: 5px; display: inline-block; text-decoration: none; margin-bottom: 20px;">
              <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/login" style="color: white; text-decoration: none; font-weight: bold;">
                Sign In to Your Account
              </a>
            </div>
            <p style="font-size: 14px; color: #888; margin-top: 30px;">
              For your security, we recommend:
            </p>
            <ul style="font-size: 14px; color: #888; text-align: left; display: inline-block; margin: 20px 0;">
              <li>Using a strong, unique password</li>
              <li>Not sharing your password with anyone</li>
              <li>Logging out when using shared devices</li>
            </ul>
            <p style="font-size: 14px; color: #dc3545; margin-top: 30px;">
              <strong>If you did not change your password, please contact us immediately.</strong>
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #999;">
              © 2025 LearnPlay. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        Password Changed Successfully

        Hi ${name},

        Your password has been successfully changed. If you did not make this change, please contact our support team immediately.

        Sign in to your account: ${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/login

        For your security, we recommend:
        - Using a strong, unique password
        - Not sharing your password with anyone
        - Logging out when using shared devices

        If you did not change your password, please contact us immediately.
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('[EMAIL] Password change confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending password change confirmation email:', error);
    // Don't throw error for confirmation emails - they're not critical
    return { success: false, error: error.message };
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email, name) => {
  try {
    const emailTransporter = getTransporter();
    if (!emailTransporter || !process.env.EMAIL_USER) {
      console.warn('[EMAIL] Cannot send welcome email - email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LearnPlay'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to LearnPlay!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to LearnPlay, ${name}!</h2>
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Your email has been successfully verified. You can now access all features of our learning platform.
            </p>
            <div style="background-color: #28a745; color: white; padding: 15px 30px; border-radius: 5px; display: inline-block; text-decoration: none;">
              <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/login" style="color: white; text-decoration: none; font-weight: bold;">
                Start Learning Now
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #999;">
              © 2025 LearnPlay. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `
        Welcome to LearnPlay, ${name}!

        Your email has been successfully verified. You can now access all features of our learning platform.

        Start learning now: ${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/login
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('[EMAIL] Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending welcome email:', error);
    // Don't throw error for welcome emails - they're not critical
    return { success: false, error: error.message };
  }
};

// Send student progress report email with charts
export const sendProgressReportEmail = async (studentEmail, studentName, parentEmail, parentName, progressData, charts) => {
  try {
    const emailTransporter = getTransporter();
    if (!emailTransporter || !process.env.EMAIL_USER) {
      throw new Error('Email service is not configured');
    }

    // Format date range text
    let dateRangeText = 'All Time';
    if (progressData.dateRange) {
      const start = new Date(progressData.dateRange.startDate).toLocaleDateString();
      const end = new Date(progressData.dateRange.endDate).toLocaleDateString();
      dateRangeText = `${start} - ${end}`;
    }

    // Format time spent
    const formatTime = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    };

    // Determine overall performance
    const getPerformanceLevel = (score) => {
      if (score >= 90) return { text: 'Excellent', emoji: '🌟', color: '#28a745' };
      if (score >= 80) return { text: 'Very Good', emoji: '👍', color: '#17a2b8' };
      if (score >= 70) return { text: 'Good', emoji: '✅', color: '#ffc107' };
      if (score >= 60) return { text: 'Needs Improvement', emoji: '📚', color: '#fd7e14' };
      return { text: 'Needs More Practice', emoji: '📖', color: '#dc3545' };
    };

    const performance = getPerformanceLevel(progressData.overall.averageScore);

    // Build subject rows HTML
    const subjectRows = progressData.bySubject
      .filter(s => s.totalQuizzes > 0)
      .map(subject => {
        const subjPerformance = getPerformanceLevel(subject.averageScore);
        return `
          <tr style="border-bottom: 1px solid #e9ecef;">
            <td style="padding: 15px; font-weight: 600; color: #2c3e50;">${subject.subject}</td>
            <td style="padding: 15px; text-align: center;">${subject.totalQuizzes}</td>
            <td style="padding: 15px; text-align: center; font-weight: 700; color: ${subjPerformance.color};">
              ${subject.averageScore}%
            </td>
            <td style="padding: 15px; text-align: center;">${subject.highestScore}%</td>
            <td style="padding: 15px; text-align: center;">${subject.accuracy}%</td>
            <td style="padding: 15px; text-align: center;">${formatTime(subject.totalTimeSpent)}</td>
          </tr>
        `;
      }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${studentName}'s Progress Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 800px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">📊 Progress Report</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">${studentName}'s Learning Journey</p>
            </td>
          </tr>

          <!-- Overall Performance Card -->
          <tr>
            <td style="padding: 30px;">
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Overall Performance</h2>
                <div style="font-size: 48px; font-weight: 800; color: ${performance.color}; margin: 20px 0;">
                  ${progressData.overall.averageScore}%
                </div>
                <p style="color: #6c757d; font-size: 18px; margin: 10px 0;">
                  ${performance.emoji} ${performance.text}
                </p>
                <div style="display: flex; justify-content: space-around; margin-top: 30px; flex-wrap: wrap;">
                  <div style="flex: 1; min-width: 150px; margin: 10px;">
                    <div style="font-size: 32px; font-weight: 700; color: #667eea;">${progressData.overall.totalQuizzes}</div>
                    <div style="color: #6c757d; font-size: 14px; margin-top: 5px;">Total Quizzes</div>
                  </div>
                  <div style="flex: 1; min-width: 150px; margin: 10px;">
                    <div style="font-size: 32px; font-weight: 700; color: #667eea;">${progressData.overall.highestScore}%</div>
                    <div style="color: #6c757d; font-size: 14px; margin-top: 5px;">Highest Score</div>
                  </div>
                  <div style="flex: 1; min-width: 150px; margin: 10px;">
                    <div style="font-size: 32px; font-weight: 700; color: #667eea;">${formatTime(progressData.overall.totalTimeSpent)}</div>
                    <div style="color: #6c757d; font-size: 14px; margin-top: 5px;">Total Time</div>
                  </div>
                </div>
                <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">Period: ${dateRangeText}</p>
              </div>
            </td>
          </tr>

          <!-- Charts Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 22px; text-align: center;">Performance Visualizations</h2>
              
              <!-- Subject Performance Bar Chart -->
              <div style="margin-bottom: 30px; text-align: center;">
                <img src="${charts.subjectBarChart}" alt="Subject Performance Chart" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />
              </div>

              <!-- Quiz Distribution Pie Chart -->
              <div style="margin-bottom: 30px; text-align: center;">
                <img src="${charts.subjectPieChart}" alt="Quiz Distribution Chart" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);" />
              </div>
            </td>
          </tr>

          <!-- Subject Breakdown Table -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 22px;">Performance by Subject</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <thead>
                  <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff;">
                    <th style="padding: 15px; text-align: left; font-weight: 600;">Subject</th>
                    <th style="padding: 15px; text-align: center; font-weight: 600;">Quizzes</th>
                    <th style="padding: 15px; text-align: center; font-weight: 600;">Avg Score</th>
                    <th style="padding: 15px; text-align: center; font-weight: 600;">Highest</th>
                    <th style="padding: 15px; text-align: center; font-weight: 600;">Accuracy</th>
                    <th style="padding: 15px; text-align: center; font-weight: 600;">Time Spent</th>
                  </tr>
                </thead>
                <tbody>
                  ${subjectRows || '<tr><td colspan="6" style="padding: 30px; text-align: center; color: #6c757d;">No quiz data available</td></tr>'}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Encouragement Message -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; text-align: center;">
              <p style="color: #2c3e50; font-size: 16px; line-height: 1.6; margin: 0;">
                ${progressData.overall.averageScore >= 80 
                  ? `🎉 Excellent work, ${studentName}! You're doing amazing! Keep up the great effort!`
                  : progressData.overall.averageScore >= 70
                  ? `👍 Great progress, ${studentName}! You're on the right track. Keep practicing!`
                  : `📚 Keep learning, ${studentName}! Every quiz is a step forward. You've got this!`
                }
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #2c3e50; color: #ffffff;">
              <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">LearnPlay Learning Platform</p>
              <p style="margin: 0; font-size: 14px; opacity: 0.8;">© 2025 LearnPlay. All rights reserved.</p>
              <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.6;">
                This is an automated progress report. For questions, please contact your teacher.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Determine recipients
    const recipients = [];
    if (studentEmail) recipients.push(studentEmail);
    if (parentEmail && parentEmail !== studentEmail) recipients.push(parentEmail);

    if (recipients.length === 0) {
      throw new Error('No email recipients specified');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LearnPlay'}" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject: `📊 ${studentName}'s Progress Report - ${dateRangeText}`,
      html: htmlContent,
      text: `
${studentName}'s Progress Report - ${dateRangeText}

Overall Performance: ${progressData.overall.averageScore}% (${performance.text} ${performance.emoji})

Total Quizzes: ${progressData.overall.totalQuizzes}
Highest Score: ${progressData.overall.highestScore}%
Total Time Spent: ${formatTime(progressData.overall.totalTimeSpent)}

Performance by Subject:
${progressData.bySubject.filter(s => s.totalQuizzes > 0).map(s => 
  `- ${s.subject}: ${s.totalQuizzes} quizzes, ${s.averageScore}% average, ${s.accuracy}% accuracy`
).join('\n')}

${progressData.overall.averageScore >= 80 
  ? `Excellent work, ${studentName}! You're doing amazing!`
  : progressData.overall.averageScore >= 70
  ? `Great progress, ${studentName}! Keep practicing!`
  : `Keep learning, ${studentName}! Every quiz is a step forward.`
}

© 2025 LearnPlay. All rights reserved.
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('[EMAIL] Progress report email sent successfully:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      recipients: recipients
    };
  } catch (error) {
    console.error('[EMAIL] Error sending progress report email:', error);
    throw new Error(`Failed to send progress report email: ${error.message}`);
  }
};

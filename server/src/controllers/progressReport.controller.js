import User from '../models/User.js';
import Progress from '../models/Progress.js';
import { aggregateStudentProgress, generateProgressCharts } from '../services/progressReport.service.js';
import { sendProgressReportEmail } from '../services/email.service.js';
import mongoose from 'mongoose';

/**
 * Send progress report email to student and/or parent
 */
export const sendProgressReport = async (req, res) => {
  try {
    const { studentId, dateRange, sendToStudent = true, sendToParent = true, customParentEmail } = req.body;

    // Validate required fields
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Get student information
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Validate email addresses
    const studentEmail = sendToStudent ? student.email : null;
    
    // Use custom parent email if provided, otherwise use the one from student profile
    let parentEmail = null;
    if (sendToParent) {
      if (customParentEmail && customParentEmail.trim()) {
        // Validate custom parent email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customParentEmail.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid parent email address format.'
          });
        }
        parentEmail = customParentEmail.trim();
      } else if (student.parentEmail) {
        parentEmail = student.parentEmail;
      }
    }

    if (!studentEmail && !parentEmail) {
      return res.status(400).json({
        success: false,
        message: 'No email addresses available. Please ensure student email is set, or parent email is configured.'
      });
    }

    // Aggregate progress data
    console.log('[ProgressReport] Aggregating progress for student:', studentId);
    const progressData = await aggregateStudentProgress(studentId, dateRange || null);

    // Check if there's any progress data
    if (progressData.overall.totalQuizzes === 0) {
      return res.status(400).json({
        success: false,
        message: 'No progress data found for this student. The student needs to complete at least one quiz or game.'
      });
    }

    // Generate charts
    console.log('[ProgressReport] Generating charts...');
    const charts = generateProgressCharts(progressData);

    // Send email
    console.log('[ProgressReport] Sending progress report email...');
    const result = await sendProgressReportEmail(
      studentEmail,
      student.name,
      parentEmail,
      student.parentName || 'Parent',
      progressData,
      charts
    );

    res.json({
      success: true,
      message: 'Progress report sent successfully via email',
      messageId: result.messageId,
      recipients: result.recipients,
      progressSummary: {
        totalQuizzes: progressData.overall.totalQuizzes,
        averageScore: progressData.overall.averageScore,
        dateRange: progressData.dateRange
      }
    });

  } catch (error) {
    console.error('[ProgressReport] Error sending progress report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send progress report'
    });
  }
};

/**
 * Get progress report data (without sending email)
 */
export const getProgressReportData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const dateRange = (startDate && endDate) ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : null;

    // Aggregate progress data
    const progressData = await aggregateStudentProgress(studentId, dateRange);

    // Generate charts
    const charts = generateProgressCharts(progressData);

    res.json({
      success: true,
      progressData,
      charts
    });

  } catch (error) {
    console.error('[ProgressReport] Error getting progress report data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get progress report data'
    });
  }
};

/**
 * Send weekly progress summary email
 */
export const sendWeeklySummary = async (req, res) => {
  try {
    const { studentId, sendToStudent = true, sendToParent = true } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Get student information
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Calculate date range for the week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const dateRange = { startDate, endDate };

    // Aggregate progress data for the week
    const progressData = await aggregateStudentProgress(studentId, dateRange);

    if (progressData.overall.totalQuizzes === 0) {
      return res.status(400).json({
        success: false,
        message: 'No progress data found for the past week'
      });
    }

    // Generate charts
    const charts = generateProgressCharts(progressData);

    // Determine recipients
    const studentEmail = sendToStudent ? student.email : null;
    const parentEmail = sendToParent && student.parentEmail ? student.parentEmail : null;

    if (!studentEmail && !parentEmail) {
      return res.status(400).json({
        success: false,
        message: 'No email addresses available'
      });
    }

    // Send email
    const result = await sendProgressReportEmail(
      studentEmail,
      student.name,
      parentEmail,
      student.parentName || 'Parent',
      progressData,
      charts
    );

    res.json({
      success: true,
      message: 'Weekly summary sent successfully via email',
      messageId: result.messageId,
      recipients: result.recipients,
      weeklyData: {
        totalQuizzes: progressData.overall.totalQuizzes,
        averageScore: progressData.overall.averageScore,
        dateRange
      }
    });

  } catch (error) {
    console.error('[ProgressReport] Error sending weekly summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send weekly summary'
    });
  }
};



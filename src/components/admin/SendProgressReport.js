import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { progressReportAPI } from '../../services/api';
import './SendProgressReport.css';

const SendProgressReport = ({ student, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'preview'
  const [options, setOptions] = useState({
    dateRange: null,
    sendToStudent: true,
    sendToParent: true,
    useCustomDateRange: false,
    startDate: '',
    endDate: '',
    customParentEmail: ''
  });

  useEffect(() => {
    if (student && student.id) {
      loadReportPreview();
    }
  }, [student]);

  const loadReportPreview = async () => {
    if (!student || !student.id) return;

    setPreviewLoading(true);
    try {
      const dateRange = options.useCustomDateRange && options.startDate && options.endDate
        ? { startDate: options.startDate, endDate: options.endDate }
        : null;

      const response = await progressReportAPI.getProgressReportData(student.id, dateRange);
      const data = await response.json();

      if (response.ok && data.success) {
        setReportData(data.progressData);
      } else {
        console.error('Failed to load report preview:', data.message);
      }
    } catch (error) {
      console.error('Error loading report preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (!student || !student.id) {
      setMessage('No student selected');
      return;
    }

    if (!options.sendToStudent && !options.sendToParent) {
      setMessage('Please select at least one recipient (student or parent)');
      return;
    }

    if (options.sendToParent && options.customParentEmail && options.customParentEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(options.customParentEmail.trim())) {
        setMessage('Please enter a valid parent email address');
        return;
      }
    }

    if (options.useCustomDateRange) {
      if (!options.startDate || !options.endDate) {
        setMessage('Please select both start and end dates for custom date range');
        return;
      }
      if (new Date(options.startDate) > new Date(options.endDate)) {
        setMessage('Start date must be before end date');
        return;
      }
    }

    try {
      setLoading(true);
      setMessage('');

      const dateRange = options.useCustomDateRange && options.startDate && options.endDate
        ? { startDate: options.startDate, endDate: options.endDate }
        : null;

      const response = await progressReportAPI.sendProgressReport(student.id, {
        dateRange,
        sendToStudent: options.sendToStudent,
        sendToParent: options.sendToParent,
        customParentEmail: options.customParentEmail && options.customParentEmail.trim() ? options.customParentEmail.trim() : null
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(`✅ Progress report sent successfully via email to: ${data.recipients.join(', ')}`);
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setMessage(`❌ Error: ${data.message || 'Failed to send progress report'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message || 'Failed to send progress report'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (field, value) => {
    setOptions(prev => ({ ...prev, [field]: value }));
    if (field === 'useCustomDateRange' || field === 'startDate' || field === 'endDate') {
      setTimeout(loadReportPreview, 500);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    if (score >= 60) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="send-progress-overlay" onClick={onClose}>
      <motion.div
        className="send-progress-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-new">
          <div className="header-content">
            <div className="header-icon">📧</div>
            <div>
              <h2>Send Progress Report</h2>
              <p>Email student performance data to parents and students</p>
            </div>
          </div>
          <button className="close-btn-new" onClick={onClose}>×</button>
        </div>

        {/* Student Info Card */}
        {student && (
          <div className="student-card-new">
            <div className="student-avatar-new">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} />
              ) : (
                <span>{student.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="student-details">
              <h3>{student.name}</h3>
              <div className="student-meta">
                <span className="meta-item">📧 {student.email}</span>
                {student.parentEmail && (
                  <span className="meta-item">👨‍👩‍👧 {student.parentEmail}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message Alert */}
        {message && (
          <motion.div
            className={`alert-new ${message.includes('Error') || message.includes('❌') ? 'alert-error' : 'alert-success'}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
          <button
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            📊 Preview
          </button>
        </div>

        {/* Content Area */}
        <div className="modal-content-new">
          {activeTab === 'settings' && (
            <div className="settings-tab">
              {/* Date Range Section */}
              <div className="section-card">
                <div className="section-header">
                  <span className="section-icon">📅</span>
                  <h4>Date Range</h4>
                </div>
                <div className="section-body">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={options.useCustomDateRange}
                      onChange={(e) => handleOptionChange('useCustomDateRange', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Use Custom Date Range</span>
                  </label>
                  
                  {options.useCustomDateRange && (
                    <div className="date-inputs">
                      <div className="input-group">
                        <label>Start Date</label>
                        <input
                          type="date"
                          value={options.startDate}
                          onChange={(e) => handleOptionChange('startDate', e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label>End Date</label>
                        <input
                          type="date"
                          value={options.endDate}
                          onChange={(e) => handleOptionChange('endDate', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recipients Section */}
              <div className="section-card">
                <div className="section-header">
                  <span className="section-icon">👥</span>
                  <h4>Recipients</h4>
                </div>
                <div className="section-body">
                  <div className="recipient-options">
                    <label className="recipient-checkbox">
                      <input
                        type="checkbox"
                        checked={options.sendToStudent}
                        onChange={(e) => handleOptionChange('sendToStudent', e.target.checked)}
                      />
                      <div className="checkbox-custom"></div>
                      <div className="recipient-info">
                        <span className="recipient-name">Student</span>
                        <span className="recipient-email">{student?.email}</span>
                      </div>
                    </label>

                    <label className="recipient-checkbox">
                      <input
                        type="checkbox"
                        checked={options.sendToParent}
                        onChange={(e) => handleOptionChange('sendToParent', e.target.checked)}
                      />
                      <div className="checkbox-custom"></div>
                      <div className="recipient-info">
                        <span className="recipient-name">Parent</span>
                        <span className="recipient-email">
                          {student?.parentEmail || 'No email configured'}
                        </span>
                      </div>
                    </label>
                  </div>

                  {options.sendToParent && (
                    <div className="parent-email-section">
                      <label>Parent Email Address</label>
                      <input
                        type="email"
                        value={options.customParentEmail}
                        onChange={(e) => handleOptionChange('customParentEmail', e.target.value)}
                        placeholder={student?.parentEmail || "Enter parent's email address"}
                        className="email-input"
                      />
                      {student?.parentEmail ? (
                        <p className="input-hint">
                          💡 Leave empty to use: <strong>{student.parentEmail}</strong>
                        </p>
                      ) : (
                        <p className="input-warning">
                          ⚠️ No parent email configured. Please enter parent email address.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="preview-tab">
              {previewLoading ? (
                <div className="loading-state">
                  <div className="spinner-new"></div>
                  <p>Loading report preview...</p>
                </div>
              ) : reportData ? (
                <>
                  {/* Summary Stats */}
                  <div className="stats-grid-new">
                    <div className="stat-box">
                      <div className="stat-icon">📝</div>
                      <div className="stat-info">
                        <div className="stat-label">Total Quizzes</div>
                        <div className="stat-value-new">{reportData.overall.totalQuizzes}</div>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon">📊</div>
                      <div className="stat-info">
                        <div className="stat-label">Average Score</div>
                        <div 
                          className="stat-value-new"
                          style={{ color: getPerformanceColor(reportData.overall.averageScore) }}
                        >
                          {reportData.overall.averageScore}%
                        </div>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon">⭐</div>
                      <div className="stat-info">
                        <div className="stat-label">Highest Score</div>
                        <div className="stat-value-new">{reportData.overall.highestScore}%</div>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon">⏱️</div>
                      <div className="stat-info">
                        <div className="stat-label">Total Time</div>
                        <div className="stat-value-new">{formatTime(reportData.overall.totalTimeSpent)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Subject Performance Table */}
                  {reportData.bySubject.filter(s => s.totalQuizzes > 0).length > 0 && (
                    <div className="table-section">
                      <h4 className="table-title">Performance by Subject</h4>
                      <div className="table-wrapper">
                        <table className="performance-table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Quizzes</th>
                              <th>Avg Score</th>
                              <th>Highest</th>
                              <th>Accuracy</th>
                              <th>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.bySubject
                              .filter(s => s.totalQuizzes > 0)
                              .map((subject, idx) => (
                                <tr key={idx}>
                                  <td><strong>{subject.subject}</strong></td>
                                  <td>{subject.totalQuizzes}</td>
                                  <td>
                                    <span 
                                      className="score-badge"
                                      style={{ backgroundColor: getPerformanceColor(subject.averageScore) + '20', color: getPerformanceColor(subject.averageScore) }}
                                    >
                                      {subject.averageScore}%
                                    </span>
                                  </td>
                                  <td>{subject.highestScore}%</td>
                                  <td>{subject.accuracy}%</td>
                                  <td>{formatTime(subject.totalTimeSpent)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="preview-footer">
                    <p>📊 The email will include visual charts showing performance by subject and quiz distribution.</p>
                  </div>
                </>
              ) : (
                <div className="no-data-state">
                  <div className="no-data-icon">📊</div>
                  <p>No progress data available. The student needs to complete at least one quiz or game.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer-new">
          <button
            className="btn-cancel-new"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-send-new"
            onClick={handleSendReport}
            disabled={loading || !reportData || reportData.overall.totalQuizzes === 0}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Sending...
              </>
            ) : (
              <>
                📧 Send Report
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SendProgressReport;

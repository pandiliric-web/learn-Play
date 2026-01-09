import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import StudentProgressModal from './StudentProgressModal';
import SendProgressReport from './SendProgressReport';
import './Analytics.css';

const Analytics = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);

  // Fetch real users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAllUsers();
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
      } else {
        console.error('Failed to fetch users:', data.message);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock quiz data for demonstration (you can replace this with real quiz data later)
  const generateMockQuizData = (users) => {
    return users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // Generate random but realistic quiz performance data
      avgScore: Math.floor(Math.random() * 30) + 70, // 70-100%
      quizzesCompleted: Math.floor(Math.random() * 25) + 5, // 5-30 quizzes
      gamesPlayed: Math.floor(Math.random() * 50) + 10, // 10-60 games
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
    }));
  };

  // Get top performers based on quiz scores
  const getTopPerformers = () => {
    if (users.length === 0) return [];
    
    const usersWithQuizData = generateMockQuizData(users);
    
    // Filter out admin users and sort by average score
    return usersWithQuizData
      .filter(user => user.role !== 'admin')
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5); // Top 5 performers
  };

  const analyticsData = {
    topPerformers: getTopPerformers()
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowProgressModal(true);
  };

  const handleCloseModal = () => {
    setShowProgressModal(false);
    setSelectedStudent(null);
  };

  const handleSendSMS = (student) => {
    setSelectedStudent(student);
    setShowSMSModal(true);
  };

  const handleCloseSMSModal = () => {
    setShowSMSModal(false);
    setSelectedStudent(null);
  };

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h2>Student Performance Dashboard</h2>
      </div>

      <div className="analytics-grid">
        {/* Top Performers */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3>Top Performers</h3>
          <div className="top-performers">
            {loading ? (
              <div className="loading-message">Loading top performers...</div>
            ) : analyticsData.topPerformers.length === 0 ? (
              <div className="no-data-message">
                <div className="no-data-icon">📊</div>
                <p>No quiz data available yet</p>
                <small>Users need to complete quizzes to appear here</small>
              </div>
            ) : (
              analyticsData.topPerformers.map((performer, index) => (
                <div key={performer.id} className="performer-item">
                  <div className="performer-rank">
                    <span className={`rank-badge rank-${index + 1}`}>
                      #{index + 1}
                    </span>
                  </div>
                  <div className="performer-info">
                    <div 
                      className="performer-name clickable"
                      onClick={() => handleStudentClick(performer)}
                      title="Click to view detailed progress"
                    >
                      {performer.name}
                    </div>
                    <div className="performer-email">{performer.email}</div>
                    <div className="performer-stats">
                      <span>Score: {performer.avgScore}%</span>
                      <span>Games: {performer.gamesPlayed}</span>
                      <span>Quizzes: {performer.quizzesCompleted}</span>
                    </div>
                    <div className="performer-actions">
                      <button 
                        className="sms-btn"
                        onClick={() => handleSendSMS(performer)}
                        title="Send progress report via email"
                      >
                        📧 Send Email Report
                      </button>
                    </div>
                  </div>
                  <div className="performer-score">
                    <div className="score-circle">
                      <span>{performer.avgScore}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Student Progress Modal */}
      <StudentProgressModal
        isOpen={showProgressModal}
        onClose={handleCloseModal}
        student={selectedStudent}
      />

      {/* Send Progress Report Modal */}
      {showSMSModal && (
        <SendProgressReport
          student={selectedStudent}
          onClose={handleCloseSMSModal}
          onSuccess={() => {
            console.log('Progress report email sent successfully');
          }}
        />
      )}
    </div>
  );
};

export default Analytics;

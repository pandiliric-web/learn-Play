import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './StudentProgressModal.css';

const StudentProgressModal = ({ isOpen, onClose, student }) => {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [progressData, setProgressData] = useState(null);

  // Generate detailed progress data for the student
  useEffect(() => {
    if (student) {
      const subjects = ['Mathematics', 'Filipino', 'English', 'Science', 'History'];
      const mockProgressData = {
        student: student,
        overallStats: {
          totalQuizzes: Math.floor(Math.random() * 50) + 20,
          averageScore: student.avgScore,
          totalTimeSpent: Math.floor(Math.random() * 1200) + 300, // minutes
          streak: Math.floor(Math.random() * 15) + 1,
          lastActive: student.lastActive
        },
        subjects: subjects.map(subject => ({
          name: subject,
          icon: subject === 'Mathematics' ? '🔢' : 
                subject === 'Filipino' ? '🇵🇭' : 
                subject === 'English' ? '🇺🇸' : 
                subject === 'Science' ? '🔬' : '📚',
          quizzesCompleted: Math.floor(Math.random() * 15) + 5,
          averageScore: Math.floor(Math.random() * 30) + 70,
          highestScore: Math.floor(Math.random() * 20) + 80,
          totalTime: Math.floor(Math.random() * 300) + 60,
          recentScores: Array.from({ length: 10 }, () => Math.floor(Math.random() * 30) + 70),
          topics: subject === 'Mathematics' ? 
            ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Fractions'] :
            subject === 'Filipino' ? 
            ['Pangngalan', 'Pandiwa', 'Pang-uri', 'Pang-abay', 'Panghalip'] :
            subject === 'English' ? 
            ['Grammar', 'Vocabulary', 'Reading', 'Writing', 'Speaking'] :
            subject === 'Science' ? 
            ['Plants', 'Animals', 'Weather', 'Solar System', 'Matter'] :
            ['Philippine History', 'World History', 'Geography', 'Culture', 'Government']
        })),
        recentActivity: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          quizName: `Quiz ${i + 1}`,
          score: Math.floor(Math.random() * 30) + 70,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          timeSpent: Math.floor(Math.random() * 30) + 5
        }))
      };
      setProgressData(mockProgressData);
    }
  }, [student]);

  if (!isOpen || !student || !progressData) return null;

  const filteredSubjects = selectedSubject === 'all' 
    ? progressData.subjects 
    : progressData.subjects.filter(subject => subject.name === selectedSubject);

  const subjectOptions = [
    { value: 'all', label: 'All Subjects' },
    ...progressData.subjects.map(subject => ({
      value: subject.name,
      label: subject.name
    }))
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="student-progress-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="student-progress-modal-content"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="student-info">
              <h2>{student.name}'s Progress</h2>
              <p className="student-email">{student.email}</p>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {/* Overall Stats */}
            <div className="overall-stats">
              <h3>Overall Performance</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-value">{progressData.overallStats.totalQuizzes}</div>
                    <div className="stat-label">Total Quizzes</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <div className="stat-value">{progressData.overallStats.averageScore}%</div>
                    <div className="stat-label">Average Score</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-content">
                    <div className="stat-value">{Math.floor(progressData.overallStats.totalTimeSpent / 60)}h</div>
                    <div className="stat-label">Time Spent</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-content">
                    <div className="stat-value">{progressData.overallStats.streak}</div>
                    <div className="stat-label">Day Streak</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Filter */}
            <div className="subject-filter">
              <label>Filter by Subject:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {subjectOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Performance */}
            <div className="subject-performance">
              <h3>Subject Performance</h3>
              <div className="subjects-grid">
                {filteredSubjects.map((subject, index) => (
                  <motion.div
                    key={subject.name}
                    className="subject-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="subject-header">
                      <span className="subject-icon">{subject.icon}</span>
                      <h4>{subject.name}</h4>
                    </div>
                    <div className="subject-stats">
                      <div className="stat-row">
                        <span>Quizzes Completed:</span>
                        <span>{subject.quizzesCompleted}</span>
                      </div>
                      <div className="stat-row">
                        <span>Average Score:</span>
                        <span className="score">{subject.averageScore}%</span>
                      </div>
                      <div className="stat-row">
                        <span>Highest Score:</span>
                        <span className="score high">{subject.highestScore}%</span>
                      </div>
                      <div className="stat-row">
                        <span>Time Spent:</span>
                        <span>{Math.floor(subject.totalTime / 60)}h {subject.totalTime % 60}m</span>
                      </div>
                    </div>
                    <div className="score-chart">
                      <h5>Recent Scores</h5>
                      <div className="mini-chart">
                        {subject.recentScores.slice(0, 8).map((score, i) => (
                          <div
                            key={i}
                            className="chart-bar"
                            style={{ height: `${score}%` }}
                            title={`${score}%`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className="topics">
                      <h5>Topics Covered</h5>
                      <div className="topics-list">
                        {subject.topics.map((topic, i) => (
                          <span key={i} className="topic-tag">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {progressData.recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.quizName}</div>
                      <div className="activity-subject">{activity.subject}</div>
                    </div>
                    <div className="activity-score">{activity.score}%</div>
                    <div className="activity-time">{activity.timeSpent}m</div>
                    <div className="activity-date">
                      {activity.date.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudentProgressModal;

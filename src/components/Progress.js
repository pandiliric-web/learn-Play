import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Progress.css';
import { progressAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Progress = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentProgress, setSelectedStudentProgress] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGameType, setFilterGameType] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadStudents = async () => {
      setStudentsLoading(true);
      try {
        const res = await progressAPI.getStudents();
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          setStudents(list);
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error('Failed to load students', err);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    if (!loading && user && (user.role === 'teacher' || user.role === 'admin')) {
      loadStudents();
    }
  }, [user, loading]);

  const openStudentModal = async (studentId) => {
    setSelectedStudentId(studentId);
    setModalOpen(true);
    try {
      const res = await progressAPI.getStudentProgress(studentId);
      if (res.ok) {
        const json = await res.json();
        setSelectedStudentProgress(json);
      } else {
        setSelectedStudentProgress({ student: null, data: [] });
      }
    } catch (err) {
      console.error('Failed to load student progress', err);
      setSelectedStudentProgress({ student: null, data: [] });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStudentId(null);
    setSelectedStudentProgress(null);
  };

  const calculateStats = (progressData) => {
    if (!progressData || !progressData.data || progressData.data.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        totalTimeSpent: 0,
        bySubject: {},
        byGameType: {}
      };
    }

    const data = progressData.data;
    const totalAttempts = data.length;
    const totalScore = data.reduce((sum, entry) => sum + (entry.quizScore || 0), 0);
    const averageScore = Math.round(totalScore / totalAttempts);
    const highestScore = Math.max(...data.map(e => e.quizScore || 0));
    const totalTimeSpent = data.reduce((sum, entry) => sum + (entry.timeSpent || 0), 0);

    const bySubject = {};
    ['Mathematics', 'English', 'Filipino'].forEach(subject => {
      const subjectData = data.filter(e => e.subject === subject);
      if (subjectData.length > 0) {
        const subjTotal = subjectData.reduce((sum, e) => sum + (e.quizScore || 0), 0);
        bySubject[subject] = {
          count: subjectData.length,
          average: Math.round(subjTotal / subjectData.length),
          highest: Math.max(...subjectData.map(e => e.quizScore || 0))
        };
      }
    });

    const byGameType = {};
    ['Quiz', 'Game', 'Practice'].forEach(type => {
      const typeData = data.filter(e => e.gameType === type);
      if (typeData.length > 0) {
        const typeTotal = typeData.reduce((sum, e) => sum + (e.quizScore || 0), 0);
        byGameType[type] = {
          count: typeData.length,
          average: Math.round(typeTotal / typeData.length)
        };
      }
    });

    return {
      totalAttempts,
      averageScore,
      highestScore,
      totalTimeSpent,
      bySubject,
      byGameType
    };
  };

  const getFilteredData = () => {
    if (!selectedStudentProgress || !selectedStudentProgress.data) return [];
    
    let filtered = [...selectedStudentProgress.data];
    
    if (filterSubject !== 'all') {
      filtered = filtered.filter(e => e.subject === filterSubject);
    }
    
    if (filterGameType !== 'all') {
      filtered = filtered.filter(e => e.gameType === filterGameType);
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'score-desc':
          return (b.quizScore || 0) - (a.quizScore || 0);
        case 'score-asc':
          return (a.quizScore || 0) - (b.quizScore || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = selectedStudentProgress ? calculateStats(selectedStudentProgress) : null;
  const filteredData = getFilteredData();

  const getScoreBadgeClass = (score) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 70) return 'score-average';
    return 'score-needs-improvement';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Mathematics': '#FF6B6B',
      'English': '#45B7D1',
      'Filipino': '#4ECDC4'
    };
    return colors[subject] || '#667eea';
  };

  const getGameTypeIcon = (type) => {
    const icons = {
      'Quiz': '📝',
      'Game': '🎮',
      'Practice': '📚'
    };
    return icons[type] || '📊';
  };

  return (
    <div className="progress-page-new">
      {/* New Modern Hero Section */}
      <div className="progress-hero-section-new">
        <div className="progress-hero-background">
          <div className="hero-gradient-orb orb-1"></div>
          <div className="hero-gradient-orb orb-2"></div>
          <div className="hero-gradient-orb orb-3"></div>
        </div>
        <div className="progress-hero-content-new">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text-wrapper"
          >
            <Link to="/" className="progress-back-link-new">
              <span className="back-icon">←</span>
              <span>Home</span>
            </Link>
            <h1 className="progress-hero-title-new">
              <span className="title-accent">Track</span> Student Progress
            </h1>
            <p className="progress-hero-subtitle-new">
              Monitor and analyze student performance across all subjects, quizzes, and interactive games. Get detailed insights into learning patterns and achievements.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{filteredStudents.length}</span>
                <span className="stat-label">Students</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">{selectedStudentProgress ? selectedStudentProgress.data?.length || 0 : 0}</span>
                <span className="stat-label">Records</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="progress-content-wrapper-new">
        <div className="progress-container">

          {/* Search and Stats Bar - New Design */}
          <motion.div
            className="progress-controls-section-new"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="controls-header">
              <h3 className="controls-title-new">Search Students</h3>
              <p className="controls-subtitle">Find students by name or email address</p>
            </div>
            <div className="search-wrapper-new">
              <div className="search-box-new">
                <span className="search-icon-new">🔍</span>
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-new"
                />
              </div>
              <div className="stats-badge-new">
                <span className="stats-icon-new">👥</span>
                <div className="stats-info">
                  <span className="stats-number">{filteredStudents.length}</span>
                  <span className="stats-label-text">Student{filteredStudents.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Students Grid - New Design */}
          <motion.div
            className="students-grid-new-modern"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {studentsLoading ? (
              <div className="progress-loading-state-new">
                <div className="loading-spinner-new-progress"></div>
                <p className="loading-text-new">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="progress-empty-state-new">
                <div className="empty-icon-new-progress">👥</div>
                <h3 className="empty-title-new">No Students Found</h3>
                <p className="empty-text-new">{searchTerm ? 'Try adjusting your search terms.' : 'There are no students registered yet.'}</p>
              </div>
            ) : (
              filteredStudents.map((st, index) => (
                <motion.div
                  key={st._id}
                  className="student-card-new-modern"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -12, transition: { duration: 0.3 } }}
                  onClick={() => openStudentModal(st._id)}
                >
                  <div className="student-card-gradient" style={{ background: `linear-gradient(135deg, #667eea15, #764ba205)` }}></div>
                  <div className="student-card-content-new">
                    <div className="student-card-top">
                      <div 
                        className="student-avatar-new-modern"
                        style={{ 
                          background: `linear-gradient(135deg, #667eea, #764ba2)`,
                          boxShadow: `0 8px 24px rgba(102, 126, 234, 0.3)`
                        }}
                      >
                        {st.avatarUrl ? (
                          <img src={st.avatarUrl} alt={st.name} />
                        ) : (
                          <span>{st.name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="student-badge-new">
                        <span className="badge-icon">📊</span>
                      </div>
                    </div>
                    <div className="student-card-main">
                      <h3 className="student-name-new-modern">{st.name}</h3>
                      <p className="student-email-new-modern">{st.email || 'No email'}</p>
                    </div>
                    <div className="student-card-action">
                      <button
                        className="view-progress-button-new"
                        style={{ 
                          background: `linear-gradient(135deg, #667eea, #764ba2)`,
                          boxShadow: `0 4px 16px rgba(102, 126, 234, 0.4)`
                        }}
                      >
                        <span>View Progress</span>
                        <span className="button-icon-new">→</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* Student Progress Modal */}
      {modalOpen && selectedStudentProgress && (
        <div className="progress-modal-overlay-new" onClick={closeModal}>
          <motion.div 
            className="progress-modal-new"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Modal Header */}
            <div className="modal-header-new">
              <div className="header-left">
                <div className="header-avatar">
                  {selectedStudentProgress.student?.avatarUrl ? (
                    <img src={selectedStudentProgress.student.avatarUrl} alt={selectedStudentProgress.student.name} />
                  ) : (
                    <span>{selectedStudentProgress.student?.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="header-info">
                  <h2>{selectedStudentProgress.student?.name || 'Student'}'s Performance</h2>
                  <p>Complete analytics and progress tracking</p>
                </div>
              </div>
              <button className="close-btn-new" onClick={closeModal}>×</button>
            </div>

            {/* Statistics Cards */}
            {stats && stats.totalAttempts > 0 && (
              <div className="stats-grid-new">
                <div className="stat-card-new">
                  <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    <span className="stat-icon">📊</span>
                  </div>
                  <div className="stat-details">
                    <div className="stat-value-new">{stats.totalAttempts}</div>
                    <div className="stat-label-new">Total Attempts</div>
                  </div>
                </div>
                <div className="stat-card-new">
                  <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                    <span className="stat-icon">⭐</span>
                  </div>
                  <div className="stat-details">
                    <div className="stat-value-new" style={{ color: stats.averageScore >= 80 ? '#10b981' : stats.averageScore >= 70 ? '#f59e0b' : '#ef4444' }}>
                      {stats.averageScore}%
                    </div>
                    <div className="stat-label-new">Average Score</div>
                  </div>
                </div>
                <div className="stat-card-new">
                  <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                    <span className="stat-icon">🏆</span>
                  </div>
                  <div className="stat-details">
                    <div className="stat-value-new">{stats.highestScore}%</div>
                    <div className="stat-label-new">Highest Score</div>
                  </div>
                </div>
                <div className="stat-card-new">
                  <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
                    <span className="stat-icon">⏱️</span>
                  </div>
                  <div className="stat-details">
                    <div className="stat-value-new">{formatTime(stats.totalTimeSpent)}</div>
                    <div className="stat-label-new">Total Time</div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            {stats && stats.totalAttempts > 0 && (
              <div className="filters-bar-new">
                <div className="filter-item">
                  <label>Subject</label>
                  <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                    <option value="all">All Subjects</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="English">English</option>
                    <option value="Filipino">Filipino</option>
                  </select>
                </div>
                <div className="filter-item">
                  <label>Type</label>
                  <select value={filterGameType} onChange={(e) => setFilterGameType(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Game">Game</option>
                    <option value="Practice">Practice</option>
                  </select>
                </div>
                <div className="filter-item">
                  <label>Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="score-desc">Highest Score</option>
                    <option value="score-asc">Lowest Score</option>
                  </select>
                </div>
              </div>
            )}

            {/* Progress Table */}
            <div className="table-section-new">
              {!selectedStudentProgress.data || selectedStudentProgress.data.length === 0 ? (
                <div className="empty-state-table">
                  <div className="empty-icon-table">📝</div>
                  <h3>No Progress Recorded</h3>
                  <p>This student hasn't completed any quizzes or games yet.</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="empty-state-table">
                  <div className="empty-icon-table">🔍</div>
                  <h3>No Results Found</h3>
                  <p>Try adjusting your filters to see more results.</p>
                </div>
              ) : (
                <div className="table-wrapper-new">
                  <table className="progress-table-new">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Subject</th>
                        <th>Type</th>
                        <th>Score</th>
                        <th>Correct</th>
                        <th>Time</th>
                        <th>Difficulty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((entry) => (
                        <tr key={entry._id}>
                          <td>
                            <div className="date-primary-new">
                              {new Date(entry.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </div>
                            <div className="date-secondary-new">
                              {new Date(entry.createdAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td>
                            <span 
                              className="subject-tag"
                              style={{ 
                                backgroundColor: `${getSubjectColor(entry.subject)}20`,
                                color: getSubjectColor(entry.subject),
                                borderColor: getSubjectColor(entry.subject)
                              }}
                            >
                              {entry.subject}
                            </span>
                          </td>
                          <td>
                            <span className="type-tag">
                              {getGameTypeIcon(entry.gameType)} {entry.gameType}
                            </span>
                          </td>
                          <td>
                            <span className={`score-tag ${getScoreBadgeClass(entry.quizScore)}`}>
                              {entry.quizScore}%
                            </span>
                          </td>
                          <td className="correct-cell-new">
                            <strong>{entry.correctAnswers}</strong> / {entry.totalQuestions}
                          </td>
                          <td className="time-cell-new">{formatTime(entry.timeSpent || 0)}</td>
                          <td>
                            <span className={`difficulty-tag difficulty-${entry.difficulty?.toLowerCase()}`}>
                              {entry.difficulty || 'Medium'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Progress;

import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeNotification from './WelcomeNotification';
import './Subjects.css';
import { subjectAPI } from '../services/api';

// Helper function to map subject names for display
const getDisplayName = (name) => {
  if (!name) return name;
  const upperName = name.toUpperCase().trim();
  if (upperName === 'PH') return 'Filipino';
  if (upperName === 'US') return 'English';
  return name;
};

// Helper function to get appropriate icon based on subject name
const getSubjectIcon = (name, currentIcon) => {
  if (!name) return currentIcon || '📚';
  const upperName = name.toUpperCase().trim();
  if (upperName === 'PH' || upperName === 'FILIPINO') return '📝';
  if (upperName === 'US' || upperName === 'ENGLISH') return '✍️';
  return currentIcon || '📚';
};

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await subjectAPI.getSubjects();
        if (!mounted) return;
        if (!res.ok) throw new Error('Failed to fetch subjects');
        const json = await res.json();
        const data = (json.data || []).map((s) => ({
          id: s._id || s.id,
          name: s.name,
          icon: s.icon || '📚',
          color: s.color || '#3498db',
          description: s.description || '',
          topics: [],
          difficulty: 'Beginner to Intermediate',
          games: []
        }));
        setSubjects(data);
        if (data.length) setExpandedSubjectId(data[0].id);
      } catch (err) {
        console.error('Subjects load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const toggleSubject = (subjectId) => {
    setExpandedSubjectId(expandedSubjectId === subjectId ? null : subjectId);
  };

  return (
    <div className="subjects-page-new">
      <WelcomeNotification
        pageId="subjects"
        title="Suhid ang mga Subject 📚"
        message="Kini ang Subjects page diin makita ninyo ang tanan nga available nga mga subject sama sa Mathematics, Filipino, ug English. I-klik ang bisan unsang subject card aron makita ang daghang detalye. Makahimo mo usab og quiz o magdula og mga dula nga may kalabotan sa matag subject!"
        icon="📚"
      />
      <div className="subjects-container">
        {/* Hero Banner */}
        <motion.div 
          className="subjects-hero"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-wrapper">
            <div className="hero-badge">🎓 Explore Learning</div>
            <h1 className="hero-title-new">Discover Your Learning Path</h1>
            <p className="hero-description">
              Choose from our interactive subjects and start your educational journey with fun, engaging activities
            </p>
          </div>
        </motion.div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="subjects-loading">
            <div className="loading-spinner"></div>
            <p>Loading subjects...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="subjects-empty">
            <div className="empty-icon">📚</div>
            <h3>No Subjects Available</h3>
            <p>Subjects will appear here once they are added to the system.</p>
          </div>
        ) : (
          <div className="subjects-grid-new">
            {subjects.map((subject, index) => {
              const isExpanded = expandedSubjectId === subject.id;
              return (
                <motion.div
                  key={subject.id}
                  className={`subject-card-new ${isExpanded ? 'expanded' : ''}`}
                  style={{ '--subject-color': subject.color }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  {/* Card Header */}
                  <div 
                    className="card-header-new"
                    onClick={() => toggleSubject(subject.id)}
                  >
                    <div className="header-left-new">
                      <div 
                        className="subject-icon-new"
                        style={{ backgroundColor: `${subject.color}20`, borderColor: subject.color }}
                      >
                        {getSubjectIcon(subject.name, subject.icon)}
                      </div>
                      <div className="subject-info-new">
                        <h3 className="subject-name-new">{getDisplayName(subject.name)}</h3>
                        <p className="subject-desc-new">{subject.description || 'Start learning with interactive activities'}</p>
                      </div>
                    </div>
                    <div className="header-right-new">
                      <div className="difficulty-tag-new">
                        <span className="tag-icon">⭐</span>
                        <span>{subject.difficulty}</span>
                      </div>
                      <button className="expand-btn">
                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="card-content-new"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="content-sections">
                          <div className="section-item">
                            <div className="section-icon">📖</div>
                            <div className="section-text">
                              <h4>What You'll Learn</h4>
                              <p>Interactive lessons and activities designed to enhance your understanding</p>
                            </div>
                          </div>

                          <div className="section-item">
                            <div className="section-icon">🎯</div>
                            <div className="section-text">
                              <h4>Difficulty Level</h4>
                              <div className="difficulty-display">
                                <span className="difficulty-badge-new">{subject.difficulty}</span>
                              </div>
                            </div>
                          </div>

                          <div className="section-item">
                            <div className="section-icon">🎮</div>
                            <div className="section-text">
                              <h4>Available Activities</h4>
                              <p>Engaging games, quizzes, and interactive exercises</p>
                            </div>
                          </div>
                        </div>

                        <div className="card-actions-new">
                          <Link 
                            to="/quiz" 
                            className="action-btn-primary"
                            style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}dd)` }}
                          >
                            <span className="btn-icon">📝</span>
                            <span>Take a Quiz</span>
                          </Link>
                          <Link 
                            to="/" 
                            className="action-btn-secondary"
                          >
                            <span className="btn-icon">🎮</span>
                            <span>Play Games</span>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Quick Start Guide */}
        <motion.div 
          className="quick-start-new"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="guide-header">
            <h2 className="guide-title">How to Get Started</h2>
            <p className="guide-subtitle">Follow these simple steps to begin your learning journey</p>
          </div>
          
          <div className="steps-grid-new">
            <motion.div 
              className="step-card-new"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="step-number-new">1</div>
              <div className="step-content">
                <h3>Choose a Subject</h3>
                <p>Select Mathematics, Filipino, or English to begin</p>
              </div>
            </motion.div>

            <motion.div 
              className="step-card-new"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="step-number-new">2</div>
              <div className="step-content">
                <h3>Select a Game</h3>
                <p>Pick from various interactive games and activities</p>
              </div>
            </motion.div>

            <motion.div 
              className="step-card-new"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="step-number-new">3</div>
              <div className="step-content">
                <h3>Start Playing</h3>
                <p>Begin learning with fun and engaging gameplay</p>
              </div>
            </motion.div>

            {user && (user.role === 'teacher' || user.role === 'admin') && (
              <motion.div 
                className="step-card-new"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="step-number-new">4</div>
                <div className="step-content">
                  <h3>Track Progress</h3>
                  <p>Monitor student learning and achievements</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Subjects;

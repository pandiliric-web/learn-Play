import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { quizAPI, subjectAPI, progressAPI } from '../services/api';
import indexedDBManager from '../utils/indexedDB';
import offlineSyncService from '../services/offlineSync';
import { useAuth } from '../contexts/AuthContext';
import WelcomeNotification from './WelcomeNotification';
import './Quiz.css';

const SUBJECT_META = {
  Mathematics: { icon: '🔢', color: '#FF6B6B' },
  English: { icon: '🇺🇸', color: '#45B7D1' },
  Filipino: { icon: '🇵🇭', color: '#4ECDC4' },
  default: { icon: '🧠', color: '#9b59b6' }
};

const SUBJECT_ALIAS_MAP = {
  US: { label: 'English', canonical: 'English' },
  PH: { label: 'Filipino', canonical: 'Filipino' },
  GHG: { label: 'Mathematics', canonical: 'Mathematics' }
};

const resolveSubject = (subject) => {
  if (!subject) {
    return { label: 'General', canonical: 'default', code: '' };
  }
  const trimmed = subject.trim();
  const code = trimmed.toUpperCase();
  const alias = SUBJECT_ALIAS_MAP[code];
  if (alias) {
    return { ...alias, code };
  }
  return { label: trimmed, canonical: trimmed, code };
};

const shouldUseLabelIcon = (iconCandidate = '') => {
  const trimmed = iconCandidate.trim();
  if (!trimmed) return true;
  if (SUBJECT_ALIAS_MAP[trimmed.toUpperCase()]) return true;
  const plainWord = /^[A-Za-z0-9\s]+$/.test(trimmed);
  return plainWord && trimmed.length <= 4;
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '102, 126, 234';
};

const Quiz = () => {
  const { user } = useAuth();
  const [currentQuiz, setCurrentQuiz] = useState('menu');
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('all');
  // default sorting (newest first)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const quizStartTime = useRef(null);

  const getAccentColor = (quiz) => {
    if (!quiz) return '#667eea';
    const canonical = quiz.canonicalSubject || resolveSubject(quiz.subject).canonical;
    const meta = SUBJECT_META[canonical] || SUBJECT_META.default;
    return quiz.color || meta.color;
  };

  const accentColor = getAccentColor(quizData);

  useEffect(() => {
    const loadQuizzes = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await quizAPI.getQuizzes();
        const data = await response.json();
        if (response.ok) {
          const enriched = Array.isArray(data.quizzes)
            ? data.quizzes.map((quiz) => {
                const subjectInfo = resolveSubject(quiz.subject);
                const meta = SUBJECT_META[subjectInfo.canonical] || SUBJECT_META.default;
                const iconCandidate = quiz.icon || '';
                const isAliasSubject = Boolean(SUBJECT_ALIAS_MAP[subjectInfo.code]);
                const displayIcon =
                  isAliasSubject || shouldUseLabelIcon(iconCandidate)
                    ? subjectInfo.label
                    : iconCandidate;
                return {
                  ...quiz,
                  subjectLabel: subjectInfo.label,
                  canonicalSubject: subjectInfo.canonical,
                  displayIcon,
                  color: quiz.color || meta.color,
                  description: quiz.description || `Custom quiz for ${subjectInfo.label}`,
                  displayTitle: quiz.title || `${subjectInfo.label} Quiz`
                };
              })
            : [];
          setQuizzes(enriched);
        } else {
          setQuizzes([]);
          setError(data.message || 'Unable to load quizzes');
        }
      } catch (err) {
        console.error(err);
        setQuizzes([]);
        setError('Unable to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    const loadSubjects = async () => {
      try {
        const res = await subjectAPI.getSubjects();
        console.log('[Quiz] GET /api/subjects status:', res.status);
        if (!res.ok) return setSubjectsList([]);
        const json = await res.json();
        console.log('[Quiz] subjects payload:', json);
        const data = (json.data || []).map((s) => ({
          id: s._id || s.id,
          name: s.name,
          icon: s.icon || '📚',
          color: s.color || '#3498db'
        }));
        setSubjectsList(data);
      } catch (err) {
        console.error('Failed to load subjects', err);
        setSubjectsList([]);
      }
    };

    loadQuizzes();
    loadSubjects();
  }, []);

  const buildQuestionForPlay = (question) => {
    const type = question.type || 'multiple-choice';
    if (type === 'true-false') {
      const options = ['True', 'False'];
      const answer = (question.answer || 'True').trim().toLowerCase() === 'false' ? 1 : 0;
      return {
        type: 'true-false',
        question: question.text,
        options,
        correctIndex: answer
      };
    }

    if (type === 'short-answer') {
      return {
        type: 'short-answer',
        question: question.text,
        answerText: (question.answer || '').trim()
      };
    }

    const rawOptions = (question.options || []).map((opt) => opt.trim());
    const filteredOptions = rawOptions.filter(Boolean);
    let answerText = (question.answer || '').trim();
    let correctIndex = filteredOptions.findIndex(
      (opt) => opt.toLowerCase() === answerText.toLowerCase()
    );
    if (filteredOptions.length === 0) {
      filteredOptions.push('Option 1');
    }
    if (correctIndex === -1) {
      if (answerText && filteredOptions.includes(answerText)) {
        correctIndex = filteredOptions.indexOf(answerText);
      } else if (answerText) {
        filteredOptions.push(answerText);
        correctIndex = filteredOptions.length - 1;
      } else {
        correctIndex = 0;
      }
    }
    return {
      type: 'multiple-choice',
      question: question.text,
      options: filteredOptions,
      correctIndex
    };
  };

  const startQuiz = (quizId) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    if (!quiz.questions || quiz.questions.length === 0) {
      alert('This quiz has no questions yet. Please ask the teacher to add questions first.');
      return;
    }

    const formattedQuestions = quiz.questions.map(buildQuestionForPlay);
    const activeQuiz = {
      ...quiz,
      questions: formattedQuestions
    };

    setQuizData(activeQuiz);
    setCurrentQuiz(quizId);
    setScore(0);
    setCurrentQuestion(0);
    setUserAnswers({});
    setShowResults(false);
    quizStartTime.current = Date.now(); // Track when quiz starts
  };

  const handleAnswer = (answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerIndex
    }));
  };

  const handleShortAnswer = (value) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion]: value
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
      setShowResults(true);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Save quiz result offline to IndexedDB
  const saveQuizResultOffline = async (quizData, progressData, correctAnswers, totalQuestions, timeSpent, userAnswers) => {
    try {
      await indexedDBManager.init();
      
      // Prepare answer data
      const answers = quizData.questions.map((question, index) => {
        const userAnswer = userAnswers[index];
        return {
          questionId: question.id || index,
          questionText: question.text,
          userAnswer: userAnswer,
          correctAnswer: question.correctIndex || question.answerText,
          isCorrect: question.type === 'short-answer' 
            ? (userAnswer || '').trim().toLowerCase() === (question.answerText || '').trim().toLowerCase()
            : userAnswer === question.correctIndex
        };
      });

      const quizResult = {
        userId: user._id || user.id,
        quizId: quizData.id || quizData._id,
        score: progressData.quizScore,
        totalItems: totalQuestions,
        correctAnswers: correctAnswers,
        timeSpent: timeSpent,
        difficulty: progressData.difficulty,
        subject: progressData.subject,
        answers: answers
      };

      await indexedDBManager.saveQuizResult(quizResult);
      console.log('[Quiz] ✅ Quiz result saved offline');

      // Show notification to user
      if (window.showOfflineNotification) {
        window.showOfflineNotification('Quiz result saved offline. It will sync when you\'re back online.');
      }

      // Try to sync immediately if online
      if (navigator.onLine) {
        setTimeout(() => offlineSyncService.syncAll(), 1000);
      }
    } catch (error) {
      console.error('[Quiz] ❌ Error saving quiz result offline:', error);
      throw error;
    }
  };

  const calculateScore = async () => {
    let correctAnswers = 0;
    quizData.questions.forEach((question, index) => {
      const provided = userAnswers[index];
      if (question.type === 'short-answer') {
        if (
          (provided || '').trim().toLowerCase() ===
          (question.answerText || '').trim().toLowerCase()
        ) {
          correctAnswers++;
        }
      } else if (provided !== undefined && provided === question.correctIndex) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);

    // Calculate time spent in seconds
    const timeSpent = quizStartTime.current ? Math.floor((Date.now() - quizStartTime.current) / 1000) : 0;
    
    // Calculate percentage score
    const totalQuestions = quizData.questions.length;
    const percentageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Save progress to backend (only if user is logged in and is a student)
    if (user && user.role === 'student' && quizData && quizData.subject) {
      // Prepare progressData outside try block so it's available in catch
      let progressData = null;
      
      try {
        console.log('[Quiz] Attempting to save progress...', {
          user: user.email,
          role: user.role,
          quizSubject: quizData.subject,
          score: percentageScore,
          correctAnswers,
          totalQuestions,
          timeSpent
        });

        // Map subject to match Progress model enum values
        let subjectName = quizData.subject;
        const subjectMap = {
          'US': 'English',
          'PH': 'Filipino',
          'GHG': 'Mathematics'
        };
        
        // Also check if subject is already in correct format
        if (subjectMap[subjectName]) {
          subjectName = subjectMap[subjectName];
        } else if (!['Mathematics', 'English', 'Filipino'].includes(subjectName)) {
          // Try to match by partial name
          const lowerSubject = subjectName.toLowerCase();
          if (lowerSubject.includes('math') || lowerSubject.includes('mathematics')) {
            subjectName = 'Mathematics';
          } else if (lowerSubject.includes('english') || lowerSubject.includes('eng')) {
            subjectName = 'English';
          } else if (lowerSubject.includes('filipino') || lowerSubject.includes('fil')) {
            subjectName = 'Filipino';
          }
        }

        progressData = {
          subject: subjectName,
          quizScore: percentageScore,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          timeSpent: timeSpent,
          difficulty: quizData.difficulty || 'Medium',
          gameType: 'Quiz'
        };

        console.log('[Quiz] Sending progress data:', progressData);

        // Check if online or offline
        if (navigator.onLine) {
          try {
            const response = await progressAPI.saveProgress(progressData);
            const result = await response.json();

            if (response.ok) {
              console.log('[Quiz] ✅ Progress saved successfully!', result);
            } else {
              // If online save fails, save offline
              console.warn('[Quiz] Online save failed, saving offline:', result);
              await saveQuizResultOffline(quizData, progressData, correctAnswers, totalQuestions, timeSpent, userAnswers);
            }
          } catch (err) {
            console.error('[Quiz] ❌ Error saving quiz progress online:', err);
            // Save offline as fallback
            if (progressData) {
              await saveQuizResultOffline(quizData, progressData, correctAnswers, totalQuestions, timeSpent, userAnswers);
            }
          }
        } else {
          // Offline: save to IndexedDB
          console.log('[Quiz] Offline mode: Saving quiz result locally');
          await saveQuizResultOffline(quizData, progressData, correctAnswers, totalQuestions, timeSpent, userAnswers);
        }
      } catch (err) {
        console.error('[Quiz] ❌ Error saving quiz progress:', err);
        // Try to save offline as last resort (only if progressData was created)
        if (progressData) {
          try {
            await saveQuizResultOffline(quizData, progressData, correctAnswers, totalQuestions, timeSpent, userAnswers);
          } catch (offlineErr) {
            console.error('[Quiz] ❌ Error saving offline:', offlineErr);
          }
        } else {
          // If progressData wasn't created, try to create it now for offline save
          try {
            let subjectName = quizData?.subject || 'Mathematics';
            const subjectMap = {
              'US': 'English',
              'PH': 'Filipino',
              'GHG': 'Mathematics'
            };
            if (subjectMap[subjectName]) {
              subjectName = subjectMap[subjectName];
            }
            
            progressData = {
              subject: subjectName,
              quizScore: percentageScore,
              totalQuestions: totalQuestions,
              correctAnswers: correctAnswers,
              timeSpent: timeSpent,
              difficulty: quizData?.difficulty || 'Medium',
              gameType: 'Quiz'
            };
            
            await saveQuizResultOffline(quizData, progressData, correctAnswers, totalQuestions, timeSpent, userAnswers);
          } catch (offlineErr) {
            console.error('[Quiz] ❌ Error saving offline:', offlineErr);
          }
        }
      }
    } else {
      console.log('[Quiz] Progress not saved - conditions not met:', {
        hasUser: !!user,
        userRole: user?.role,
        hasQuizData: !!quizData,
        quizSubject: quizData?.subject
      });
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz('menu');
    setScore(0);
    setCurrentQuestion(0);
    setUserAnswers({});
    setShowResults(false);
    setQuizData(null);
  };

  const getScoreMessage = () => {
    if (!quizData || quizData.questions.length === 0) return '';
    const percentage = (score / quizData.questions.length) * 100;
    if (percentage >= 80) return 'Excellent! You are a master! 🏆';
    if (percentage >= 60) return 'Good job! Keep learning! 🌟';
    if (percentage >= 40) return 'Not bad! Practice more! 💪';
    return 'Keep trying! You can do better! 📚';
  };

  const getScoreColor = () => {
    if (!quizData || quizData.questions.length === 0) return '#28a745';
    const percentage = (score / quizData.questions.length) * 100;
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    if (percentage >= 40) return '#fd7e14';
    return '#dc3545';
  };

  return (
    <div className="quiz-page">
      <WelcomeNotification
        pageId="quiz"
        title="Oras sa Quiz Challenge! 📝"
        message="Pag-abot sa Quiz section! Dinhi makasulayan ninyo ang inyong kahibalo pinaagi sa pagkuha og quiz nga gihimo sa inyong mga magtutudlo. I-filter ang mga quiz pinaagi sa subject gamit ang mga tab sa taas, unya i-klik ang 'Start Quiz' sa bisan unsang quiz card. Tubaga ang tanan nga mga pangutana ug tan-awa ang inyong resulta sa katapusan. Good luck!"
        icon="📝"
      />
      {/* New Modern Hero Section */}
      <div className="quiz-hero-section-new">
        <div className="quiz-hero-background">
          <div className="hero-gradient-orb orb-1"></div>
          <div className="hero-gradient-orb orb-2"></div>
          <div className="hero-gradient-orb orb-3"></div>
        </div>
        <div className="quiz-hero-content-new">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text-wrapper"
          >
            <Link to="/" className="quiz-back-link-new">
              <span className="back-icon">←</span>
              <span>Home</span>
            </Link>
            <h1 className="quiz-hero-title-new">
              <span className="title-accent">Challenge</span> Your Mind
            </h1>
            <p className="quiz-hero-subtitle-new">
              Explore interactive quizzes designed by educators. Test your knowledge, track your progress, and learn something new every day.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{quizzes.length}</span>
                <span className="stat-label">Quizzes</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">{subjectsList.length}</span>
                <span className="stat-label">Subjects</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="quiz-content-wrapper-new">
        <AnimatePresence mode="wait">
          {currentQuiz === 'menu' ? (
            <motion.div
              key="menu"
              className="quiz-menu-container-new"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* New Filter Section - Horizontal Tabs */}
              {subjectsList.length > 0 && (
                <div className="quiz-filters-section-new">
                  <div className="filters-header">
                    <h3 className="filters-title-new">Browse by Subject</h3>
                    <p className="filters-subtitle">Select a subject to filter quizzes</p>
                  </div>
                  <div className="subjects-filter-grid-new">
                    <button
                      key="all"
                      className={`filter-tab ${subjectFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setSubjectFilter('all')}
                    >
                      <span className="filter-icon-new">📚</span>
                      <span className="filter-text">All</span>
                    </button>
                    {subjectsList.map(s => (
                      <button
                        key={s.id}
                        className={`filter-tab ${subjectFilter === s.name ? 'active' : ''}`}
                        onClick={() => setSubjectFilter(s.name)}
                        style={{ 
                          '--subject-color': s.color,
                          '--subject-color-rgb': hexToRgb(s.color)
                        }}
                      >
                        <span className="filter-icon-new">{s.icon}</span>
                        <span className="filter-text">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <motion.div
                  className="quiz-error-banner-new"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="error-content">
                    <span className="error-icon-new">⚠️</span>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}

              {loading ? (
                <div className="quiz-loading-state-new">
                  <div className="loading-spinner-new"></div>
                  <p className="loading-text">Loading quizzes...</p>
                </div>
              ) : quizzes.length === 0 ? (
                <div className="quiz-empty-state-new">
                  <div className="empty-icon-new">📝</div>
                  <h3 className="empty-title">No Quizzes Available</h3>
                  <p className="empty-text">Teachers haven't created any quizzes yet. Check back later!</p>
                </div>
              ) : (
                <div className="quizzes-card-grid-new">
                  {quizzes
                    .filter(q => subjectFilter === 'all' ? true : ((q.subject || q.subjectLabel || '').toLowerCase() === subjectFilter.toLowerCase()))
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                    .map((quiz, index) => {
                    const typeLabels = new Set(
                      (quiz.questions || []).map((q) => (q.type || 'Multiple Choice'))
                    );
                    const typeDisplay =
                      typeLabels.size === 0
                        ? 'No questions'
                        : Array.from(typeLabels)
                            .map((label) =>
                              label
                                .replace('multiple-choice', 'Multiple Choice')
                                .replace('true-false', 'True/False')
                                .replace('short-answer', 'Short Answer')
                            )
                            .join(' · ');

                    return (
                      <motion.div
                        key={quiz.id}
                        className="quiz-card-new"
                        style={{ 
                          '--quiz-color': quiz.color,
                          '--quiz-color-rgb': hexToRgb(quiz.color)
                        }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -12, transition: { duration: 0.3 } }}
                      >
                        <div className="quiz-card-gradient" style={{ background: `linear-gradient(135deg, ${quiz.color}15, ${quiz.color}05)` }}></div>
                        <div className="quiz-card-content">
                          <div className="quiz-card-top">
                            <div 
                              className="quiz-card-icon-new"
                              style={{ 
                                background: `linear-gradient(135deg, ${quiz.color}, ${quiz.color}dd)`,
                                boxShadow: `0 8px 24px ${quiz.color}30`
                              }}
                            >
                              <span>{quiz.displayIcon || quiz.subjectLabel}</span>
                            </div>
                            <div className="quiz-card-badge-new">
                              <span className="badge-number">{quiz.questions?.length || 0}</span>
                              <span className="badge-label">Questions</span>
                            </div>
                          </div>
                          <div className="quiz-card-main">
                            <h3 className="quiz-card-title-new">{quiz.displayTitle || quiz.title}</h3>
                            <p className="quiz-card-description-new">{quiz.description || 'Test your knowledge with this quiz!'}</p>
                            <div className="quiz-card-tags">
                              <span className="tag-item">
                                <span className="tag-icon">❓</span>
                                {typeDisplay}
                              </span>
                            </div>
                          </div>
                          <div className="quiz-card-action">
                            <button
                              className="quiz-start-button-new"
                              onClick={() => startQuiz(quiz.id)}
                              style={{ 
                                background: `linear-gradient(135deg, ${quiz.color}, ${quiz.color}dd)`,
                                boxShadow: `0 4px 16px ${quiz.color}40`
                              }}
                            >
                              <span>Start Quiz</span>
                              <span className="button-icon-new">→</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="quiz"
              className="quiz-area"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              {!showResults ? (
                <div className="quiz-content">
                  <div className="quiz-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%`,
                          backgroundColor: accentColor
                        }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      Question {currentQuestion + 1} of {quizData.questions.length}
                    </div>
                  </div>

                  <div className="question-container">
                    <h2 className="question-text">
                      {quizData.questions[currentQuestion].question}
                    </h2>
                    {quizData.questions[currentQuestion].type === 'short-answer' ? (
                      <div className="short-answer-wrapper">
                        <textarea
                          className="short-answer-input"
                          rows="3"
                          placeholder="Type your answer here"
                          value={userAnswers[currentQuestion] || ''}
                          onChange={(e) => handleShortAnswer(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="options-grid">
                        {quizData.questions[currentQuestion].options.map((option, index) => (
                          <motion.button
                            key={index}
                            className={`option-btn ${
                              userAnswers[currentQuestion] === index ? 'selected' : ''
                            }`}
                            onClick={() => handleAnswer(index)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="option-letter">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="option-text">{option}</span>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    <div className="quiz-navigation">
                      {currentQuestion > 0 && (
                        <button onClick={previousQuestion} className="nav-btn prev-btn">
                          ← Previous
                        </button>
                      )}

                      {(() => {
                        const question = quizData.questions[currentQuestion];
                        const answer = userAnswers[currentQuestion];
                        const isAnswered = question.type === 'short-answer'
                          ? Boolean(answer && answer.trim())
                          : answer !== undefined;
                        return (
                      
                        <button 
                            onClick={nextQuestion}
                            className="nav-btn next-btn"
                            disabled={!isAnswered}
                            style={{ backgroundColor: accentColor }}
                          >
                            {currentQuestion === quizData.questions.length - 1 ? 'Finish Quiz' : 'Next →'}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="results-container">
                  <div className="results-header">
                    <h2>Quiz Results</h2>
                    <div className="score-display" style={{ color: getScoreColor() }}>
                      <span className="score-number">{score}</span>
                      <span className="score-total">/ {quizData.questions.length}</span>
                    </div>
                    <p className="score-percentage">
                      {Math.round((score / quizData.questions.length) * 100)}%
                    </p>
                    <p className="score-message">{getScoreMessage()}</p>
                  </div>

                  <div className="results-breakdown">
                    <h3>Question Review</h3>
                    {quizData.questions.map((question, index) => (
                      <div 
                        key={index} 
                        className={`question-review ${
                          (() => {
                            const provided = userAnswers[index];
                            if (question.type === 'short-answer') {
                              return (provided || '').trim().toLowerCase() === (question.answerText || '').trim().toLowerCase()
                                ? 'correct'
                                : 'incorrect';
                            }
                            return provided === question.correctIndex ? 'correct' : 'incorrect';
                          })()
                        }`}
                      >
                        <div className="question-header">
                          <span className="question-number">Q{index + 1}</span>
                          <span className="question-status">
                            {(() => {
                              const provided = userAnswers[index];
                              if (question.type === 'short-answer') {
                                return (provided || '').trim().toLowerCase() === (question.answerText || '').trim().toLowerCase()
                                  ? '✓'
                                  : '✗';
                              }
                              return provided === question.correctIndex ? '✓' : '✗';
                            })()}
                          </span>
                        </div>
                        <p className="question-text">{question.question}</p>
                        <div className="answer-info">
                          <span className="your-answer">
                            Your answer:{' '}
                            {(() => {
                              const provided = userAnswers[index];
                              if (question.type === 'short-answer') {
                                return provided ? provided : 'Not answered';
                              }
                              return provided !== undefined
                                ? question.options[provided]
                                : 'Not answered';
                            })()}
                          </span>
                          {(() => {
                            const provided = userAnswers[index];
                            if (question.type === 'short-answer') {
                              return (provided || '').trim().toLowerCase() !== (question.answerText || '').trim().toLowerCase() ? (
                                <span className="correct-answer">
                                  Correct answer: {question.answerText || '—'}
                                </span>
                              ) : null;
                            }
                            return provided !== question.correctIndex ? (
                            <span className="correct-answer">
                              Correct answer: {question.options[question.correctIndex]}
                            </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="results-actions">
                    <button onClick={resetQuiz} className="retake-btn">
                      Take Another Quiz
                    </button>
                    <Link to="/" className="home-btn">
                      Back to Home
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Quiz;

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { progressAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import WelcomeNotification from '../WelcomeNotification';
import './MathGame.css';

const SHAPE_LIBRARY = {
  circle: { label: 'Circle', color: '#FF6B6B', fact: 'A circle has one curved side and no corners.' },
  square: { label: 'Square', color: '#2ecc71', fact: 'A square has four equal sides and four right angles.' },
  triangle: { label: 'Triangle', color: '#f1c40f', fact: 'Triangles always have three sides and three corners.' },
  rectangle: { label: 'Rectangle', color: '#3498db', fact: 'Rectangles have two long sides and two short sides.' },
  star: { label: 'Star', color: '#ff9f43', fact: 'Stars have five points and look just like the night sky!' },
  hexagon: { label: 'Hexagon', color: '#9b59b6', fact: 'Hexagons have six equal sides, just like honeycomb cells.' },
  heart: { label: 'Heart', color: '#e91e63', fact: 'Hearts are a symbol of love and have two rounded curves at the top.' },
  moon: { label: 'Moon', color: '#ffd700', fact: 'The moon is a crescent shape that appears in the night sky.' },
  oval: { label: 'Oval', color: '#9c27b0', fact: 'Ovals are like stretched circles with two curved ends.' },
  diamond: { label: 'Diamond', color: '#00bcd4', fact: 'Diamonds have four equal sides arranged like a rotated square.' },
  pentagon: { label: 'Pentagon', color: '#ff5722', fact: 'Pentagons have five equal sides and five corners.' },
  octagon: { label: 'Octagon', color: '#4caf50', fact: 'Octagons have eight equal sides, like a stop sign.' }
};

const SHAPE_PUZZLES = [
  {
    id: 'circle',
    title: 'Perfect Circle',
    prompt: 'Drag the shape that matches the outline.',
    outline: 'circle',
    correctShape: 'circle',
    options: ['circle', 'triangle', 'square', 'rectangle', 'star', 'hexagon', 'heart'],
    successMessage: 'Spot on! Circles are round with no corners.'
  },
  {
    id: 'triangle',
    title: 'Triangle Target',
    prompt: 'Which shape fits the empty outline?',
    outline: 'triangle',
    correctShape: 'triangle',
    options: ['triangle', 'circle', 'rectangle', 'square', 'hexagon', 'star', 'moon'],
    successMessage: 'Great! Triangles always have three equal corners.'
  },
  {
    id: 'rectangle',
    title: 'Rectangle Builder',
    prompt: 'Find the shape with two long sides.',
    outline: 'rectangle',
    correctShape: 'rectangle',
    options: ['rectangle', 'hexagon', 'square', 'circle', 'triangle', 'star', 'oval'],
    successMessage: 'Yes! Rectangles have pairs of equal sides.'
  },
  {
    id: 'hexagon',
    title: 'Honeycomb Match',
    prompt: 'Drag the six-sided shape into place.',
    outline: 'hexagon',
    correctShape: 'hexagon',
    options: ['hexagon', 'star', 'circle', 'triangle', 'square', 'rectangle', 'diamond'],
    successMessage: 'Sweet! Bees love hexagons for building hives.'
  },
  {
    id: 'star',
    title: 'Super Star',
    prompt: 'Which shape shines like the outline?',
    outline: 'star',
    correctShape: 'star',
    options: ['star', 'triangle', 'square', 'hexagon', 'circle', 'rectangle', 'pentagon'],
    successMessage: 'You did it! Stars have five sparkling points.'
  }
];

const shuffleArray = (items) => {
  return [...items].sort(() => Math.random() - 0.5);
};

const MATH_GAMES = [
  {
    id: 'shape-builder',
    name: 'Shape Builder Lab',
    icon: '🧩',
    color: '#FF6B6B',
    description: 'Spin the shape wheel, match glowing outlines, and learn fun geometry facts.',
    details: ['5 animated puzzles', 'Targets visual matching', 'Perfect for grades 1-3'],
    duration: 'Approx. 5 minutes',
    skills: ['Shapes & geometry', 'Observation', 'Hand-eye coordination']
  }
];

const MathGame = () => {
  const { user } = useAuth();
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [status, setStatus] = useState('waiting');
  const [message, setMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [optionOrder, setOptionOrder] = useState([]);
  const [shapePositions, setShapePositions] = useState({});
  const [answers, setAnswers] = useState([]); // Track all answers: [{ puzzleId, correctShape, selectedShape, isCorrect }]
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState('menu');
  const audioRef = useRef(null);
  const gameStartTime = useRef(null);

  const currentPuzzle = SHAPE_PUZZLES[currentPuzzleIndex];

  // Generate wheel-like rotation for all shapes
  useEffect(() => {
    if (!currentPuzzle) return;
    setStatus('waiting');
    setMessage('');
    const shuffled = shuffleArray(currentPuzzle.options);
    setOptionOrder(shuffled);
    
    // All shapes rotate together like a wheel
    // Adjusted radius to fit within container with padding
    const wheelRadius = 80; // Adjusted radius to prevent clipping
    const rotationDuration = 5; // Speed of wheel rotation
    const rotationDirection = -1; // Counter-clockwise rotation
    
    // Position shapes evenly around the wheel
    const positions = {};
    shuffled.forEach((shapeId, index) => {
      // Distribute shapes evenly around the wheel (360 degrees / number of shapes)
      const angleStep = (2 * Math.PI) / shuffled.length;
      const startAngle = index * angleStep;
      
      positions[shapeId] = {
        radius: wheelRadius,
        startAngle,
        duration: rotationDuration,
        direction: rotationDirection,
        delay: 0 // All shapes rotate together
      };
    });
    setShapePositions(positions);
  }, [currentPuzzleIndex, currentPuzzle]);

  const progressPercentage = useMemo(() => {
    return Math.round((completedCount / SHAPE_PUZZLES.length) * 100);
  }, [completedCount]);

  // Handle background music
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // Set volume to 30%
      if (isMusicPlaying) {
        audioRef.current.play().catch(err => {
          console.log('Audio play failed:', err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicPlaying]);

  // Auto-play music when component mounts
  useEffect(() => {
    if (audioRef.current && isMusicPlaying) {
      audioRef.current.play().catch(err => {
        console.log('Auto-play prevented:', err);
      });
    }
  }, []);

  const toggleMusic = () => {
    setIsMusicPlaying(!isMusicPlaying);
  };

  const handleShapeClick = (shapeId) => {
    attemptPlacement(shapeId);
  };

  const attemptPlacement = async (shapeId) => {
    if (!shapeId || !currentPuzzle) return;

    // Record the answer
    const isCorrect = shapeId === currentPuzzle.correctShape;
    const answerRecord = {
      puzzleId: currentPuzzle.id,
      puzzleTitle: currentPuzzle.title,
      correctShape: currentPuzzle.correctShape,
      selectedShape: shapeId,
      isCorrect: isCorrect
    };

    setAnswers((prev) => [...prev, answerRecord]);
    
    if (isCorrect) {
      setScore((prev) => prev + 20);
    }
    
    const newCompletedCount = completedCount + 1;
    setCompletedCount(newCompletedCount);

    // Check if game is complete
    const isGameComplete = currentPuzzleIndex === SHAPE_PUZZLES.length - 1;
    
    if (isGameComplete) {
      setIsComplete(true);
      
      // Save progress when game is complete
      if (user && user.role === 'student') {
        try {
          const timeSpent = gameStartTime.current ? Math.floor((Date.now() - gameStartTime.current) / 1000) : 0;
          const totalQuestions = SHAPE_PUZZLES.length;
          const correctAnswers = answers.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
          const percentageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

          console.log('[MathGame] Attempting to save progress...', {
            user: user.email,
            role: user.role,
            score: percentageScore,
            correctAnswers,
            totalQuestions,
            timeSpent
          });

          const progressData = {
            subject: 'Mathematics',
            quizScore: percentageScore,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            timeSpent: timeSpent,
            difficulty: 'Medium',
            gameType: 'Game'
          };

          console.log('[MathGame] Sending progress data:', progressData);

          const response = await progressAPI.saveProgress(progressData);
          const result = await response.json();

          if (response.ok) {
            console.log('[MathGame] ✅ Progress saved successfully!', result);
          } else {
            console.error('[MathGame] ❌ Failed to save progress:', result);
          }
        } catch (err) {
          console.error('[MathGame] ❌ Error saving game progress:', err);
          console.error('[MathGame] Error details:', {
            message: err.message,
            stack: err.stack
          });
        }
      } else {
        console.log('[MathGame] Progress not saved - conditions not met:', {
          hasUser: !!user,
          userRole: user?.role
        });
      }
    } else {
      setCurrentPuzzleIndex((prev) => prev + 1);
    }
  };


  const resetShapeBuilderState = () => {
    setCurrentPuzzleIndex(0);
    setScore(0);
    setCompletedCount(0);
    setStatus('waiting');
    setMessage('');
    setIsComplete(false);
    setAnswers([]);
    setHasStarted(false);
  };

  const handlePlayAgain = () => {
    resetShapeBuilderState();
  };

  const handleStartGame = () => {
    setHasStarted(true);
    gameStartTime.current = Date.now(); // Track when game starts
  };

  const handleSelectGame = (gameId) => {
    setSelectedGameId(gameId);
    if (gameId === 'shape-builder') {
      resetShapeBuilderState();
    }
  };

  const handleBackToMenu = () => {
    resetShapeBuilderState();
    setSelectedGameId('menu');
  };

  return (
    <div className="math-game-page">
      <WelcomeNotification
        pageId="math-game"
        title="Mga Dula sa Mathematics! 🔢"
        message="Pag-abot sa Mathematics Games! Dinhi makadula mo og makalingaw nga mga interactive games aron makakat-on bahin sa mga shapes, numbers, ug problem-solving. Pilia ang usa ka dula gikan sa menu aron magsugod. Ang matag dula makatabang kaninyo sa pagpraktis sa lain-laing math skills samtang naglingaw!"
        icon="🔢"
      />
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        <source src="/math-game-bg-music.mp3.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {selectedGameId === 'menu' ? (
        <>
          {/* Modern Hero Section */}
          <div className="math-game-hero-section">
            <div className="math-game-hero-background">
              <div className="hero-gradient-orb orb-1"></div>
              <div className="hero-gradient-orb orb-2"></div>
              <div className="hero-gradient-orb orb-3"></div>
            </div>
            <div className="math-game-hero-content">
              <motion.div 
                className="hero-text-wrapper"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Link to="/subjects" className="math-game-back-link">
                  ← Back to Subjects
                </Link>
                <motion.span 
                  className="start-pill-new"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  Mathematics Games
                </motion.span>
                <motion.h1 
                  className="hero-title-new"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Shape Builder <span className="highlight-new">Lab</span>
                </motion.h1>
                <motion.p 
                  className="hero-subtitle-new"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  Explore geometry adventures through interactive shape puzzles. 
                  Match, build, and learn fun facts about shapes!
                </motion.p>
              </motion.div>
            </div>
          </div>

          {/* Games Grid Section */}
          <div className="math-games-section">
            <div className="math-games-container">
              <motion.div 
                className="math-games-grid-new"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {MATH_GAMES.map((game, index) => (
                  <motion.div
                    key={game.id}
                    className="math-game-card-new"
                    style={{ '--math-card-color': game.color }}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <div className="card-icon-wrapper">
                      <span className="card-icon-new">{game.icon}</span>
                    </div>
                    <div className="card-content-new">
                      <h3 className="card-title-new">{game.name}</h3>
                      <p className="card-description-new">{game.description}</p>
                      <div className="card-meta-new">
                        <span className="meta-tag">{game.duration}</span>
                      </div>
                      <div className="card-skills-new">
                        <span className="skills-label">Skills:</span>
                        <div className="skills-tags">
                          {game.skills.map((skill, skillIndex) => (
                            <span key={skillIndex} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                      <ul className="card-features-new">
                        {game.details.map((detail, detailIndex) => (
                          <li key={detailIndex}>
                            <span className="feature-icon">✓</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card-action-new">
                      <button 
                        className="start-game-btn-new" 
                        onClick={() => handleSelectGame(game.id)}
                        style={{ background: `linear-gradient(135deg, ${game.color}, ${game.color}dd)` }}
                      >
                        Start Game
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </>
      ) : (
        <div className="math-game-container">
          <motion.div
            className="game-header-new"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="game-header-actions-new">
              <div className="header-nav-group-new">
                <Link to="/subjects" className="back-btn-new">
                  ← Back to Subjects
                </Link>
                <button className="back-menu-btn-new" onClick={handleBackToMenu}>
                  ← Math Games Menu
                </button>
              </div>
              <button 
                onClick={toggleMusic} 
                className="music-toggle-btn-new"
                aria-label={isMusicPlaying ? 'Mute music' : 'Play music'}
              >
                {isMusicPlaying ? '🔊' : '🔇'}
              </button>
            </div>
            <h1 className="game-title-new">Mathematics Shape Builder</h1>
            {selectedGameId === 'shape-builder' && hasStarted && (
              <div className="game-stats-new">
                <div className="stat-new">
                  <span className="stat-label-new">Score</span>
                  <span className="stat-value-new">{score}</span>
                </div>
                <div className="stat-new">
                  <span className="stat-label-new">Shapes Completed</span>
                  <span className="stat-value-new">
                    {completedCount}/{SHAPE_PUZZLES.length}
                  </span>
                </div>
                <div className="stat-new progress-new">
                  <span className="stat-label-new">Progress</span>
                  <div className="progress-bar-new">
                    <div className="progress-fill-new" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {!hasStarted ? (
          <div className="game-start-wrapper">
            <motion.div 
              className="game-start-panel"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="start-hero">
                <span className="start-pill">Geometry Adventure</span>
                <h2>Warm Up Before You Play</h2>
                <p>
                  Review the mission, meet the shapes, and get ready to tap the matching outline. 
                  Once you hit start, five animated puzzles will test your speed and observation skills.
                </p>
              </div>
              <div className="start-highlights">
                <div className="highlight-card">
                  <span className="highlight-icon">🎯</span>
                  <div>
                    <h3>5 Shape Missions</h3>
                    <p>Circle, triangle, rectangle, hexagon, and star challenges.</p>
                  </div>
                </div>
                <div className="highlight-card">
                  <span className="highlight-icon">🌀</span>
                  <div>
                    <h3>Orbiting Choices</h3>
                    <p>Shapes float in a wheel—tap the one that fits the outline.</p>
                  </div>
                </div>
                <div className="highlight-card">
                  <span className="highlight-icon">🏅</span>
                  <div>
                    <h3>Score & Facts</h3>
                    <p>Earn points and unlock fun facts for every correct pick.</p>
                  </div>
                </div>
              </div>
              <ul className="start-checklist">
                <li>Watch the moving shapes and remember their names.</li>
                <li>Match the glowing outline on the board.</li>
                <li>Finish all missions to see your score report.</li>
              </ul>
              <div className="start-actions">
                <motion.button 
                  className="start-game-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStartGame}
                >
                  Start Building Shapes
                </motion.button>
                <button className="secondary-link-btn" onClick={handleBackToMenu}>
                  Back to Math Games
                </button>
              </div>
            </motion.div>
          </div>
        ) : isComplete ? (
          <motion.div
            className="shape-summary"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2>Game Complete! 🎉</h2>
            <p>You completed all puzzles and earned {score} points.</p>
            <div className="summary-stats">
              <div>
                <span>Total Score</span>
                <strong>{score}</strong>
              </div>
              <div>
                <span>Correct Answers</span>
                <strong>{answers.filter(a => a.isCorrect).length}/{answers.length}</strong>
              </div>
            </div>
            
            <div className="answers-review">
              <h3>Review Your Answers</h3>
              <div className="answers-list">
                {answers.map((answer, index) => (
                  <div key={index} className={`answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="answer-header">
                      <span className="answer-number">Question {index + 1}: {answer.puzzleTitle}</span>
                      <span className={`answer-status ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                        {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <div className="answer-details">
                      <div className="answer-shape">
                        <span className="answer-label">Your Answer:</span>
                        <div className={`shape-preview ${answer.selectedShape}`} style={{ '--shape-color': SHAPE_LIBRARY[answer.selectedShape].color }}>
                          <div className="shape-visual-small"></div>
                          <span>{SHAPE_LIBRARY[answer.selectedShape].label}</span>
                        </div>
                      </div>
                      {!answer.isCorrect && (
                        <div className="answer-shape">
                          <span className="answer-label">Correct Answer:</span>
                          <div className={`shape-preview ${answer.correctShape}`} style={{ '--shape-color': SHAPE_LIBRARY[answer.correctShape].color }}>
                            <div className="shape-visual-small"></div>
                            <span>{SHAPE_LIBRARY[answer.correctShape].label}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="play-again-btn" onClick={handlePlayAgain}>
              Play Again
            </button>
          </motion.div>
        ) : !currentPuzzle ? (
          <div className="shape-lab">
            <p>Loading puzzle...</p>
          </div>
        ) : (
          <motion.div
            className="shape-lab"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentPuzzle.id}
          >
            <div className="puzzle-header">
              <p className="puzzle-count">
                Puzzle {currentPuzzleIndex + 1} of {SHAPE_PUZZLES.length}
              </p>
              <h2 className="question-text">Find the {SHAPE_LIBRARY[currentPuzzle?.correctShape]?.label.toLowerCase() || 'shape'}</h2>
            </div>

            <div className="shape-playground">
              <div className="shape-tray">
                <div className="shape-options">
                  {optionOrder.map((shapeId) => {
                    const shape = SHAPE_LIBRARY[shapeId];
                    const motionParams = shapePositions[shapeId] || { 
                      radius: 20, 
                      startAngle: 0, 
                      duration: 3, 
                      direction: 1, 
                      delay: 0 
                    };
                    
                    // Create circular motion keyframes (smooth circle with 12 points)
                    const createCircularKeyframes = (radius, startAngle, direction) => {
                      const steps = 12;
                      const keyframes = [];
                      for (let i = 0; i <= steps; i++) {
                        const progress = i / steps;
                        const angle = startAngle + (direction * progress * Math.PI * 2);
                        keyframes.push({
                          x: Math.cos(angle) * radius,
                          y: Math.sin(angle) * radius
                        });
                      }
                      return keyframes;
                    };
                    
                    const circularPath = createCircularKeyframes(motionParams.radius, motionParams.startAngle, motionParams.direction);
                    
                    // Extract x and y arrays for framer-motion animation
                    const xKeyframes = circularPath.map(p => p.x);
                    const yKeyframes = circularPath.map(p => p.y);
                    
                    return (
                      <motion.div
                        key={shapeId}
                        className={`shape-token ${shapeId} moving clickable`}
                        onClick={() => handleShapeClick(shapeId)}
                        style={{ '--shape-color': shape.color }}
                        animate={{
                          x: xKeyframes,
                          y: yKeyframes,
                        }}
                        transition={{
                          duration: motionParams.duration,
                          repeat: Infinity,
                          ease: "linear",
                          delay: motionParams.delay,
                          times: circularPath.map((_, i) => i / (circularPath.length - 1))
                        }}
                      >
                        <div className="shape-visual"></div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="shape-fact">
                  {message || SHAPE_LIBRARY[currentPuzzle?.correctShape]?.fact || 'Keep playing!'}
                </div>
              </div>
            </div>
          </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default MathGame;

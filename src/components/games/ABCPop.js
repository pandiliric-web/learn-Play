import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameSettingsAPI } from '../../services/api';
import './ABCPop.css';

// LetterBubble Component
const LetterBubble = ({ letter, position, onClick, isShaking, isPopping, animationSpeed }) => {
  const bubbleVariants = {
    floating: {
      y: [0, -20, 0],
      x: [0, 10, 0],
      transition: {
        duration: animationSpeed || 3 + Math.random() * 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: {
        duration: 0.5
      }
    },
    pop: {
      scale: [1, 1.5, 0],
      opacity: [1, 1, 0],
      transition: {
        duration: 0.6
      }
    }
  };

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', 
    '#AB47BC', '#26A69A', '#EF5350', '#42A5F5',
    '#66BB6A', '#FFCA28', '#EC407A', '#5C6BC0'
  ];
  const colorIndex = (letter.charCodeAt(0) - 65) % colors.length;
  const bubbleColor = colors[colorIndex];

  return (
    <motion.div
      className="letter-bubble"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        '--bubble-color': bubbleColor
      }}
      variants={bubbleVariants}
      animate={isShaking ? 'shake' : isPopping ? 'pop' : 'floating'}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="bubble-letter">{letter}</span>
    </motion.div>
  );
};

// Star Animation Component
const StarAnimation = ({ show }) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="star-container"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3 }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="star"
            initial={{ 
              opacity: 0, 
              scale: 0,
              x: 0,
              y: 0
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              x: (Math.cos(i * (Math.PI * 2 / 5)) * 100),
              y: (Math.sin(i * (Math.PI * 2 / 5)) * 100),
              rotate: 360
            }}
            transition={{
              duration: 1,
              delay: i * 0.1,
              ease: "easeOut"
            }}
          >
            ⭐
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

// Wrong Feedback Component
const WrongFeedback = ({ show }) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="wrong-feedback-container"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="wrong-feedback"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span className="wrong-icon">❌</span>
          <span className="wrong-text">Wrong</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ABCPop = ({ onBack }) => {
  const [targetLetter, setTargetLetter] = useState('');
  const [score, setScore] = useState(0);
  const [letters, setLetters] = useState([]);
  const [difficulty, setDifficulty] = useState('easy'); // easy: A-Z normal, medium: A-Z faster, hard: A-Z 1 correct only
  const [shakingLetter, setShakingLetter] = useState(null);
  const [poppingLetter, setPoppingLetter] = useState(null);
  const [showStar, setShowStar] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [round, setRound] = useState(0); // Track rounds for progressive difficulty
  const [gameSettings, setGameSettings] = useState(null);
  const [statistics, setStatistics] = useState({
    correct: 0,
    wrong: 0,
    total: 0
  });
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const backgroundMusicRef = useRef(null);
  const musicAudioRef = useRef(null);

  // Speak letter name using text-to-speech
  const speakLetter = useCallback((letter) => {
    if (gameSettings?.soundEnabled === false) return; // Respect sound settings
    
    try {
      // Check if Speech Synthesis is available
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        if (speechSynthesisRef.current) {
          window.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.rate = 0.8; // Slightly slower for clarity
        utterance.pitch = 1.2; // Slightly higher pitch for kid-friendly sound
        utterance.volume = 0.9;
        
        // Try to use a child-friendly voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Child') || 
          voice.name.includes('Kid') ||
          voice.name.includes('Young') ||
          (voice.lang.includes('en') && voice.name.includes('Female'))
        ) || voices.find(voice => voice.lang.includes('en'));
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        speechSynthesisRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.warn('Text-to-speech not available:', error);
    }
  }, [gameSettings]);

  // Initialize audio context and sounds (lazy initialization on first user interaction)
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return; // Already initialized
    
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create happy sound (correct answer)
      const createHappySound = () => {
        if (!audioContextRef.current) return;
        try {
          const ctx = audioContextRef.current;
          // Resume context if suspended (browser autoplay policy)
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
          
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
          
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.5);
        } catch (err) {
          console.warn('Error playing happy sound:', err);
        }
      };
      
      // Create try again sound (wrong answer)
      const createTryAgainSound = () => {
        if (!audioContextRef.current) return;
        try {
          const ctx = audioContextRef.current;
          // Resume context if suspended (browser autoplay policy)
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
          
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.frequency.setValueAtTime(200, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
          
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
        } catch (err) {
          console.warn('Error playing try again sound:', err);
        }
      };
      
      correctSoundRef.current = createHappySound;
      wrongSoundRef.current = createTryAgainSound;
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  }, []);

  // Initialize background music audio
  useEffect(() => {
    // Create audio element for background music
    // STEP 3: Change the filename here to match your music file
    const audio = new Audio(process.env.PUBLIC_URL + '/abc-pop-bg-music.mp3');
    audio.loop = true; // Loop the music
    audio.volume = 0.2; // Set volume to 30% (adjust as needed: 0.0 to 1.0)
    audio.preload = 'auto'; // Preload the audio file
    
    musicAudioRef.current = audio;
    
    // Cleanup on unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  // Play background music
  const playBackgroundMusic = useCallback(() => {
    if (!musicAudioRef.current || gameSettings?.soundEnabled === false) return;
    
    try {
      const audio = musicAudioRef.current;
      audio.currentTime = 0; // Start from beginning
      audio.play().catch(error => {
        console.warn('Error playing background music:', error);
      });
    } catch (error) {
      console.warn('Error playing background music:', error);
    }
  }, [gameSettings]);

  // Stop background music
  const stopBackgroundMusic = useCallback(() => {
    if (musicAudioRef.current) {
      try {
        musicAudioRef.current.pause();
        musicAudioRef.current.currentTime = 0;
      } catch (error) {
        console.warn('Error stopping background music:', error);
      }
    }
  }, []);

  // Toggle background music
  const toggleMusic = useCallback(() => {
    if (gameSettings?.soundEnabled === false) return;
    
    if (musicPlaying) {
      // Stop music
      stopBackgroundMusic();
      setMusicPlaying(false);
    } else {
      // Start music
      playBackgroundMusic();
      setMusicPlaying(true);
    }
  }, [musicPlaying, gameSettings, playBackgroundMusic, stopBackgroundMusic]);

  // Start music when game starts
  useEffect(() => {
    if (gameStarted && gameSettings?.soundEnabled !== false && !musicPlaying) {
      playBackgroundMusic();
      setMusicPlaying(true);
    }
  }, [gameStarted, gameSettings, musicPlaying, playBackgroundMusic]);

  // Stop music when game resets
  useEffect(() => {
    if (!gameStarted) {
      stopBackgroundMusic();
      setMusicPlaying(false);
    }
  }, [gameStarted, stopBackgroundMusic]);

  // Load game settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await gameSettingsAPI.getGameSettings('abc-pop');
        const data = await response.json();
        if (response.ok && data.success) {
          // Ensure we have a plain object
          const settings = data.settings.toObject ? data.settings.toObject() : data.settings;
          setGameSettings(settings);
          console.log('[ABCPop] Settings loaded successfully:', settings);
        } else {
          console.warn('[ABCPop] Settings not found, using defaults');
        }
      } catch (error) {
        console.warn('[ABCPop] Failed to load game settings, using defaults:', error);
      }
    };
    loadSettings();
    
    // Reload settings every 30 seconds to get updates
    const interval = setInterval(loadSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load voices for text-to-speech (some browsers need this)
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        // Some browsers need this to populate voices
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
        }
      }
    };
    loadVoices();
  }, []);

  // Adjust animation speed based on difficulty and custom settings
  const getAnimationSpeed = useCallback(() => {
    if (!gameSettings) {
      // Default speeds if settings not loaded
      switch (difficulty) {
        case 'easy':
          return 4 + Math.random() * 2; // Normal speed: 4-6 seconds
        case 'medium':
          return 2 + Math.random() * 1.5; // Faster: 2-3.5 seconds
        case 'hard':
          return 1.5 + Math.random() * 1; // Very fast: 1.5-2.5 seconds
        default:
          return 3 + Math.random() * 2;
      }
    }

    const modeSettings = gameSettings[difficulty];
    if (modeSettings) {
      const min = modeSettings.animationSpeedMin || 3;
      const max = modeSettings.animationSpeedMax || 5;
      return min + Math.random() * (max - min);
    }

    return 3 + Math.random() * 2;
  }, [difficulty, gameSettings]);

  // Get available letters based on difficulty - all modes now use A-Z
  const getAvailableLetters = useCallback(() => {
    // All difficulty levels use A-Z (all 26 letters)
    return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A-Z
  }, []);

  // Generate random target letter
  const generateTargetLetter = useCallback(() => {
    const available = getAvailableLetters();
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }, [getAvailableLetters]);

  // Get similar-looking letters (distractors for higher difficulty)
  const getSimilarLetters = useCallback((targetLetter) => {
    const similarMap = {
      'B': ['D', 'P', 'R'],
      'D': ['B', 'P', 'O'],
      'P': ['B', 'D', 'R'],
      'Q': ['O', 'G'],
      'O': ['Q', 'D', 'C'],
      'G': ['Q', 'C'],
      'C': ['G', 'O'],
      'E': ['F'],
      'F': ['E', 'P'],
      'I': ['T', 'L'],
      'T': ['I', 'F'],
      'J': ['I'],
      'L': ['I'],
      'M': ['N', 'W'],
      'N': ['M', 'H'],
      'W': ['M'],
      'H': ['N'],
      'U': ['V'],
      'V': ['U', 'Y'],
      'Y': ['V'],
      'S': ['Z'],
      'Z': ['S']
    };
    return similarMap[targetLetter] || [];
  }, []);

  // Generate floating letter bubbles - ensures target letter is always present
  const generateLetters = useCallback((target) => {
    const available = getAvailableLetters();
    const newLetters = [];
    
    // Get settings for current difficulty mode
    const modeSettings = gameSettings?.[difficulty];
    let bubbleCount, targetInstances;
    
    if (modeSettings) {
      bubbleCount = modeSettings.bubbleCount || 12;
      targetInstances = modeSettings.targetInstances || 1;
    } else {
      // Default values if settings not loaded
      if (difficulty === 'hard') {
        bubbleCount = 6;
        targetInstances = 1;
      } else if (difficulty === 'easy') {
        bubbleCount = 12;
        targetInstances = 3;
      } else {
        bubbleCount = 12;
        targetInstances = 2;
      }
    }
    
    if (difficulty === 'hard') {
      // Hard mode: Only 1 correct answer
      // Add the target letter (1 correct)
      newLetters.push({
        id: `target-${Date.now()}-${Math.random()}`,
        letter: target,
        position: {
          x: 10 + (Math.random() * 80),
          y: 20 + (Math.random() * 60)
        }
      });
      
      // Add wrong letters (distractors)
      const wrongLetters = available.filter(letter => letter !== target);
      const shuffledWrong = wrongLetters.sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < bubbleCount - 1; i++) {
        newLetters.push({
          id: `wrong-${i}-${Date.now()}-${Math.random()}`,
          letter: shuffledWrong[i],
          position: {
            x: 10 + (Math.random() * 80),
            y: 20 + (Math.random() * 60)
          }
        });
      }
    } else {
      // Easy and Medium modes: Multiple bubbles with target appearing multiple times
      // Always add target letter instances first
      for (let i = 0; i < targetInstances; i++) {
        newLetters.push({
          id: `target-${i}-${Date.now()}-${Math.random()}`,
          letter: target,
          position: {
            x: 10 + (Math.random() * 80),
            y: 20 + (Math.random() * 60)
          }
        });
      }
      
      // Fill remaining slots with random letters from available set
      const remainingSlots = bubbleCount - newLetters.length;
      const usedLetters = new Set(newLetters.map(l => l.letter));
      
      for (let i = 0; i < remainingSlots; i++) {
        let letter;
        let attempts = 0;
        do {
          letter = available[Math.floor(Math.random() * available.length)];
          attempts++;
          // Prevent infinite loop
          if (attempts > 50) break;
        } while (usedLetters.has(letter) && usedLetters.size < available.length);
        
        if (letter) {
          newLetters.push({
            id: `letter-${i}-${Date.now()}-${Math.random()}`,
            letter,
            position: {
              x: 10 + (Math.random() * 80),
              y: 20 + (Math.random() * 60)
            }
          });
          usedLetters.add(letter);
        }
      }
    }
    
    // Shuffle the letters for random positioning
    return newLetters.sort(() => Math.random() - 0.5);
  }, [getAvailableLetters, difficulty, gameSettings]);

  // Start game
  const startGame = () => {
    initAudio(); // Initialize audio on first user interaction
    setGameStarted(true);
    const newTarget = generateTargetLetter();
    setTargetLetter(newTarget);
    setLetters(generateLetters(newTarget));
    setScore(0);
  };

  // Handle letter click
  const handleLetterClick = (clickedLetter, letterId) => {
    initAudio(); // Ensure audio is initialized
    
    if (clickedLetter === targetLetter) {
      // Correct answer
      if (gameSettings?.soundEnabled !== false && correctSoundRef.current) {
        correctSoundRef.current();
      }
      
      // Speak the letter name
      speakLetter(clickedLetter);
      
      setPoppingLetter(letterId);
      setShowStar(true);
      setShowWrong(false);
      
      // Update statistics
      setStatistics(prev => ({
        correct: prev.correct + 1,
        wrong: prev.wrong,
        total: prev.total + 1
      }));
      
      // Score increases with difficulty and round (use custom settings if available)
      const modeSettings = gameSettings?.[difficulty];
      const baseScore = modeSettings?.scorePoints || (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20);
      const roundBonus = Math.floor(round / 5) * 5; // Bonus every 5 rounds
      setScore(prev => prev + baseScore + roundBonus);
      setRound(prev => prev + 1);
      
      setTimeout(() => {
        setPoppingLetter(null);
        setShowStar(false);
        const newTarget = generateTargetLetter();
        setTargetLetter(newTarget);
        // Regenerate letters with new positions, ensuring new target is included
        setLetters(generateLetters(newTarget));
      }, 1000);
    } else {
      // Wrong answer
      if (gameSettings?.soundEnabled !== false && wrongSoundRef.current) {
        wrongSoundRef.current();
      }
      
      setShakingLetter(letterId);
      setShowWrong(true);
      setShowStar(false);
      
      // Update statistics
      setStatistics(prev => ({
        correct: prev.correct,
        wrong: prev.wrong + 1,
        total: prev.total + 1
      }));
      
      // Show wrong feedback and proceed to next round after delay
      setTimeout(() => {
        setShakingLetter(null);
        setShowWrong(false);
        // Proceed to next round
        setRound(prev => prev + 1);
        const newTarget = generateTargetLetter();
        setTargetLetter(newTarget);
        setLetters(generateLetters(newTarget));
      }, 1500); // Show wrong message for 1.5 seconds before moving to next round
    }
  };

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setTargetLetter('');
    setLetters([]);
    setScore(0);
    setRound(0);
    setShakingLetter(null);
    setPoppingLetter(null);
    setShowStar(false);
    setShowWrong(false);
    setStatistics({
      correct: 0,
      wrong: 0,
      total: 0
    });
    // Stop background music
    stopBackgroundMusic();
    setMusicPlaying(false);
  };

  return (
    <div className="abc-pop-game">
      <div className="abc-pop-container">
        {/* Header */}
          <div className="abc-pop-header">
          <button onClick={onBack} className="back-button">← Back</button>
          <div className="header-stats">
            {gameSettings?.showScore !== false && (
              <div className="score-display">Score: {score}</div>
            )}
            {gameStarted && gameSettings?.showRoundCounter !== false && (
              <div className="round-display">Round: {round + 1}</div>
            )}
            {gameStarted && (
              <div className="stats-display">
                <span className="stat-correct">✓ {statistics.correct}</span>
                <span className="stat-wrong">✗ {statistics.wrong}</span>
              </div>
            )}
            {gameSettings?.soundEnabled !== false && (
              <button 
                onClick={toggleMusic} 
                className={`music-toggle-btn ${musicPlaying ? 'playing' : ''}`}
                title={musicPlaying ? 'Pause Music' : 'Play Music'}
              >
                {musicPlaying ? '🔊' : '🔇'}
              </button>
            )}
          </div>
        </div>

        {!gameStarted ? (
          <motion.div
            className="abc-pop-menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="game-title">🎈 ABC Pop 🎈</h1>
            <p className="game-description">
              Pop the letter bubbles to match the target letter!
            </p>
            
            <div className="difficulty-selector">
              <h3>Choose Difficulty:</h3>
              <div className="difficulty-buttons">
                <button
                  className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  Easy (A-Z)
                </button>
                <button
                  className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  Medium (A-Z, Faster)
                </button>
                <button
                  className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  Hard (A-Z, 1 Correct)
                </button>
              </div>
            </div>

            <button className="start-game-btn" onClick={startGame}>
              Start Game
            </button>
          </motion.div>
        ) : (
          <div className="abc-pop-gameplay">
            {/* Target Letter Display */}
            <motion.div
              className="target-letter-display"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <h2 className="target-instruction">Pop the letter</h2>
              <motion.div
                className="target-letter-bubble"
                key={targetLetter}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                {targetLetter}
              </motion.div>
            </motion.div>

            {/* Game Area with Floating Bubbles */}
            <div className="bubbles-container">
              <StarAnimation show={showStar} />
              <WrongFeedback show={showWrong} />
              {letters.map((letterData) => (
                <LetterBubble
                  key={letterData.id}
                  letter={letterData.letter}
                  position={letterData.position}
                  onClick={() => handleLetterClick(letterData.letter, letterData.id)}
                  isShaking={shakingLetter === letterData.id}
                  isPopping={poppingLetter === letterData.id}
                  animationSpeed={getAnimationSpeed()}
                />
              ))}
            </div>

            {/* Game Controls */}
            <div className="game-controls">
              <button onClick={resetGame} className="reset-button">
                Reset Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ABCPop;


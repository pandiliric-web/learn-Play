import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameSettingsAPI } from '../../services/api';
import './TamaOMali.css';

// ImagePrompt Component
const ImagePrompt = ({ image, isShaking }) => {
  return (
    <motion.div
      className="image-prompt"
      animate={
        isShaking
          ? {
              x: [0, -10, 10, -10, 10, 0],
              transition: { duration: 0.5 }
            }
          : {
              y: [0, -10, 0],
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }
      }
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
    >
      <motion.div 
        className="image-display"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {image}
      </motion.div>
    </motion.div>
  );
};

// WordDisplay Component
const WordDisplay = ({ word }) => {
  return (
    <motion.div
      className="word-display"
      initial={{ opacity: 0, scale: 0.5, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        type: "spring",
        stiffness: 200,
        delay: 0.2
      }}
    >
      <motion.h2 
        className="word-text"
        animate={{ 
          scale: [1, 1.05, 1],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        {word}
      </motion.h2>
    </motion.div>
  );
};

// DecisionButtons Component
const DecisionButtons = ({ onAnswer, disabled, isShaking }) => {
  return (
    <motion.div
      className="decision-buttons"
      animate={
        isShaking
          ? {
              x: [0, -5, 5, -5, 5, 0],
              transition: { duration: 0.4 }
            }
          : {}
      }
    >
      <motion.button
        className="tama-button"
        onClick={() => onAnswer(true)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        TAMA
      </motion.button>
      <motion.button
        className="mali-button"
        onClick={() => onAnswer(false)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        MALI
      </motion.button>
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
              x: Math.cos(i * (Math.PI * 2 / 5)) * 100,
              y: Math.sin(i * (Math.PI * 2 / 5)) * 100,
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

// Filipino image-word pairs for Grade 1 (mix of correct and incorrect matches)
const IMAGE_WORD_PAIRS = [
  { image: '🐱', word: 'pusa', correct: true },    // cat - cat (TAMA)
  { image: '🐶', word: 'aso', correct: true },     // dog - dog (TAMA)
  { image: '🐱', word: 'aso', correct: false },    // cat - dog (MALI)
  { image: '🐶', word: 'pusa', correct: false },   // dog - cat (MALI)
  { image: '🏠', word: 'bahay', correct: true },   // house - house (TAMA)
  { image: '☀️', word: 'araw', correct: true },    // sun - sun (TAMA)
  { image: '🏠', word: 'pusa', correct: false },   // house - cat (MALI)
  { image: '☀️', word: 'buwan', correct: false },  // sun - moon (MALI)
  { image: '💧', word: 'tubig', correct: true },   // water - water (TAMA)
  { image: '🌳', word: 'puno', correct: true },    // tree - tree (TAMA)
  { image: '💧', word: 'araw', correct: false },   // water - sun (MALI)
  { image: '🌳', word: 'aso', correct: false },    // tree - dog (MALI)
  { image: '🐦', word: 'ibon', correct: true },    // bird - bird (TAMA)
  { image: '🐟', word: 'isda', correct: true },    // fish - fish (TAMA)
  { image: '🐦', word: 'pusa', correct: false },   // bird - cat (MALI)
  { image: '🐟', word: 'aso', correct: false },    // fish - dog (MALI)
  { image: '🌸', word: 'bulaklak', correct: true }, // flower - flower (TAMA)
  { image: '⭐', word: 'bituin', correct: true },   // star - star (TAMA)
  { image: '🌸', word: 'bahay', correct: false },  // flower - house (MALI)
  { image: '⭐', word: 'tubig', correct: false },   // star - water (MALI)
  { image: '🌙', word: 'buwan', correct: true },   // moon - moon (TAMA)
  { image: '🚗', word: 'kotse', correct: true },   // car - car (TAMA)
  { image: '🌙', word: 'araw', correct: false },   // moon - sun (MALI)
  { image: '🚗', word: 'pusa', correct: false },   // car - cat (MALI)
  { image: '📚', word: 'libro', correct: true },   // book - book (TAMA)
  { image: '👟', word: 'sapatos', correct: true }, // shoe - shoe (TAMA)
  { image: '📚', word: 'aso', correct: false },    // book - dog (MALI)
  { image: '👟', word: 'bahay', correct: false },  // shoe - house (MALI)
  { image: '✋', word: 'kamay', correct: true },    // hand - hand (TAMA)
  { image: '☕', word: 'kape', correct: true },     // coffee - coffee (TAMA)
  { image: '✋', word: 'pusa', correct: false },    // hand - cat (MALI)
  { image: '☕', word: 'tubig', correct: false },   // coffee - water (MALI)
  { image: '🎂', word: 'keyk', correct: true },     // cake - cake (TAMA)
  { image: '⚽', word: 'bola', correct: true },     // ball - ball (TAMA)
  { image: '🎂', word: 'aso', correct: false },     // cake - dog (MALI)
  { image: '⚽', word: 'bahay', correct: false },   // ball - house (MALI)
  { image: '🚪', word: 'pintuan', correct: true },  // door - door (TAMA)
  { image: '🪟', word: 'bintana', correct: true },  // window - window (TAMA)
  { image: '🚪', word: 'pusa', correct: false },    // door - cat (MALI)
  { image: '🪟', word: 'aso', correct: false }      // window - dog (MALI)
];

const TamaOMali = ({ onBack }) => {
  const [currentPair, setCurrentPair] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [showStar, setShowStar] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [usedPairs, setUsedPairs] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const audioContextRef = useRef(null);
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);

  // Initialize audio context and sounds
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

      // Create happy sound (correct answer)
      const createHappySound = () => {
        if (!audioContextRef.current) return;
        try {
          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') {
            ctx.resume();
          }

          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);

          oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
          oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);

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

  // Load game settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await gameSettingsAPI.getGameSettings('tama-o-mali');
        if (response.ok) {
          const data = await response.json();
          setGameSettings(data);
        }
      } catch (error) {
        console.warn('Failed to load game settings:', error);
      }
    };

    loadSettings();
    const interval = setInterval(loadSettings, 30000); // Reload every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Generate new pair (avoid repetition until all pairs are used)
  const generateNewPair = useCallback(() => {
    if (usedPairs.length >= IMAGE_WORD_PAIRS.length) {
      setUsedPairs([]); // Reset if all pairs have been used
    }

    const availablePairs = IMAGE_WORD_PAIRS.filter((pair, index) => !usedPairs.includes(index));
    const randomIndex = Math.floor(Math.random() * availablePairs.length);
    const randomPair = availablePairs[randomIndex];
    const pairIndex = IMAGE_WORD_PAIRS.indexOf(randomPair);
    
    setCurrentPair(randomPair);
    setUsedPairs(prev => [...prev, pairIndex]);
  }, [usedPairs]);

  // Start game
  const startGame = useCallback(() => {
    if (gameSettings?.enabled === false) {
      alert('Ang laro ay hindi kasalukuyang pinapagana.');
      return;
    }

    initAudio();
    setGameStarted(true);
    setScore(0);
    setRound(0);
    setUsedPairs([]);
    generateNewPair();
  }, [gameSettings, initAudio, generateNewPair]);

  // Handle answer
  const handleAnswer = useCallback((userAnswer) => {
    if (!currentPair || disabled) return;

    initAudio();
    setDisabled(true);

    const isCorrect = userAnswer === currentPair.correct;

    if (isCorrect) {
      // Correct answer
      if (gameSettings?.soundEnabled !== false && correctSoundRef.current) {
        correctSoundRef.current();
      }
      setShowStar(true);
      
      const points = gameSettings?.scorePoints || 10;
      setScore(prev => prev + points);
      setRound(prev => prev + 1);

      setTimeout(() => {
        setShowStar(false);
        setDisabled(false);
        generateNewPair();
      }, 2000);
    } else {
      // Wrong answer
      if (gameSettings?.soundEnabled !== false && wrongSoundRef.current) {
        wrongSoundRef.current();
      }
      setIsShaking(true);

      setTimeout(() => {
        setIsShaking(false);
        setDisabled(false);
      }, 1500);
    }
  }, [currentPair, disabled, gameSettings, initAudio, generateNewPair]);

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setScore(0);
    setRound(0);
    setCurrentPair(null);
    setShowStar(false);
    setIsShaking(false);
    setDisabled(false);
    setUsedPairs([]);
  };

  if (!gameStarted) {
    return (
      <div className="tama-o-mali-game">
        <div className="game-menu-container">
          <motion.button
            className="back-button"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Bumalik
          </motion.button>
          <motion.div
            className="game-menu"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="game-title">Tama o Mali</h1>
            <p className="game-description">
              Tingnan ang larawan at salita. Pindutin ang TAMA kung tumugma sila, 
              o MALI kung hindi sila tumugma!
            </p>
            <motion.button
              className="start-button"
              onClick={startGame}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 10px 30px rgba(102, 126, 234, 0.4)",
                  "0 15px 40px rgba(102, 126, 234, 0.6)",
                  "0 10px 30px rgba(102, 126, 234, 0.4)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🎮 Magsimula
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="tama-o-mali-game">
      <div className="game-container">
        <motion.div 
          className="game-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            className="back-button"
            onClick={resetGame}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            ← Menu
          </motion.button>
          <div className="stats-container">
            {gameSettings?.showScore !== false && (
              <motion.div 
                className="score-display"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                whileHover={{ scale: 1.1 }}
              >
                ⭐ Score: {score}
              </motion.div>
            )}
            {gameSettings?.showRoundCounter !== false && (
              <motion.div 
                className="round-display"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                whileHover={{ scale: 1.1 }}
              >
                🔄 Round: {round}
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="game-content"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          key={currentPair?.word}
        >
          <ImagePrompt image={currentPair?.image} isShaking={isShaking} />
          <WordDisplay word={currentPair?.word} />
          <DecisionButtons 
            onAnswer={handleAnswer} 
            disabled={disabled}
            isShaking={isShaking}
          />
          <StarAnimation show={showStar} />
        </motion.div>
      </div>
    </div>
  );
};

export default TamaOMali;


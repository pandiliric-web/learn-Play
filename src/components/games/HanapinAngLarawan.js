import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameSettingsAPI } from '../../services/api';
import './HanapinAngLarawan.css';

// InstructionText Component
const InstructionText = ({ instruction }) => {
  return (
    <motion.div
      className="instruction-text"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2>{instruction}</h2>
    </motion.div>
  );
};

// ImageItem Component
const ImageItem = ({ image, word, isCorrect, onClick, isShaking, disabled }) => {
  return (
    <motion.div
      className={`image-item ${isCorrect ? 'correct' : ''}`}
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, scale: 0 }}
      animate={
        isShaking
          ? {
              x: [0, -10, 10, -10, 10, 0],
              transition: { duration: 0.5 }
            }
          : { opacity: 1, scale: 1 }
      }
      whileHover={!disabled ? { scale: 1.1, y: -5 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
    >
      <div className="image-item-content">
        <div className="image-emoji">{image}</div>
        <div className="image-label">{word}</div>
      </div>
    </motion.div>
  );
};

// ImageGrid Component
const ImageGrid = ({ images, targetWord, onImageClick, isShaking, disabled, correctImage }) => {
  // Shuffle images for display
  const shuffledImages = [...images].sort(() => Math.random() - 0.5);

  return (
    <motion.div
      className="image-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      {shuffledImages.map((item, index) => (
        <ImageItem
          key={`${item.word}-${index}`}
          image={item.image}
          word={item.word}
          isCorrect={item.word === targetWord}
          onClick={() => onImageClick(item.word === targetWord)}
          isShaking={isShaking && item.word !== targetWord}
          disabled={disabled}
        />
      ))}
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

// Filipino vocabulary items by category
const FILIPINO_VOCABULARY = {
  prutas: [
    { word: 'mangga', image: '🥭' },
    { word: 'mansanas', image: '🍎' },
    { word: 'saging', image: '🍌' },
    { word: 'ubas', image: '🍇' },
    { word: 'pakwan', image: '🍉' },
    { word: 'pinya', image: '🍍' },
    { word: 'strawberry', image: '🍓' },
    { word: 'dalandan', image: '🍊' },
    { word: 'melon', image: '🍈' },
    { word: 'peras', image: '🍐' },
    { word: 'cherry', image: '🍒' },
    { word: 'papaya', image: '🥝' }
  ],
  hayop: [
    { word: 'aso', image: '🐶' },
    { word: 'pusa', image: '🐱' },
    { word: 'ibon', image: '🐦' },
    { word: 'isda', image: '🐟' },
    { word: 'kabayo', image: '🐴' },
    { word: 'baka', image: '🐄' },
    { word: 'manok', image: '🐔' },
    { word: 'baboy', image: '🐷' },
    { word: 'tupa', image: '🐑' },
    { word: 'elepante', image: '🐘' },
    { word: 'leon', image: '🦁' },
    { word: 'oso', image: '🐻' }
  ],
  lugar: [
    { word: 'bahay', image: '🏠' },
    { word: 'paaralan', image: '🏫' },
    { word: 'ospital', image: '🏥' },
    { word: 'parke', image: '🏞️' },
    { word: 'dagat', image: '🌊' },
    { word: 'bundok', image: '⛰️' },
    { word: 'gubat', image: '🌲' },
    { word: 'kapihan', image: '☕' },
    { word: 'palengke', image: '🏪' },
    { word: 'simbahan', image: '⛪' },
    { word: 'sinehan', image: '🎬' },
    { word: 'palaruan', image: '🎪' }
  ],
  bagay: [
    { word: 'libro', image: '📚' },
    { word: 'lapis', image: '✏️' },
    { word: 'sapatos', image: '👟' },
    { word: 'kaso', image: '📱' },
    { word: 'kotse', image: '🚗' },
    { word: 'bola', image: '⚽' },
    { word: 'gitara', image: '🎸' },
    { word: 'keyk', image: '🎂' },
    { word: 'payong', image: '☂️' },
    { word: 'susi', image: '🗝️' },
    { word: 'relo', image: '⌚' },
    { word: 'telepono', image: '📞' }
  ]
};

const CATEGORIES = Object.keys(FILIPINO_VOCABULARY);

const HanapinAngLarawan = ({ onBack }) => {
  const [targetWord, setTargetWord] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [displayImages, setDisplayImages] = useState([]);
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
        const response = await gameSettingsAPI.getGameSettings('hanapin-ang-larawan');
        if (response.ok) {
          const data = await response.json();
          setGameSettings(data);
        }
      } catch (error) {
        console.warn('Failed to load game settings:', error);
      }
    };

    loadSettings();
    const interval = setInterval(loadSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  // Generate new question
  const generateNewQuestion = useCallback(() => {
    // Select random category
    const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const categoryItems = FILIPINO_VOCABULARY[randomCategory];

    // Select target word (avoid repetition)
    const availableItems = categoryItems.filter(
      item => !usedPairs.some(pair => pair.word === item.word && pair.category === randomCategory)
    );

    let newTarget;
    let updatedUsedPairs = [...usedPairs];

    if (availableItems.length === 0) {
      // Reset if all items used
      updatedUsedPairs = [];
      newTarget = categoryItems[Math.floor(Math.random() * categoryItems.length)];
    } else {
      newTarget = availableItems[Math.floor(Math.random() * availableItems.length)];
      updatedUsedPairs.push({ word: newTarget.word, category: randomCategory });
    }

    setTargetWord(newTarget.word);
    setCurrentCategory(randomCategory);
    setUsedPairs(updatedUsedPairs);

    // Select 6 random images including the target (mix from all categories)
    const allItems = Object.values(FILIPINO_VOCABULARY).flat();
    const otherItems = allItems
      .filter(item => item.word !== newTarget.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const finalImages = [newTarget, ...otherItems].sort(() => Math.random() - 0.5);
    setDisplayImages(finalImages);
  }, [usedPairs]);

  // Regenerate when target word changes
  useEffect(() => {
    if (gameStarted && currentCategory && targetWord) {
      const categoryItems = FILIPINO_VOCABULARY[currentCategory];
      const targetItem = categoryItems.find(item => item.word === targetWord);
      
      if (targetItem) {
        // Select 6 random images
        const allItems = Object.values(FILIPINO_VOCABULARY).flat();
        const otherItems = allItems
          .filter(item => item.word !== targetWord)
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);

        const finalImages = [targetItem, ...otherItems].sort(() => Math.random() - 0.5);
        setDisplayImages(finalImages);
      }
    }
  }, [targetWord, currentCategory, gameStarted]);

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
    
    // Initialize first question
    const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const categoryItems = FILIPINO_VOCABULARY[randomCategory];
    const targetItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
    
    setTargetWord(targetItem.word);
    setCurrentCategory(randomCategory);
    
    // Set initial images
    const allItems = Object.values(FILIPINO_VOCABULARY).flat();
    const otherItems = allItems
      .filter(item => item.word !== targetItem.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    
    const initialImages = [targetItem, ...otherItems].sort(() => Math.random() - 0.5);
    setDisplayImages(initialImages);
  }, [gameSettings, initAudio]);

  // Handle image click
  const handleImageClick = useCallback((isCorrect) => {
    if (disabled) return;

    initAudio();
    setDisabled(true);

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
        generateNewQuestion();
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
  }, [disabled, gameSettings, initAudio, generateNewQuestion]);

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setScore(0);
    setRound(0);
    setTargetWord(null);
    setCurrentCategory(null);
    setDisplayImages([]);
    setShowStar(false);
    setIsShaking(false);
    setDisabled(false);
    setUsedPairs([]);
  };

  if (!gameStarted) {
    return (
      <div className="hanapin-ang-larawan-game">
        <div className="game-menu-container">
          <motion.button
            className="back-button"
            onClick={onBack}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Menu
          </motion.button>
          <motion.div
            className="game-menu"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="game-title">Hanapin ang Larawan</h1>
            <p className="game-description">
              Hanapin ang tamang larawan na tumugma sa salitang Filipino!
              Piliin ang tamang larawan mula sa mga pagpipilian.
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
    <div className="hanapin-ang-larawan-game">
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
          key={targetWord}
        >
          <InstructionText instruction={`Hanapin ang ${targetWord}`} />
          <ImageGrid
            images={displayImages}
            targetWord={targetWord}
            onImageClick={handleImageClick}
            isShaking={isShaking}
            disabled={disabled}
          />
          <StarAnimation show={showStar} />
        </motion.div>
      </div>
    </div>
  );
};

export default HanapinAngLarawan;


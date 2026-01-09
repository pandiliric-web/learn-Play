import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gameSettingsAPI } from '../../services/api';
import './BuoAngPangungusap.css';

// Sentence data for Grade 1 level
const SENTENCES = [
  {
    words: ['Si', 'Maria', 'ay', 'maganda'],
    image: '👧',
    meaning: 'Maria is beautiful'
  },
  {
    words: ['Ang', 'aso', 'ay', 'mabait'],
    image: '🐶',
    meaning: 'The dog is kind'
  },
  {
    words: ['Kumain', 'ako', 'ng', 'mansanas'],
    image: '🍎',
    meaning: 'I ate an apple'
  },
  {
    words: ['Maganda', 'ang', 'araw', 'ngayon'],
    image: '☀️',
    meaning: 'The weather is beautiful today'
  },
  {
    words: ['Naglalaro', 'ang', 'bata', 'sa', 'labas'],
    image: '🏃',
    meaning: 'The child is playing outside'
  },
  {
    words: ['Bumili', 'ako', 'ng', 'libro'],
    image: '📚',
    meaning: 'I bought a book'
  },
  {
    words: ['Masaya', 'ang', 'pamilya'],
    image: '👨‍👩‍👧‍👦',
    meaning: 'The family is happy'
  },
  {
    words: ['Uminom', 'ako', 'ng', 'tubig'],
    image: '💧',
    meaning: 'I drank water'
  },
  {
    words: ['Maganda', 'ang', 'bulaklak'],
    image: '🌸',
    meaning: 'The flower is beautiful'
  },
  {
    words: ['Nagluto', 'si', 'Nanay', 'ng', 'pagkain'],
    image: '👩‍🍳',
    meaning: 'Mother cooked food'
  }
];

const BuoAngPangungusap = ({ onBack }) => {
  const [currentSentence, setCurrentSentence] = useState(null);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [usedSentences, setUsedSentences] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
  const [draggedWord, setDraggedWord] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const audioContextRef = useRef(null);
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);

  // Initialize audio
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

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
        const response = await gameSettingsAPI.getGameSettings('buo-ang-pangungusap');
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

  // Generate new sentence
  const generateNewSentence = useCallback(() => {
    if (usedSentences.length >= SENTENCES.length) {
      setUsedSentences([]);
    }

    const availableSentences = SENTENCES.filter(
      (s, idx) => !usedSentences.includes(idx)
    );
    const randomSentence = availableSentences[
      Math.floor(Math.random() * availableSentences.length)
    ];
    const sentenceIndex = SENTENCES.indexOf(randomSentence);
    
    setCurrentSentence(randomSentence);
    setUsedSentences(prev => [...prev, sentenceIndex]);
    
    // Shuffle words
    const shuffled = [...randomSentence.words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setSelectedWords([]);
    setIsCorrect(null);
  }, [usedSentences]);

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
    setUsedSentences([]);
    generateNewSentence();
  }, [gameSettings, initAudio, generateNewSentence]);

  // Handle word selection (click)
  const handleWordClick = (word, index) => {
    if (isCorrect !== null) return; // Disable during feedback
    
    const wordIndex = shuffledWords.indexOf(word);
    if (wordIndex === -1) return;

    // Remove from shuffled and add to selected
    const newShuffled = shuffledWords.filter((_, i) => i !== wordIndex);
    const newSelected = [...selectedWords, word];
    
    setShuffledWords(newShuffled);
    setSelectedWords(newSelected);
  };

  // Handle word removal from selected
  const handleRemoveWord = (index) => {
    if (isCorrect !== null) return;
    
    const word = selectedWords[index];
    const newSelected = selectedWords.filter((_, i) => i !== index);
    const newShuffled = [...shuffledWords, word];
    
    setSelectedWords(newSelected);
    setShuffledWords(newShuffled);
  };

  // Check answer
  const checkAnswer = useCallback(() => {
    if (selectedWords.length !== currentSentence.words.length || isCorrect !== null) {
      return;
    }

    initAudio();

    const isAnswerCorrect = JSON.stringify(selectedWords) === JSON.stringify(currentSentence.words);
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      if (gameSettings?.soundEnabled !== false && correctSoundRef.current) {
        correctSoundRef.current();
      }
      setShowCelebration(true);
      
      const points = gameSettings?.scorePoints || 20;
      setScore(prev => prev + points);
      setRound(prev => prev + 1);

      setTimeout(() => {
        setShowCelebration(false);
        setIsCorrect(null);
        generateNewSentence();
      }, 2500);
    } else {
      if (gameSettings?.soundEnabled !== false && wrongSoundRef.current) {
        wrongSoundRef.current();
      }
      
      setTimeout(() => {
        setIsCorrect(null);
        // Reset to try again
        const allWords = [...selectedWords, ...shuffledWords];
        const originalShuffled = [...currentSentence.words].sort(() => Math.random() - 0.5);
        setShuffledWords(originalShuffled);
        setSelectedWords([]);
      }, 2000);
    }
  }, [selectedWords, currentSentence, isCorrect, gameSettings, initAudio, shuffledWords, generateNewSentence]);

  // Drag and drop handlers
  const handleDragStart = (e, word, index) => {
    setDraggedWord({ word, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', word);
  };

  const handleDragOver = (e, slotIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredSlot(slotIndex);
  };

  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    if (!draggedWord || isCorrect !== null) return;

    const word = draggedWord.word;
    const newShuffled = shuffledWords.filter((_, i) => i !== draggedWord.index);
    const newSelected = [...selectedWords];
    
    // Insert at the correct position
    if (slotIndex < newSelected.length) {
      newSelected[slotIndex] = word;
    } else {
      // Fill empty slots first
      while (newSelected.length < slotIndex) {
        newSelected.push(null);
      }
      newSelected.push(word);
    }
    
    setSelectedWords(newSelected.filter(w => w !== null));
    setShuffledWords(newShuffled);
    setDraggedWord(null);
    setHoveredSlot(null);
  };

  const handleDragEnd = () => {
    setDraggedWord(null);
    setHoveredSlot(null);
  };

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setScore(0);
    setRound(0);
    setCurrentSentence(null);
    setShuffledWords([]);
    setSelectedWords([]);
    setIsCorrect(null);
    setShowCelebration(false);
    setUsedSentences([]);
  };

  if (!gameStarted) {
    return (
      <div className="buo-pangungusap-game">
        <div className="game-menu">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="game-icon-large">🧩</div>
            <h1>Buo ang Pangungusap</h1>
            <p className="game-description">
              Piliin at ayusin ang mga salita upang makabuo ng tamang pangungusap!
              <br />
              <span style={{ fontSize: '0.9em', opacity: 0.8 }}>
                Drag and drop o i-click ang mga salita upang ayusin ang pangungusap.
              </span>
            </p>
            <motion.button
              className="start-button"
              onClick={startGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Magsimula
            </motion.button>
            {onBack && (
              <button className="back-button" onClick={onBack}>
                Bumalik sa Menu
              </button>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="buo-pangungusap-game">
      <div className="game-header">
        <Link to="/subjects" className="back-btn">
          ← Bumalik sa Subjects
        </Link>
        <h1 className="game-title">Buo ang Pangungusap</h1>
        <div className="game-stats">
          {gameSettings?.showScore !== false && (
            <div className="stat">
              <span className="stat-label">Puntos:</span>
              <span className="stat-value">{score}</span>
            </div>
          )}
          {gameSettings?.showRoundCounter !== false && (
            <div className="stat">
              <span className="stat-label">Bilang:</span>
              <span className="stat-value">{round}</span>
            </div>
          )}
        </div>
        <button className="reset-btn" onClick={resetGame}>
          I-reset
        </button>
      </div>

      <div className="game-content">
        {/* Image and meaning hint */}
        <motion.div
          className="sentence-prompt"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="prompt-image">{currentSentence?.image}</div>
          <p className="prompt-meaning">{currentSentence?.meaning}</p>
        </motion.div>

        {/* Sentence slots */}
        <div className="sentence-slots-container">
          <h3>Buoin ang Pangungusap:</h3>
          <div className="sentence-slots">
            {currentSentence?.words.map((word, index) => (
              <motion.div
                key={`slot-${index}`}
                className={`sentence-slot ${hoveredSlot === index ? 'hovered' : ''} ${
                  selectedWords[index] ? 'filled' : 'empty'
                } ${isCorrect === false && selectedWords[index] !== word ? 'wrong' : ''}`}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {selectedWords[index] ? (
                  <motion.div
                    className="slot-word"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => handleRemoveWord(index)}
                  >
                    {selectedWords[index]}
                    <span className="remove-icon">×</span>
                  </motion.div>
                ) : (
                  <span className="slot-placeholder">{index + 1}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Available words */}
        <div className="words-container">
          <h3>Mga Salita:</h3>
          <div className="words-grid">
            {shuffledWords.map((word, index) => (
              <motion.button
                key={`word-${index}`}
                className="word-button"
                draggable
                onDragStart={(e) => handleDragStart(e, word, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleWordClick(word, index)}
                disabled={isCorrect !== null}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.05, type: 'spring' }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                {word}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Check button */}
        <motion.button
          className={`check-button ${selectedWords.length === currentSentence?.words.length ? 'ready' : ''}`}
          onClick={checkAnswer}
          disabled={selectedWords.length !== currentSentence?.words.length || isCorrect !== null}
          whileHover={
            selectedWords.length === currentSentence?.words.length
              ? { scale: 1.05 }
              : {}
          }
          whileTap={{ scale: 0.95 }}
        >
          {isCorrect === null
            ? 'Tingnan ang Sagot'
            : isCorrect
            ? 'Tama! Magaling! 🎉'
            : 'Mali. Subukan muli! 💪'}
        </motion.button>

        {/* Celebration animation */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              className="celebration"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="celebration-star"
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: Math.cos((i * Math.PI * 2) / 12) * 150,
                    y: Math.sin((i * Math.PI * 2) / 12) * 150,
                    rotate: 360
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                    ease: 'easeOut'
                  }}
                >
                  ⭐
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BuoAngPangungusap;

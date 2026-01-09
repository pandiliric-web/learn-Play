import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WordMatch.css';

// ImageCard Component
const ImageCard = ({ image, isCorrect }) => {
  return (
    <motion.div
      className="image-card"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="image-display">{image}</div>
    </motion.div>
  );
};

// WordButton Component
const WordButton = ({ word, onClick, isCorrect, isWrong, disabled }) => {
  return (
    <motion.button
      className={`word-button ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      animate={
        isWrong
          ? {
              x: [0, -10, 10, -10, 10, 0],
              transition: { duration: 0.5 }
            }
          : isCorrect
          ? {
              scale: [1, 1.2, 1],
              transition: { duration: 0.4 }
            }
          : {}
      }
    >
      <span className="word-text">{word}</span>
      {isCorrect && (
        <motion.span
          className="check-mark"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          ✓
        </motion.span>
      )}
    </motion.button>
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

// Word-Image pairs for Grade 1 vocabulary
const WORD_IMAGE_PAIRS = [
  { word: 'apple', image: '🍎', options: ['apple', 'ball', 'cat'] },
  { word: 'ball', image: '⚽', options: ['ball', 'dog', 'fish'] },
  { word: 'cat', image: '🐱', options: ['cat', 'apple', 'sun'] },
  { word: 'dog', image: '🐶', options: ['dog', 'cat', 'tree'] },
  { word: 'fish', image: '🐟', options: ['fish', 'ball', 'apple'] },
  { word: 'sun', image: '☀️', options: ['sun', 'moon', 'star'] },
  { word: 'moon', image: '🌙', options: ['moon', 'sun', 'star'] },
  { word: 'star', image: '⭐', options: ['star', 'moon', 'sun'] },
  { word: 'tree', image: '🌳', options: ['tree', 'flower', 'house'] },
  { word: 'flower', image: '🌸', options: ['flower', 'tree', 'bird'] },
  { word: 'bird', image: '🐦', options: ['bird', 'fish', 'cat'] },
  { word: 'house', image: '🏠', options: ['house', 'tree', 'car'] },
  { word: 'car', image: '🚗', options: ['car', 'house', 'book'] },
  { word: 'book', image: '📚', options: ['book', 'car', 'apple'] },
  { word: 'hat', image: '🎩', options: ['hat', 'book', 'ball'] },
  { word: 'cup', image: '☕', options: ['cup', 'hat', 'cat'] },
  { word: 'shoe', image: '👟', options: ['shoe', 'cup', 'dog'] },
  { word: 'hand', image: '✋', options: ['hand', 'shoe', 'fish'] },
  { word: 'heart', image: '❤️', options: ['heart', 'hand', 'star'] },
  { word: 'cake', image: '🎂', options: ['cake', 'heart', 'book'] }
];

const WordMatch = ({ onBack }) => {
  const [currentPair, setCurrentPair] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showStar, setShowStar] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [usedPairs, setUsedPairs] = useState([]); // Track used questions to avoid repetition
  const audioContextRef = useRef(null);
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const speechSynthesisRef = useRef(null);

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

  // Speak word using text-to-speech
  const speakWord = useCallback((word) => {
    try {
      if ('speechSynthesis' in window) {
        if (speechSynthesisRef.current) {
          window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.7; // Slower for Grade 1
        utterance.pitch = 1.2;
        utterance.volume = 0.9;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice =>
          voice.name.includes('Child') ||
          voice.name.includes('Kid') ||
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
  }, []);

  // Load voices for text-to-speech
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
        }
      }
    };
    loadVoices();
  }, []);

  // Generate a random word-image pair (avoiding all used questions)
  const generateNewPair = useCallback((currentUsedPairs = usedPairs) => {
    // Filter out ALL used pairs (not just recent ones)
    const availablePairs = WORD_IMAGE_PAIRS.filter(pair => !currentUsedPairs.includes(pair.word));
    
    // If all pairs have been used, reset the used pairs list to allow cycling through again
    let pairsToChooseFrom;
    if (availablePairs.length === 0) {
      // All questions have been used, reset and start over
      pairsToChooseFrom = WORD_IMAGE_PAIRS;
    } else {
      pairsToChooseFrom = availablePairs;
    }
    
    // Select a random pair from available options
    const randomPair = pairsToChooseFrom[Math.floor(Math.random() * pairsToChooseFrom.length)];
    
    // Create more diverse wrong options by selecting from other words
    const allWords = WORD_IMAGE_PAIRS.map(p => p.word);
    const wrongOptions = allWords
      .filter(word => word !== randomPair.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2); // Get 2 wrong options
    
    // Combine correct answer with wrong options and shuffle thoroughly
    const allOptions = [randomPair.word, ...wrongOptions];
    
    // Better shuffle algorithm (Fisher-Yates)
    const shuffledOptions = [...allOptions];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }
    
    return {
      ...randomPair,
      options: shuffledOptions
    };
  }, [usedPairs]);

  // Start game
  const startGame = () => {
    initAudio();
    setGameStarted(true);
    setUsedPairs([]); // Reset used pairs
    const newPair = generateNewPair();
    setCurrentPair(newPair);
    setUsedPairs([newPair.word]); // Track the first question
    setScore(0);
    setRound(0);
    setSelectedWord(null);
    setShowStar(false);
    setDisabled(false);
  };

  // Handle word button click
  const handleWordClick = (word) => {
    if (disabled || !currentPair) return;

    initAudio();
    setDisabled(true);
    setSelectedWord(word);

    if (word === currentPair.word) {
      // Correct answer
      if (correctSoundRef.current) {
        correctSoundRef.current();
      }
      speakWord(word);
      setShowStar(true);
      setScore(prev => prev + 10);
      setRound(prev => prev + 1);

      setTimeout(() => {
        setShowStar(false);
        setSelectedWord(null);
        setDisabled(false);
        
        // Track the current question as used and generate next question
        setUsedPairs(prev => {
          const updated = [...prev];
          const currentWord = currentPair.word;
          
          // Add current question to used list if not already there
          if (!updated.includes(currentWord)) {
            updated.push(currentWord);
          }
          
          // Check if all questions have been used
          if (updated.length >= WORD_IMAGE_PAIRS.length) {
            // All questions used, reset and start fresh
            const newPair = generateNewPair([]);
            setCurrentPair(newPair);
            return [newPair.word]; // Start fresh with just the new question
          } else {
            // Generate new pair avoiding all used questions
            const newPair = generateNewPair(updated);
            setCurrentPair(newPair);
            return updated;
          }
        });
      }, 2000);
    } else {
      // Wrong answer
      if (wrongSoundRef.current) {
        wrongSoundRef.current();
      }

      setTimeout(() => {
        setSelectedWord(null);
        setDisabled(false);
      }, 1500);
    }
  };

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setCurrentPair(null);
    setScore(0);
    setRound(0);
    setSelectedWord(null);
    setShowStar(false);
    setDisabled(false);
    setUsedPairs([]); // Reset used pairs
  };

  return (
    <div className="word-match-game">
      <div className="word-match-container">
        {/* Header */}
        <div className="word-match-header">
          <button onClick={onBack} className="back-button">← Back</button>
          <div className="header-stats">
            <div className="score-display">Score: {score}</div>
            {gameStarted && <div className="round-display">Round: {round + 1}</div>}
          </div>
        </div>

        {!gameStarted ? (
          <motion.div
            className="word-match-menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="game-title">🔤 Word Match 🔤</h1>
            <p className="game-description">
              Look at the picture and choose the word that matches!
            </p>
            <button className="start-game-btn" onClick={startGame}>
              Start Game
            </button>
          </motion.div>
        ) : (
          <div className="word-match-gameplay">
            {/* Image Display */}
            {currentPair && (
              <motion.div
                key={currentPair.word}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ImageCard image={currentPair.image} />
              </motion.div>
            )}

            {/* Word Buttons */}
            {currentPair && (
              <div className="word-buttons-container">
                <StarAnimation show={showStar} />
                {currentPair.options.map((word, index) => (
                  <WordButton
                    key={`${word}-${round}-${index}`}
                    word={word}
                    onClick={() => handleWordClick(word)}
                    isCorrect={selectedWord === word && word === currentPair.word}
                    isWrong={selectedWord === word && word !== currentPair.word}
                    disabled={disabled}
                  />
                ))}
              </div>
            )}

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

export default WordMatch;


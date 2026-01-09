import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameSettingsAPI } from '../../services/api';
import './SpellingPuzzle.css';

// Letter Tile Component
const LetterTile = ({ letter, onClick, isUsed, isShaking }) => {
  return (
    <motion.button
      className={`letter-tile ${isUsed ? 'used' : ''} ${isShaking ? 'shaking' : ''}`}
      onClick={onClick}
      disabled={isUsed}
      whileHover={!isUsed ? { scale: 1.1, y: -5 } : {}}
      whileTap={!isUsed ? { scale: 0.95 } : {}}
      animate={
        isShaking
          ? {
              x: [0, -10, 10, -10, 10, 0],
              transition: { duration: 0.5 }
            }
          : {}
      }
    >
      <span className="tile-letter">{letter}</span>
    </motion.button>
  );
};

// Word Slot Component
const WordSlot = ({ letter, index, onRemove }) => {
  return (
    <motion.div
      className={`word-slot ${letter ? 'filled' : 'empty'}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {letter ? (
        <motion.button
          className="slot-letter"
          onClick={() => onRemove(index)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {letter}
        </motion.button>
      ) : (
        <span className="slot-placeholder">{index + 1}</span>
      )}
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

// Word list for Grade 1 spelling
const SPELLING_WORDS = [
  { word: 'CAT', hint: '🐱', image: '🐱' },
  { word: 'DOG', hint: '🐶', image: '🐶' },
  { word: 'SUN', hint: '☀️', image: '☀️' },
  { word: 'MOON', hint: '🌙', image: '🌙' },
  { word: 'STAR', hint: '⭐', image: '⭐' },
  { word: 'TREE', hint: '🌳', image: '🌳' },
  { word: 'FISH', hint: '🐟', image: '🐟' },
  { word: 'BIRD', hint: '🐦', image: '🐦' },
  { word: 'BALL', hint: '⚽', image: '⚽' },
  { word: 'CAKE', hint: '🎂', image: '🎂' },
  { word: 'BOOK', hint: '📚', image: '📚' },
  { word: 'HAND', hint: '✋', image: '✋' },
  { word: 'FOOT', hint: '🦶', image: '🦶' },
  { word: 'HAT', hint: '🎩', image: '🎩' },
  { word: 'CUP', hint: '☕', image: '☕' },
  { word: 'CAR', hint: '🚗', image: '🚗' },
  { word: 'BED', hint: '🛏️', image: '🛏️' },
  { word: 'TOY', hint: '🧸', image: '🧸' },
  { word: 'BOX', hint: '📦', image: '📦' },
  { word: 'KEY', hint: '🗝️', image: '🗝️' }
];

const SpellingPuzzle = ({ onBack }) => {
  const [currentWord, setCurrentWord] = useState(null);
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [wordSlots, setWordSlots] = useState([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [showStar, setShowStar] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [shakingTile, setShakingTile] = useState(null);
  const [usedWords, setUsedWords] = useState([]);
  const [gameSettings, setGameSettings] = useState(null);
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
    if (gameSettings?.soundEnabled === false) return;
    
    try {
      if ('speechSynthesis' in window) {
        if (speechSynthesisRef.current) {
          window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.7;
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
  }, [gameSettings]);

  // Load game settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await gameSettingsAPI.getGameSettings('spelling-puzzle');
        const data = await response.json();
        if (response.ok && data.success) {
          const settings = data.settings.toObject ? data.settings.toObject() : data.settings;
          setGameSettings(settings);
        }
      } catch (error) {
        console.warn('Failed to load game settings, using defaults:', error);
      }
    };
    loadSettings();
    
    // Reload settings every 30 seconds
    const interval = setInterval(loadSettings, 30000);
    return () => clearInterval(interval);
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

  // Generate a new word (avoiding repetitions)
  const generateNewWord = useCallback(() => {
    const availableWords = SPELLING_WORDS.filter(w => !usedWords.includes(w.word));
    const wordsToChooseFrom = availableWords.length > 0 ? availableWords : SPELLING_WORDS;
    
    const randomWord = wordsToChooseFrom[Math.floor(Math.random() * wordsToChooseFrom.length)];
    
    // Scramble the letters
    const letters = randomWord.word.split('');
    const scrambled = [...letters].sort(() => Math.random() - 0.5);
    
    return {
      word: randomWord.word,
      hint: randomWord.hint,
      image: randomWord.image,
      scrambled
    };
  }, [usedWords]);

  // Start game
  const startGame = () => {
    if (gameSettings?.enabled === false) {
      alert('This game is currently disabled by the administrator.');
      return;
    }
    
    initAudio();
    setGameStarted(true);
    setUsedWords([]);
    const newWordData = generateNewWord();
    setCurrentWord(newWordData);
    setScrambledLetters(newWordData.scrambled);
    setWordSlots(Array(newWordData.word.length).fill(null));
    setScore(0);
    setRound(0);
  };

  // Handle letter tile click
  const handleLetterClick = (letter, index) => {
    // Find first empty slot
    const emptySlotIndex = wordSlots.findIndex(slot => slot === null);
    
    if (emptySlotIndex === -1) {
      // All slots filled, check word
      checkWord();
      return;
    }

    // Move letter to slot
    const newSlots = [...wordSlots];
    newSlots[emptySlotIndex] = letter;
    setWordSlots(newSlots);

    // Remove letter from scrambled letters
    const newScrambled = [...scrambledLetters];
    newScrambled.splice(index, 1);
    setScrambledLetters(newScrambled);

    // Auto-check if all slots are filled
    if (newSlots.every(slot => slot !== null)) {
      setTimeout(() => checkWord(), 300);
    }
  };

  // Handle slot letter removal
  const handleSlotRemove = (slotIndex) => {
    const letter = wordSlots[slotIndex];
    if (!letter) return;

    // Remove from slot
    const newSlots = [...wordSlots];
    newSlots[slotIndex] = null;
    setWordSlots(newSlots);

    // Add back to scrambled letters
    setScrambledLetters([...scrambledLetters, letter]);
  };

  // Check if word is correct
  const checkWord = () => {
    if (!currentWord) return;

    const formedWord = wordSlots.join('');
    
    if (formedWord === currentWord.word) {
      // Correct!
      if (gameSettings?.soundEnabled !== false && correctSoundRef.current) {
        correctSoundRef.current();
      }
      speakWord(currentWord.word);
      setShowStar(true);
      
      const scorePoints = gameSettings?.scorePoints || 10;
      setScore(prev => prev + scorePoints);
      setRound(prev => prev + 1);

      setTimeout(() => {
        setShowStar(false);
        setUsedWords(prev => {
          const updated = [...prev, currentWord.word];
          return updated.length >= SPELLING_WORDS.length ? [] : updated;
        });
        
        const newWordData = generateNewWord();
        setCurrentWord(newWordData);
        setScrambledLetters(newWordData.scrambled);
        setWordSlots(Array(newWordData.word.length).fill(null));
      }, 2000);
    } else {
      // Wrong - shake all tiles
      setShakingTile('all');
      if (gameSettings?.soundEnabled !== false && wrongSoundRef.current) {
        wrongSoundRef.current();
      }
      
      setTimeout(() => {
        setShakingTile(null);
        // Clear slots and return letters
        setScrambledLetters([...scrambledLetters, ...wordSlots.filter(l => l !== null)]);
        setWordSlots(Array(currentWord.word.length).fill(null));
      }, 1000);
    }
  };

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setCurrentWord(null);
    setScrambledLetters([]);
    setWordSlots([]);
    setScore(0);
    setRound(0);
    setShowStar(false);
    setShakingTile(null);
    setUsedWords([]);
  };

  return (
    <div className="spelling-puzzle-game">
      <div className="spelling-puzzle-container">
        {/* Header */}
        <div className="spelling-puzzle-header">
          <button onClick={onBack} className="back-button">← Back</button>
          <div className="header-stats">
            {gameSettings?.showScore !== false && (
              <div className="score-display">Score: {score}</div>
            )}
            {gameStarted && gameSettings?.showRoundCounter !== false && (
              <div className="round-display">Round: {round + 1}</div>
            )}
          </div>
        </div>

        {!gameStarted ? (
          <motion.div
            className="spelling-puzzle-menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="game-title">🧩 Spelling Puzzle 🧩</h1>
            <p className="game-description">
              Look at the picture and arrange the letters to spell the word!
            </p>
            <button className="start-game-btn" onClick={startGame}>
              Start Game
            </button>
          </motion.div>
        ) : (
          <div className="spelling-puzzle-gameplay">
            {/* Word Hint Display */}
            {currentWord && (
              <motion.div
                className="word-hint-display"
                key={currentWord.word}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="hint-image">{currentWord.image}</div>
                <p className="hint-text">Spell this word:</p>
              </motion.div>
            )}

            {/* Word Slots */}
            {currentWord && (
              <div className="word-slots-container">
                <StarAnimation show={showStar} />
                <div className="word-slots">
                  {wordSlots.map((letter, index) => (
                    <WordSlot
                      key={index}
                      letter={letter}
                      index={index}
                      onRemove={handleSlotRemove}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Scrambled Letter Tiles */}
            {currentWord && (
              <div className="letters-container">
                <p className="letters-label">Click letters to spell the word:</p>
                <div className="letter-tiles">
                  {scrambledLetters.map((letter, index) => (
                    <LetterTile
                      key={`${letter}-${index}`}
                      letter={letter}
                      onClick={() => handleLetterClick(letter, index)}
                      isUsed={false}
                      isShaking={shakingTile === 'all' || shakingTile === index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Check Button */}
            {currentWord && wordSlots.every(slot => slot !== null) && (
              <motion.button
                className="check-button"
                onClick={checkWord}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✓ Check Word
              </motion.button>
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

export default SpellingPuzzle;


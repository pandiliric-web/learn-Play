import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gameSettingsAPI } from '../../services/api';
import './TamangSalita.css';

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
          : {}
      }
    >
      <div className="image-display">{image}</div>
      <h2 className="prompt-text">Isulat ang tamang salita</h2>
    </motion.div>
  );
};

// LetterButton Component for child-friendly letter input
const LetterButton = ({ letter, onClick, disabled }) => {
  return (
    <motion.button
      className="letter-button"
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.9 } : {}}
    >
      {letter}
    </motion.button>
  );
};

// SubmitButton Component
const SubmitButton = ({ onClick, disabled, isShaking }) => {
  return (
    <motion.button
      className="submit-button"
      onClick={onClick}
      disabled={disabled}
      animate={
        isShaking
          ? {
              x: [0, -5, 5, -5, 5, 0],
              transition: { duration: 0.4 }
            }
          : {}
      }
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      Isumite
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

// Filipino word-image pairs for Grade 1 vocabulary
const FILIPINO_WORDS = [
  { word: 'aso', image: '🐶' },
  { word: 'pusa', image: '🐱' },
  { word: 'bahay', image: '🏠' },
  { word: 'araw', image: '☀️' },
  { word: 'tubig', image: '💧' },
  { word: 'puno', image: '🌳' },
  { word: 'ibon', image: '🐦' },
  { word: 'isda', image: '🐟' },
  { word: 'bulaklak', image: '🌸' },
  { word: 'bituin', image: '⭐' },
  { word: 'buwan', image: '🌙' },
  { word: 'kotse', image: '🚗' },
  { word: 'libro', image: '📚' },
  { word: 'sapatos', image: '👟' },
  { word: 'kamay', image: '✋' },
  { word: 'kape', image: '☕' },
  { word: 'keyk', image: '🎂' },
  { word: 'bola', image: '⚽' },
  { word: 'pintuan', image: '🚪' },
  { word: 'bintana', image: '🪟' }
];

// Filipino alphabet for letter buttons
const FILIPINO_ALPHABET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const TamangSalita = ({ onBack }) => {
  const [currentWord, setCurrentWord] = useState(null);
  const [typedWord, setTypedWord] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [showStar, setShowStar] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [disabled, setDisabled] = useState(false);
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
        // Try to find Filipino voice, fallback to any available
        const preferredVoice = voices.find(voice =>
          voice.lang.includes('fil') || voice.lang.includes('tl')
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

  // Load game settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await gameSettingsAPI.getGameSettings('tamang-salita');
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

  // Generate new word (avoid repetition until all words are used)
  const generateNewWord = useCallback(() => {
    if (usedWords.length >= FILIPINO_WORDS.length) {
      setUsedWords([]); // Reset if all words have been used
    }

    const availableWords = FILIPINO_WORDS.filter(w => !usedWords.includes(w.word));
    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    setCurrentWord(randomWord);
    setUsedWords(prev => [...prev, randomWord.word]);
    setTypedWord('');
  }, [usedWords]);

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
    setUsedWords([]);
    generateNewWord();
  }, [gameSettings, initAudio, generateNewWord]);

  // Handle letter button click
  const handleLetterClick = (letter) => {
    if (disabled) return;
    setTypedWord(prev => prev + letter.toLowerCase());
  };

  // Handle backspace
  const handleBackspace = () => {
    if (disabled) return;
    setTypedWord(prev => prev.slice(0, -1));
  };

  // Handle text input change
  const handleInputChange = (e) => {
    if (disabled) return;
    setTypedWord(e.target.value.toLowerCase());
  };

  // Check answer
  const checkAnswer = useCallback(() => {
    if (!typedWord.trim() || disabled) return;

    initAudio();

    const normalizedTyped = typedWord.trim().toLowerCase();
    const normalizedCorrect = currentWord.word.toLowerCase();
    const isCorrect = normalizedTyped === normalizedCorrect;

    setDisabled(true);

    if (isCorrect) {
      // Correct answer
      if (gameSettings?.soundEnabled !== false && correctSoundRef.current) {
        correctSoundRef.current();
      }
      speakWord(currentWord.word);
      setShowStar(true);
      
      const points = gameSettings?.scorePoints || 10;
      setScore(prev => prev + points);
      setRound(prev => prev + 1);

      setTimeout(() => {
        setShowStar(false);
        setDisabled(false);
        generateNewWord();
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
        setTypedWord('');
      }, 1500);
    }
  }, [typedWord, currentWord, disabled, gameSettings, initAudio, speakWord, generateNewWord]);

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setScore(0);
    setRound(0);
    setCurrentWord(null);
    setTypedWord('');
    setShowStar(false);
    setIsShaking(false);
    setDisabled(false);
    setUsedWords([]);
  };

  if (!gameStarted) {
    return (
      <div className="tamang-salita-game">
        <div className="game-menu">
          <h1>Tamang Salita – Isulat ang Sagot</h1>
          <p className="game-description">
            Tingnan ang larawan at isulat ang tamang salita sa Filipino!
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
        </div>
      </div>
    );
  }

  return (
    <div className="tamang-salita-game">
      <div className="game-header">
        <Link to="/subjects" className="back-btn">
          ← Bumalik sa Subjects
        </Link>
        <h1 className="game-title">Tamang Salita – Isulat ang Sagot</h1>
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
        <ImagePrompt image={currentWord?.image} isShaking={isShaking} />

        <div className="input-section">
          <div className="text-input-container">
            <input
              type="text"
              className={`word-input ${isShaking ? 'shaking' : ''}`}
              value={typedWord}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Isulat ang salita..."
              disabled={disabled}
              autoFocus
            />
          </div>

          <div className="letter-buttons-container">
            {FILIPINO_ALPHABET.map((letter, index) => (
              <LetterButton
                key={`${letter}-${index}`}
                letter={letter}
                onClick={() => handleLetterClick(letter)}
                disabled={disabled}
              />
            ))}
            <motion.button
              className="backspace-button"
              onClick={handleBackspace}
              disabled={disabled || typedWord.length === 0}
              whileHover={!disabled && typedWord.length > 0 ? { scale: 1.1 } : {}}
              whileTap={!disabled && typedWord.length > 0 ? { scale: 0.9 } : {}}
            >
              ⌫
            </motion.button>
          </div>

          <SubmitButton
            onClick={checkAnswer}
            disabled={disabled || !typedWord.trim()}
            isShaking={isShaking}
          />

          {isShaking && (
            <motion.div
              className="feedback-message wrong"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Subukan muli! 💪
            </motion.div>
          )}
        </div>

        <StarAnimation show={showStar} />
      </div>
    </div>
  );
};

export default TamangSalita;

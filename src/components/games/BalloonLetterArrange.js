import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameSettingsAPI } from '../../services/api';
import './BalloonLetterArrange.css';

// Balloon letter component
const BalloonLetter = ({ letter, index, onClick, floating }) => {
  // Slightly vary animation timing per balloon
  const duration = 6 + (index % 3);
  const delay = (index % 5) * 0.4;

  return (
    <motion.button
      className="balloon-letter"
      onClick={onClick}
      whileHover={{ scale: 1.08, y: -8 }}
      whileTap={{ scale: 0.95 }}
      animate={
        floating
          ? {
              y: ['0%', '-8%', '0%', '6%', '0%'],
              x: ['0%', '3%', '-4%', '2%', '0%'],
              transition: {
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
                duration,
                delay
              }
            }
          : {}
      }
    >
      <span className="balloon-text">{letter}</span>
      <span className="balloon-string" />
    </motion.button>
  );
};

// Answer slot component
const AnswerSlot = ({ letter, index, onRemove }) => (
  <motion.div
    className={`answer-slot ${letter ? 'filled' : 'empty'}`}
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
  >
    {letter ? (
      <motion.button
        className="slot-letter"
        onClick={() => onRemove(index)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {letter}
      </motion.button>
    ) : (
      <span className="slot-placeholder">{index + 1}</span>
    )}
  </motion.div>
);

// Star animation on success
const StarAnimation = ({ show }) => {
  if (!show) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="bla-star-container"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="bla-star"
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.4, 0],
              x: Math.cos((i / 6) * Math.PI * 2) * 110,
              y: Math.sin((i / 6) * Math.PI * 2) * 110,
              rotate: 360
            }}
            transition={{
              duration: 1,
              delay: i * 0.08,
              ease: 'easeOut'
            }}
          >
            ⭐
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

// Grade 1 words list
const WORDS = [
  'CAT',
  'DOG',
  'SUN',
  'MOON',
  'STAR',
  'FISH',
  'BIRD',
  'TREE',
  'BOOK',
  'CAKE',
  'BALL',
  'CLOUD',
  'GRASS',
  'HOUSE',
  'SCHOOL',
  'RAIN',
  'SNOW',
  'APPLE',
  'SMILE',
  'HAPPY'
];

const BalloonLetterArrange = ({ onBack }) => {
  const [currentWord, setCurrentWord] = useState(null);
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [answerSlots, setAnswerSlots] = useState([]);
  const [usedWords, setUsedWords] = useState([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showStar, setShowStar] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [gameSettings, setGameSettings] = useState(null);
  const audioContextRef = useRef(null);
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  // Audio init
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

      const createHappySound = () => {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      };

      const createTryAgainSound = () => {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      };

      correctSoundRef.current = createHappySound;
      wrongSoundRef.current = createTryAgainSound;
    } catch (err) {
      console.warn('Audio not supported:', err);
    }
  }, []);

  // Text-to-speech
  const speakWord = useCallback(
    (word) => {
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
          const preferred =
            voices.find((v) => v.name.includes('Child') || v.name.includes('Kid')) ||
            voices.find((v) => v.lang.includes('en'));
          if (preferred) utterance.voice = preferred;
          speechSynthesisRef.current = utterance;
          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    },
    [gameSettings]
  );

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await gameSettingsAPI.getGameSettings('balloon-letter-arrange');
        const data = await response.json();
        if (response.ok && data.success) {
          const settings = data.settings.toObject ? data.settings.toObject() : data.settings;
          setGameSettings(settings);
        }
      } catch (err) {
        console.warn('Failed to load Balloon Letter Arrange settings:', err);
      }
    };
    loadSettings();
    const interval = setInterval(loadSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load voices
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

  const shuffleLetters = (letters) => [...letters].sort(() => Math.random() - 0.5);

  const generateNewWord = useCallback(() => {
    const available = WORDS.filter((w) => !usedWords.includes(w));
    const pool = available.length > 0 ? available : WORDS;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    const scrambled = shuffleLetters(selected.split(''));
    return { word: selected, scrambled };
  }, [usedWords]);

  const startGame = () => {
    if (gameSettings?.enabled === false) {
      alert('This game is currently disabled by the administrator.');
      return;
    }
    initAudio();
    setGameStarted(true);
    setScore(0);
    setRound(0);
    setUsedWords([]);
    const next = generateNewWord();
    setCurrentWord(next.word);
    setScrambledLetters(next.scrambled);
    setAnswerSlots(Array(next.word.length).fill(null));
    setShowStar(false);
    setIsShaking(false);
  };

  const handleBalloonClick = (letter, index) => {
    // Find first empty slot
    const emptyIndex = answerSlots.findIndex((slot) => slot === null);
    if (emptyIndex === -1) return;

    const newSlots = [...answerSlots];
    newSlots[emptyIndex] = letter;
    setAnswerSlots(newSlots);

    const updatedLetters = [...scrambledLetters];
    updatedLetters.splice(index, 1);
    setScrambledLetters(updatedLetters);

    if (newSlots.every((slot) => slot !== null)) {
      setTimeout(() => checkAnswer(newSlots), 250);
    }
  };

  const handleSlotRemove = (slotIndex) => {
    const letter = answerSlots[slotIndex];
    if (!letter) return;
    const newSlots = [...answerSlots];
    newSlots[slotIndex] = null;
    setAnswerSlots(newSlots);
    setScrambledLetters([...scrambledLetters, letter]);
  };

  const checkAnswer = (slotsState = answerSlots) => {
    if (!currentWord) return;
    const formed = slotsState.join('');
    if (formed === currentWord) {
      if (gameSettings?.soundEnabled !== false && correctSoundRef.current) correctSoundRef.current();
      speakWord(currentWord);
      setShowStar(true);
      const scorePoints = gameSettings?.scorePoints || 10;
      setScore((prev) => prev + scorePoints);
      setRound((prev) => prev + 1);

      setTimeout(() => {
        setShowStar(false);
        setAnswerSlots([]);
        setScrambledLetters([]);
        setUsedWords((prev) => {
          const updated = [...prev, currentWord];
          return updated.length >= WORDS.length ? [] : updated;
        });
        const next = generateNewWord();
        setCurrentWord(next.word);
        setScrambledLetters(next.scrambled);
        setAnswerSlots(Array(next.word.length).fill(null));
      }, 1800);
    } else {
      if (gameSettings?.soundEnabled !== false && wrongSoundRef.current) wrongSoundRef.current();
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        // Reset slots and letters
        setScrambledLetters(shuffleLetters(currentWord.split('')));
        setAnswerSlots(Array(currentWord.length).fill(null));
      }, 900);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setCurrentWord(null);
    setScrambledLetters([]);
    setAnswerSlots([]);
    setScore(0);
    setRound(0);
    setShowStar(false);
    setIsShaking(false);
    setUsedWords([]);
  };

  return (
    <div className="balloon-arrange-game">
      <div className="balloon-arrange-container">
        <div className="balloon-arrange-header">
          <button className="back-button" onClick={onBack}>← Back</button>
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
            className="balloon-arrange-menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="game-title">🎈 Balloon Letter Arrange 🎈</h1>
            <p className="game-description">
              Tap the floating balloons to arrange the letters and spell the word!
            </p>
            <button className="start-game-btn" onClick={startGame}>
              Start Game
            </button>
          </motion.div>
        ) : (
          <div className="balloon-arrange-gameplay">
            <div className="floating-area">
              <StarAnimation show={showStar} />
              <div className="balloons-grid">
                {scrambledLetters.map((letter, idx) => (
                  <BalloonLetter
                    key={`${letter}-${idx}`}
                    letter={letter}
                    index={idx}
                    onClick={() => handleBalloonClick(letter, idx)}
                    floating
                  />
                ))}
              </div>
            </div>

            {currentWord && (
              <div className="answer-area">
                <motion.div
                  className={`answer-row ${isShaking ? 'shake' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {answerSlots.map((letter, idx) => (
                    <AnswerSlot
                      key={idx}
                      letter={letter}
                      index={idx}
                      onRemove={handleSlotRemove}
                    />
                  ))}
                </motion.div>
              </div>
            )}

            <div className="game-controls">
              <button className="reset-button" onClick={resetGame}>Reset Game</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalloonLetterArrange;


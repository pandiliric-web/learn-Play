import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameSettingsAPI } from '../../services/api';
import './PictureToSentence.css';

// ImageDisplay Component
const ImageDisplay = ({ image, isCorrect }) => {
  return (
    <motion.div
      className="image-display-container"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="image-display">{image}</div>
    </motion.div>
  );
};

// SentenceWithChoices Component
const SentenceWithChoices = ({ sentence, choices, onChoiceClick, selectedChoice, isCorrect, isWrong, disabled }) => {
  return (
    <div className="sentence-choices-container">
      <motion.div
        className="sentence-display"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="sentence-text">{sentence}</p>
      </motion.div>
      
      <div className="choices-container">
        {choices.map((choice, index) => (
          <motion.button
            key={`${choice}-${index}`}
            className={`choice-button ${
              selectedChoice === choice && isCorrect ? 'correct' : ''
            } ${
              selectedChoice === choice && isWrong ? 'wrong' : ''
            }`}
            onClick={() => onChoiceClick(choice)}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.05, y: -3 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            animate={
              selectedChoice === choice && isWrong
                ? {
                    x: [0, -10, 10, -10, 10, 0],
                    transition: { duration: 0.5 }
                  }
                : selectedChoice === choice && isCorrect
                ? {
                    scale: [1, 1.2, 1],
                    transition: { duration: 0.4 }
                  }
                : {}
            }
          >
            <span className="choice-text">{choice}</span>
            {selectedChoice === choice && isCorrect && (
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
        ))}
      </div>
    </div>
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

// Picture-to-Sentence pairs for Grade 1
const PICTURE_SENTENCES = [
  { image: '🏃', sentence: 'The boy is ___.', choices: ['running', 'sleeping', 'eating'], answer: 'running' },
  { image: '😴', sentence: 'The girl is ___.', choices: ['running', 'sleeping', 'jumping'], answer: 'sleeping' },
  { image: '🍎', sentence: 'The child is ___.', choices: ['eating', 'running', 'sleeping'], answer: 'eating' },
  { image: '🐱', sentence: 'The cat is ___.', choices: ['playing', 'flying', 'swimming'], answer: 'playing' },
  { image: '🐶', sentence: 'The dog is ___.', choices: ['barking', 'flying', 'reading'], answer: 'barking' },
  { image: '🐦', sentence: 'The bird is ___.', choices: ['flying', 'swimming', 'running'], answer: 'flying' },
  { image: '🐟', sentence: 'The fish is ___.', choices: ['swimming', 'flying', 'jumping'], answer: 'swimming' },
  { image: '🌳', sentence: 'The tree is ___.', choices: ['tall', 'small', 'fast'], answer: 'tall' },
  { image: '☀️', sentence: 'The sun is ___.', choices: ['bright', 'dark', 'cold'], answer: 'bright' },
  { image: '🌙', sentence: 'The moon is ___.', choices: ['shining', 'running', 'eating'], answer: 'shining' },
  { image: '📚', sentence: 'The book is ___.', choices: ['open', 'closed', 'running'], answer: 'open' },
  { image: '🚗', sentence: 'The car is ___.', choices: ['moving', 'sleeping', 'eating'], answer: 'moving' },
  { image: '🏠', sentence: 'The house is ___.', choices: ['big', 'small', 'fast'], answer: 'big' },
  { image: '🌸', sentence: 'The flower is ___.', choices: ['beautiful', 'ugly', 'fast'], answer: 'beautiful' },
  { image: '🍰', sentence: 'The cake is ___.', choices: ['sweet', 'sour', 'fast'], answer: 'sweet' },
  { image: '🎈', sentence: 'The balloon is ___.', choices: ['floating', 'sinking', 'running'], answer: 'floating' },
  { image: '⚽', sentence: 'The ball is ___.', choices: ['bouncing', 'flying', 'sleeping'], answer: 'bouncing' },
  { image: '🎵', sentence: 'The music is ___.', choices: ['loud', 'quiet', 'fast'], answer: 'loud' },
  { image: '🌧️', sentence: 'The rain is ___.', choices: ['falling', 'rising', 'sleeping'], answer: 'falling' },
  { image: '❄️', sentence: 'The snow is ___.', choices: ['cold', 'hot', 'fast'], answer: 'cold' }
];

const PictureToSentence = ({ onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showStar, setShowStar] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState([]);
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

  // Speak sentence using text-to-speech
  const speakSentence = useCallback((sentence, answer) => {
    if (gameSettings?.soundEnabled === false) return;
    
    try {
      if ('speechSynthesis' in window) {
        if (speechSynthesisRef.current) {
          window.speechSynthesis.cancel();
        }

        const fullSentence = sentence.replace('___', answer);
        const utterance = new SpeechSynthesisUtterance(fullSentence);
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
        const response = await gameSettingsAPI.getGameSettings('picture-to-sentence');
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

  // Generate a new question (avoiding repetitions)
  const generateNewQuestion = useCallback(() => {
    const availableQuestions = PICTURE_SENTENCES.filter(q => !usedQuestions.includes(q.sentence));
    const questionsToChooseFrom = availableQuestions.length > 0 ? availableQuestions : PICTURE_SENTENCES;
    
    const randomQuestion = questionsToChooseFrom[Math.floor(Math.random() * questionsToChooseFrom.length)];
    
    // Shuffle the choices
    const shuffledChoices = [...randomQuestion.choices].sort(() => Math.random() - 0.5);
    
    return {
      ...randomQuestion,
      choices: shuffledChoices
    };
  }, [usedQuestions]);

  // Start game
  const startGame = () => {
    if (gameSettings?.enabled === false) {
      alert('This game is currently disabled by the administrator.');
      return;
    }
    
    initAudio();
    setGameStarted(true);
    setUsedQuestions([]);
    const newQuestion = generateNewQuestion();
    setCurrentQuestion(newQuestion);
    setScore(0);
    setRound(0);
    setSelectedChoice(null);
    setShowStar(false);
    setDisabled(false);
  };

  // Handle choice click
  const handleChoiceClick = (choice) => {
    if (disabled || !currentQuestion) return;

    initAudio();
    setDisabled(true);
    setSelectedChoice(choice);

    if (choice === currentQuestion.answer) {
      // Correct answer
      if (gameSettings?.soundEnabled !== false && correctSoundRef.current) {
        correctSoundRef.current();
      }
      speakSentence(currentQuestion.sentence, currentQuestion.answer);
      setShowStar(true);
      
      const scorePoints = gameSettings?.scorePoints || 10;
      setScore(prev => prev + scorePoints);
      setRound(prev => prev + 1);

      setTimeout(() => {
        setShowStar(false);
        setSelectedChoice(null);
        setDisabled(false);
        
        // Track used question
        setUsedQuestions(prev => {
          const updated = [...prev, currentQuestion.sentence];
          return updated.length >= PICTURE_SENTENCES.length ? [] : updated;
        });
        
        // Generate new question
        const newQuestion = generateNewQuestion();
        setCurrentQuestion(newQuestion);
      }, 2000);
    } else {
      // Wrong answer
      if (gameSettings?.soundEnabled !== false && wrongSoundRef.current) {
        wrongSoundRef.current();
      }

      setTimeout(() => {
        setSelectedChoice(null);
        setDisabled(false);
      }, 1500);
    }
  };

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setCurrentQuestion(null);
    setScore(0);
    setRound(0);
    setSelectedChoice(null);
    setShowStar(false);
    setDisabled(false);
    setUsedQuestions([]);
  };

  return (
    <div className="picture-to-sentence-game">
      <div className="picture-to-sentence-container">
        {/* Header */}
        <div className="picture-to-sentence-header">
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
            className="picture-to-sentence-menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="game-title">🖼️ Picture to Sentence 🖼️</h1>
            <p className="game-description">
              Look at the picture and choose the word that completes the sentence!
            </p>
            <button className="start-game-btn" onClick={startGame}>
              Start Game
            </button>
          </motion.div>
        ) : (
          <div className="picture-to-sentence-gameplay">
            {/* Image Display */}
            {currentQuestion && (
              <motion.div
                key={currentQuestion.sentence}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ImageDisplay image={currentQuestion.image} />
              </motion.div>
            )}

            {/* Sentence with Choices */}
            {currentQuestion && (
              <div className="sentence-choices-wrapper">
                <StarAnimation show={showStar} />
                <SentenceWithChoices
                  sentence={currentQuestion.sentence}
                  choices={currentQuestion.choices}
                  onChoiceClick={handleChoiceClick}
                  selectedChoice={selectedChoice}
                  isCorrect={selectedChoice === currentQuestion.answer}
                  isWrong={selectedChoice !== null && selectedChoice !== currentQuestion.answer}
                  disabled={disabled}
                />
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

export default PictureToSentence;


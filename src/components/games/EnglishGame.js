import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeNotification from '../WelcomeNotification';
import ABCPop from './ABCPop';
import WordMatch from './WordMatch';
import SpellingPuzzle from './SpellingPuzzle';
import PictureToSentence from './PictureToSentence';
import BalloonLetterArrange from './BalloonLetterArrange';
import './EnglishGame.css';

const EnglishGame = () => {
  const [currentGame, setCurrentGame] = useState('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameData, setGameData] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [streak, setStreak] = useState(0);

  const games = [
    {
      id: 'abc-pop',
      name: 'ABC Pop',
      icon: '🎈',
      description: 'Pop the letter bubbles to match the target letter!',
      color: '#667eea'
    },
    {
      id: 'word-match',
      name: 'Word Match',
      icon: '🔤',
      description: 'Match the picture with the correct word!',
      color: '#f093fb'
    },
    {
      id: 'spelling-puzzle',
      name: 'Spelling Puzzle',
      icon: '🧩',
      description: 'Arrange the letters to spell the word!',
      color: '#4ECDC4'
    },
    {
      id: 'picture-to-sentence',
      name: 'Picture to Sentence',
      icon: '🖼️',
      description: 'Complete the sentence based on the picture!',
      color: '#FFA726'
    },
    {
      id: 'balloon-letter-arrange',
      name: 'Balloon Letter Arrange',
      icon: '🎈',
      description: 'Arrange floating balloons to spell the word!',
      color: '#0EA5E9'
    }
  ];

  const generateEnglishProblem = (gameType, currentLevel) => {
    let problem, answer, options;
    
    switch (gameType) {
      case 'vocabulary':
        const vocabWords = [
          { word: 'Magnificent', meaning: 'Very beautiful or impressive', options: ['Very beautiful or impressive', 'Very small', 'Very fast', 'Very old'] },
          { word: 'Curious', meaning: 'Eager to learn or know something', options: ['Eager to learn or know something', 'Very happy', 'Very sad', 'Very angry'] },
          { word: 'Brave', meaning: 'Ready to face danger or pain', options: ['Ready to face danger or pain', 'Very smart', 'Very kind', 'Very funny'] },
          { word: 'Generous', meaning: 'Willing to give or share', options: ['Willing to give or share', 'Very rich', 'Very poor', 'Very busy'] },
          { word: 'Patient', meaning: 'Able to wait without getting angry', options: ['Able to wait without getting angry', 'Very fast', 'Very slow', 'Very loud'] }
        ];
        const vocabItem = vocabWords[Math.floor(Math.random() * vocabWords.length)];
        problem = `What does "${vocabItem.word}" mean?`;
        answer = vocabItem.meaning;
        options = vocabItem.options;
        break;
      
      case 'grammar':
        const grammarQuestions = [
          {
            question: 'Which sentence is grammatically correct?',
            answer: 'She is reading a book.',
            options: ['She reading a book.', 'She is reading a book.', 'She reads a book.', 'She read a book.']
          },
          {
            question: 'Choose the correct plural form: "The child is playing."',
            answer: 'The children are playing.',
            options: ['The childs are playing.', 'The children are playing.', 'The child are playing.', 'The childs is playing.']
          },
          {
            question: 'Which word is a proper noun?',
            answer: 'London',
            options: ['city', 'London', 'country', 'river']
          },
          {
            question: 'Complete the sentence: "If it rains tomorrow, I ___ stay home."',
            answer: 'will',
            options: ['will', 'would', 'could', 'should']
          }
        ];
        const grammarItem = grammarQuestions[Math.floor(Math.random() * grammarQuestions.length)];
        problem = grammarItem.question;
        answer = grammarItem.answer;
        options = grammarItem.options;
        break;
      
      case 'reading':
        const readingPassages = [
          {
            passage: 'Tom loves to play soccer. Every afternoon after school, he goes to the park with his friends. They practice dribbling, passing, and shooting goals. Tom dreams of becoming a professional soccer player one day.',
            question: 'What does Tom want to be when he grows up?',
            answer: 'A professional soccer player',
            options: ['A teacher', 'A doctor', 'A professional soccer player', 'A chef']
          },
          {
            passage: 'The library is a quiet place where people can read books, study, and learn new things. It has many shelves filled with books about different subjects. Students often visit the library to do their homework and research projects.',
            question: 'Why do students visit the library?',
            answer: 'To do homework and research',
            options: ['To play games', 'To eat lunch', 'To do homework and research', 'To watch movies']
          }
        ];
        const readingItem = readingPassages[Math.floor(Math.random() * readingPassages.length)];
        problem = `${readingItem.passage}\n\nQuestion: ${readingItem.question}`;
        answer = readingItem.answer;
        options = readingItem.options;
        break;
      
      case 'spelling':
        const spellingWords = [
          { word: 'Beautiful', hint: 'Very pretty or attractive', options: ['Beautifull', 'Beautiful', 'Beautifull', 'Beautifull'] },
          { word: 'Happiness', hint: 'The feeling of being happy', options: ['Hapiness', 'Happiness', 'Happines', 'Happynes'] },
          { word: 'Important', hint: 'Having great value or meaning', options: ['Important', 'Importent', 'Importent', 'Importent'] },
          { word: 'Knowledge', hint: 'What you know or have learned', options: ['Knowlege', 'Knowledge', 'Knowlege', 'Knowlege'] },
          { word: 'Wonderful', hint: 'Very good or amazing', options: ['Wonderfull', 'Wonderful', 'Wonderfull', 'Wonderfull'] }
        ];
        const spellingItem = spellingWords[Math.floor(Math.random() * spellingWords.length)];
        problem = `Spell the word: ${spellingItem.hint}`;
        answer = spellingItem.word;
        options = spellingItem.options;
        break;
      
      default:
        return null;
    }

    return { problem, answer, options, type: gameType };
  };

  const startGame = (gameType) => {
    setCurrentGame(gameType);
    setScore(0);
    setLevel(1);
    setStreak(0);
    const newGameData = generateEnglishProblem(gameType, 1);
    setGameData(newGameData);
    setUserAnswer('');
    setFeedback('');
    setIsCorrect(null);
  };

  const checkAnswer = () => {
    if (userAnswer === '') return;
    
    const isAnswerCorrect = userAnswer === gameData.answer;
    setIsCorrect(isAnswerCorrect);
    
    if (isAnswerCorrect) {
      const newScore = score + 10 + (streak * 2);
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      setFeedback('Correct! Excellent work! 🎉');
      
      setTimeout(() => {
        if (newStreak % 5 === 0) {
          setLevel(level + 1);
        }
        const nextProblem = generateEnglishProblem(currentGame, level + 1);
        setGameData(nextProblem);
        setUserAnswer('');
        setFeedback('');
        setIsCorrect(null);
      }, 1500);
    } else {
      setStreak(0);
      setFeedback(`Incorrect. The correct answer is "${gameData.answer}". Keep trying! 💪`);
      
      setTimeout(() => {
        setFeedback('');
        setIsCorrect(null);
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  const resetGame = () => {
    setCurrentGame('menu');
    setScore(0);
    setLevel(1);
    setStreak(0);
    setGameData(null);
    setUserAnswer('');
    setFeedback('');
    setIsCorrect(null);
  };

  return (
    <div className="english-game-page">
      <WelcomeNotification
        pageId="english-game"
        title="Mga Dula sa English! 🇺🇸"
        message="Pag-abot sa English Games! Palambo ang inyong English skills pinaagi sa makapukaw nga mga interactive games. Magdula og ABC Pop, Word Match, Spelling Puzzle, Picture to Sentence, ug Balloon Letter Arrange. Kining mga dula makatabang kaninyo sa pagkat-on sa vocabulary, spelling, grammar, ug sentence construction samtang naglingaw!"
        icon="🇺🇸"
      />

      {currentGame === 'menu' ? (
        <>
          {/* Modern Hero Section */}
          <div className="english-game-hero-section">
            <div className="english-game-hero-background">
              <div className="hero-gradient-orb orb-1"></div>
              <div className="hero-gradient-orb orb-2"></div>
              <div className="hero-gradient-orb orb-3"></div>
            </div>
            <div className="english-game-hero-content">
              <motion.div 
                className="hero-text-wrapper"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Link to="/subjects" className="english-game-back-link">
                  ← Back to Subjects
                </Link>
                <motion.span 
                  className="start-pill-new"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  English Language Games
                </motion.span>
                <motion.h1 
                  className="hero-title-new"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Learn English Through <span className="highlight-new">Play</span>
                </motion.h1>
                <motion.p 
                  className="hero-subtitle-new"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  Master vocabulary, spelling, grammar, and sentence construction through 
                  fun and interactive games designed for all skill levels!
                </motion.p>
              </motion.div>
            </div>
          </div>

          {/* Games Grid Section */}
          <div className="english-games-section">
            <div className="english-games-container">
              <motion.div 
                className="english-games-grid-new"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {games.map((game, index) => (
                  <motion.div
                    key={game.id}
                    className="english-game-card-new"
                    style={{ '--game-color': game.color }}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => startGame(game.id)}
                  >
                    <div className="english-card-icon-wrapper">
                      <span className="english-card-icon-new">{game.icon}</span>
                    </div>
                    <div className="english-card-content-new">
                      <h3 className="english-card-title-new">{game.name}</h3>
                      <p className="english-card-description-new">{game.description}</p>
                    </div>
                    <div className="english-card-action-new">
                      <button 
                        className="english-play-btn-new"
                        style={{ background: `linear-gradient(135deg, ${game.color}, ${game.color}dd)` }}
                      >
                        Play Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </>
      ) : (
        <div className="english-game-container">
          {/* Header - Only show when not in ABC Pop game */}
          {currentGame !== 'abc-pop' && (
            <motion.div 
              className="english-game-header-new"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/subjects" className="english-back-btn-new">
                ← Back to Subjects
              </Link>
              <h1 className="english-game-title-new">English Language Games</h1>
              <div className="english-game-stats-new">
                <div className="english-stat-new">
                  <span className="english-stat-label-new">Score:</span>
                  <span className="english-stat-value-new">{score}</span>
                </div>
                <div className="english-stat-new">
                  <span className="english-stat-label-new">Level:</span>
                  <span className="english-stat-value-new">{level}</span>
                </div>
                <div className="english-stat-new">
                  <span className="english-stat-label-new">Streak:</span>
                  <span className="english-stat-value-new">{streak}</span>
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {currentGame === 'abc-pop' ? (
            <motion.div
              key="abc-pop"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <ABCPop onBack={resetGame} />
            </motion.div>
          ) : currentGame === 'word-match' ? (
            <motion.div
              key="word-match"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <WordMatch onBack={resetGame} />
            </motion.div>
          ) : currentGame === 'spelling-puzzle' ? (
            <motion.div
              key="spelling-puzzle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <SpellingPuzzle onBack={resetGame} />
            </motion.div>
          ) : currentGame === 'picture-to-sentence' ? (
            <motion.div
              key="picture-to-sentence"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <PictureToSentence onBack={resetGame} />
            </motion.div>
          ) : currentGame === 'balloon-letter-arrange' ? (
            <motion.div
              key="balloon-letter-arrange"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <BalloonLetterArrange onBack={resetGame} />
            </motion.div>
            ) : (
              <motion.div
                key="gameplay"
                className="gameplay-area"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <div className="game-info">
                  <h2>{games.find(g => g.id === currentGame)?.name}</h2>
                  <p>Level {level} - Score: {score}</p>
                </div>

                <div className="problem-container">
                  <div className="problem">
                    {gameData?.type === 'reading' ? (
                      <div className="reading-problem">
                        <p className="reading-passage">{gameData.problem.split('\n\n')[0]}</p>
                        <h3 className="reading-question">{gameData.problem.split('\n\n')[1]}</h3>
                      </div>
                    ) : (
                      <h3 className="english-problem">{gameData?.problem}</h3>
                    )}
                  </div>

                  <div className="answer-section">
                    <label htmlFor="answer">Your Answer:</label>
                    <select
                      id="answer"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className={`answer-select ${isCorrect === false ? 'incorrect' : ''}`}
                    >
                      <option value="">Select an answer</option>
                      {gameData?.options.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                    <button 
                      onClick={checkAnswer}
                      className="submit-btn"
                      disabled={userAnswer === ''}
                    >
                      Submit Answer
                    </button>
                  </div>

                  {feedback && (
                    <motion.div
                      className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {feedback}
                    </motion.div>
                  )}

                  <div className="game-controls">
                    <button onClick={resetGame} className="reset-btn">
                      Back to Menu
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default EnglishGame;

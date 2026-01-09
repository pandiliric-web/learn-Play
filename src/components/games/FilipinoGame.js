import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeNotification from '../WelcomeNotification';
import TamangSalita from './TamangSalita';
import TamaOMali from './TamaOMali';
import HanapinAngLarawan from './HanapinAngLarawan';
import BuoAngPangungusap from './BuoAngPangungusap';
import './FilipinoGame.css';

const FilipinoGame = () => {
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
      id: 'tamang-salita',
      name: 'Tamang Salita – Isulat ang Sagot',
      icon: '✍️',
      description: 'Isulat ang tamang salita para sa larawan!',
      color: '#667eea'
    },
    {
      id: 'tama-o-mali',
      name: 'Tama o Mali',
      icon: '✅',
      description: 'Tingnan kung tumugma ang larawan at salita!',
      color: '#00b894'
    },
    {
      id: 'hanapin-ang-larawan',
      name: 'Hanapin ang Larawan',
      icon: '🔍',
      description: 'Hanapin ang tamang larawan na tumugma sa salita!',
      color: '#f39c12'
    },
    {
      id: 'buo-ang-pangungusap',
      name: 'Buo ang Pangungusap',
      icon: '🧩',
      description: 'Piliin at ayusin ang mga salita upang makabuo ng tamang pangungusap!',
      color: '#9b59b6'
    }
  ];

  const generateFilipinoProblem = (gameType, currentLevel) => {
    let problem, answer, options;
    
    switch (gameType) {
      case 'vocabulary':
        const vocabWords = [
          { word: 'Bahay', meaning: 'House', options: ['House', 'Car', 'Tree', 'Book'] },
          { word: 'Aso', meaning: 'Dog', options: ['Cat', 'Dog', 'Bird', 'Fish'] },
          { word: 'Puno', meaning: 'Tree', options: ['Flower', 'Grass', 'Tree', 'Rock'] },
          { word: 'Libro', meaning: 'Book', options: ['Book', 'Pen', 'Paper', 'Bag'] },
          { word: 'Kotse', meaning: 'Car', options: ['Bike', 'Bus', 'Car', 'Train'] },
          { word: 'Ibon', meaning: 'Bird', options: ['Fish', 'Bird', 'Butterfly', 'Bee'] },
          { word: 'Bulaklak', meaning: 'Flower', options: ['Leaf', 'Flower', 'Stem', 'Root'] },
          { word: 'Tubig', meaning: 'Water', options: ['Fire', 'Water', 'Air', 'Earth'] }
        ];
        const vocabItem = vocabWords[Math.floor(Math.random() * vocabWords.length)];
        problem = `What does "${vocabItem.word}" mean in English?`;
        answer = vocabItem.meaning;
        options = vocabItem.options;
        break;
      
      case 'grammar':
        const grammarQuestions = [
          {
            question: 'Which is the correct Filipino greeting for "Good Morning"?',
            answer: 'Magandang umaga',
            options: ['Magandang umaga', 'Magandang hapon', 'Magandang gabi', 'Magandang tanghali']
          },
          {
            question: 'What is the Filipino word for "Thank you"?',
            answer: 'Salamat',
            options: ['Salamat', 'Walang anuman', 'Pakisuyo', 'Paki']
          },
          {
            question: 'How do you say "How are you?" in Filipino?',
            answer: 'Kumusta ka?',
            options: ['Ano ang pangalan mo?', 'Kumusta ka?', 'Saan ka pupunta?', 'Anong oras na?']
          },
          {
            question: 'What does "Mahal kita" mean?',
            answer: 'I love you',
            options: ['I like you', 'I love you', 'I miss you', 'I need you']
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
            passage: 'Si Maria ay isang magandang batang babae. Mahilig siyang magbasa ng libro at magsulat ng kuwento. Tuwing umaga, naglalakad siya papunta sa paaralan kasama ang kanyang mga kaibigan.',
            question: 'Ano ang ginagawa ni Maria tuwing umaga?',
            answer: 'Naglalakad papunta sa paaralan',
            options: ['Naglalakad papunta sa paaralan', 'Nagtutulog', 'Kumakain', 'Naglalaro']
          },
          {
            passage: 'Ang Pilipinas ay isang magandang bansa sa Timog-Silangang Asya. Mayaman ito sa likas na yaman at may magagandang tanawin. Ang mga Pilipino ay kilala sa kanilang pagiging masayahin at mabait.',
            question: 'Saan matatagpuan ang Pilipinas?',
            answer: 'Timog-Silangang Asya',
            options: ['Hilagang Amerika', 'Europa', 'Timog-Silangang Asya', 'Aprika']
          }
        ];
        const readingItem = readingPassages[Math.floor(Math.random() * readingPassages.length)];
        problem = `${readingItem.passage}\n\nQuestion: ${readingItem.question}`;
        answer = readingItem.answer;
        options = readingItem.options;
        break;
      
      case 'culture':
        const cultureQuestions = [
          {
            question: 'What is the national flower of the Philippines?',
            answer: 'Sampaguita',
            options: ['Rose', 'Sampaguita', 'Orchid', 'Sunflower']
          },
          {
            question: 'What traditional Filipino dance involves balancing bamboo poles?',
            answer: 'Tinikling',
            options: ['Cariñosa', 'Tinikling', 'Pandanggo', 'Kuratsa']
          },
          {
            question: 'What is the national animal of the Philippines?',
            answer: 'Carabao',
            options: ['Eagle', 'Carabao', 'Tiger', 'Lion']
          },
          {
            question: 'What Filipino festival is known for its colorful costumes and street dancing?',
            answer: 'Sinulog',
            options: ['Pahiyas', 'Sinulog', 'Ati-Atihan', 'Dinagyang']
          }
        ];
        const cultureItem = cultureQuestions[Math.floor(Math.random() * cultureQuestions.length)];
        problem = cultureItem.question;
        answer = cultureItem.answer;
        options = cultureItem.options;
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
    const newGameData = generateFilipinoProblem(gameType, 1);
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
      setFeedback('Tama! Magaling! 🎉');
      
      setTimeout(() => {
        if (newStreak % 5 === 0) {
          setLevel(level + 1);
        }
        const nextProblem = generateFilipinoProblem(currentGame, level + 1);
        setGameData(nextProblem);
        setUserAnswer('');
        setFeedback('');
        setIsCorrect(null);
      }, 1500);
    } else {
      setStreak(0);
      setFeedback(`Mali. Ang tamang sagot ay "${gameData.answer}". Subukan ulit! 💪`);
      
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
    <div className="filipino-game-page">
      <WelcomeNotification
        pageId="filipino-game"
        title="Mga Dula sa Filipino! 🇵🇭"
        message="Pag-abot sa Filipino Games! Praktisa ang inyong Filipino language skills pinaagi sa makalingaw nga mga interactive games. Pilia gikan sa mga dula sama sa Tamang Salita, Tama o Mali, Hanapin ang Larawan, ug Buo ang Pangungusap. Ang matag dula makatabang kaninyo sa pagkat-on sa mga pulong, pangungusap, ug grammar sa Filipino sa makalingaw nga paagi!"
        icon="🇵🇭"
      />

      {currentGame === 'menu' ? (
        <>
          {/* Modern Hero Section */}
          <div className="filipino-game-hero-section">
            <div className="filipino-game-hero-background">
              <div className="hero-gradient-orb orb-1"></div>
              <div className="hero-gradient-orb orb-2"></div>
              <div className="hero-gradient-orb orb-3"></div>
            </div>
            <div className="filipino-game-hero-content">
              <motion.div 
                className="hero-text-wrapper"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Link to="/subjects" className="filipino-game-back-link">
                  ← Back to Subjects
                </Link>
                <motion.span 
                  className="start-pill-new"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  Filipino Language Games
                </motion.span>
                <motion.h1 
                  className="hero-title-new"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Matuto ng Filipino sa <span className="highlight-new">Makulay</span>
                </motion.h1>
                <motion.p 
                  className="hero-subtitle-new"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  Palakasin ang iyong Filipino language skills sa pamamagitan ng masaya at interactive na mga laro. 
                  Matuto ng mga salita, pangungusap, at grammar habang naglalaro!
                </motion.p>
              </motion.div>
            </div>
          </div>

          {/* Games Grid Section */}
          <div className="filipino-games-section">
            <div className="filipino-games-container">
              <motion.div 
                className="filipino-games-grid-new"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {games.map((game, index) => (
                  <motion.div
                    key={game.id}
                    className="filipino-game-card-new"
                    style={{ '--game-color': game.color }}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => startGame(game.id)}
                  >
                    <div className="filipino-card-icon-wrapper">
                      <span className="filipino-card-icon-new">{game.icon}</span>
                    </div>
                    <div className="filipino-card-content-new">
                      <h3 className="filipino-card-title-new">{game.name}</h3>
                      <p className="filipino-card-description-new">{game.description}</p>
                    </div>
                    <div className="filipino-card-action-new">
                      <button 
                        className="filipino-play-btn-new"
                        style={{ background: `linear-gradient(135deg, ${game.color}, ${game.color}dd)` }}
                      >
                        Laruin Ngayon
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </>
      ) : (
        <div className="filipino-game-container">
          {/* Header - Only show when not in specific games */}
          {currentGame !== 'tamang-salita' && currentGame !== 'tama-o-mali' && currentGame !== 'hanapin-ang-larawan' && currentGame !== 'buo-ang-pangungusap' && (
            <motion.div 
              className="filipino-game-header-new"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/subjects" className="filipino-back-btn-new">
                ← Back to Subjects
              </Link>
              <h1 className="filipino-game-title-new">Filipino Language Games</h1>
              <div className="filipino-game-stats-new">
                <div className="filipino-stat-new">
                  <span className="filipino-stat-label-new">Score:</span>
                  <span className="filipino-stat-value-new">{score}</span>
                </div>
                <div className="filipino-stat-new">
                  <span className="filipino-stat-label-new">Level:</span>
                  <span className="filipino-stat-value-new">{level}</span>
                </div>
                <div className="filipino-stat-new">
                  <span className="filipino-stat-label-new">Streak:</span>
                  <span className="filipino-stat-value-new">{streak}</span>
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {currentGame === 'tamang-salita' ? (
              <TamangSalita onBack={() => setCurrentGame('menu')} />
            ) : currentGame === 'tama-o-mali' ? (
              <TamaOMali onBack={() => setCurrentGame('menu')} />
            ) : currentGame === 'hanapin-ang-larawan' ? (
              <HanapinAngLarawan onBack={() => setCurrentGame('menu')} />
            ) : currentGame === 'buo-ang-pangungusap' ? (
              <BuoAngPangungusap onBack={() => setCurrentGame('menu')} />
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
                    <h3 className="filipino-problem">{gameData?.problem}</h3>
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

export default FilipinoGame;

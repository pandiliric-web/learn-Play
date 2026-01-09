// Central registry of all games across all subjects
// 
// HOW TO ADD A NEW GAME:
// 1. Create your game component (e.g., MyNewGame.js)
// 2. Add it to the appropriate subject's game component (e.g., EnglishGame.js, MathGame.js)
// 3. Add the game definition here with its settings schema
// 4. The game will automatically appear in Admin Dashboard > Game Settings for customization
//
// Settings Schema Structure:
// - general: Settings that apply to all difficulty levels
// - easy/medium/hard: Difficulty-specific settings (optional)
// Field types: 'boolean', 'number', 'select'
// Each field needs: type, default, and optionally min/max (for numbers) or options (for select)

export const GAME_REGISTRY = {
  // English Games
  'abc-pop': {
    id: 'abc-pop',
    name: 'ABC Pop',
    icon: '🎈',
    subject: 'English',
    description: 'Pop the letter bubbles to match the target letter!',
    settingsSchema: {
      easy: {
        bubbleCount: { type: 'number', min: 6, max: 20, default: 12 },
        targetInstances: { type: 'number', min: 1, max: 5, default: 3 },
        animationSpeedMin: { type: 'number', min: 1, max: 10, default: 4 },
        animationSpeedMax: { type: 'number', min: 1, max: 10, default: 6 },
        scorePoints: { type: 'number', min: 1, max: 100, default: 10 }
      },
      medium: {
        bubbleCount: { type: 'number', min: 6, max: 20, default: 12 },
        targetInstances: { type: 'number', min: 1, max: 5, default: 2 },
        animationSpeedMin: { type: 'number', min: 1, max: 10, default: 2 },
        animationSpeedMax: { type: 'number', min: 1, max: 10, default: 3.5 },
        scorePoints: { type: 'number', min: 1, max: 100, default: 15 }
      },
      hard: {
        bubbleCount: { type: 'number', min: 4, max: 10, default: 6 },
        targetInstances: { type: 'number', min: 1, max: 2, default: 1 },
        animationSpeedMin: { type: 'number', min: 0.5, max: 5, default: 1.5 },
        animationSpeedMax: { type: 'number', min: 0.5, max: 5, default: 2.5 },
        scorePoints: { type: 'number', min: 1, max: 100, default: 20 }
      },
      general: {
        enabled: { type: 'boolean', default: true },
        soundEnabled: { type: 'boolean', default: true },
        showRoundCounter: { type: 'boolean', default: true },
        showScore: { type: 'boolean', default: true },
        letterRange: { type: 'select', options: ['A-F', 'A-M', 'A-Z'], default: 'A-Z' }
      }
    }
  },
  'word-match': {
    id: 'word-match',
    name: 'Word Match',
    icon: '🔤',
    subject: 'English',
    description: 'Match the picture with the correct word!',
    settingsSchema: {
      general: {
        enabled: { type: 'boolean', default: true },
        soundEnabled: { type: 'boolean', default: true },
        showRoundCounter: { type: 'boolean', default: true },
        showScore: { type: 'boolean', default: true },
        scorePoints: { type: 'number', min: 1, max: 100, default: 10 },
        questionCount: { type: 'number', min: 10, max: 50, default: 20 }
      }
    }
  },
  'spelling-puzzle': {
    id: 'spelling-puzzle',
    name: 'Spelling Puzzle',
    icon: '🧩',
    subject: 'English',
    description: 'Arrange the letters to spell the word!',
    settingsSchema: {
      general: {
        enabled: { type: 'boolean', default: true },
        soundEnabled: { type: 'boolean', default: true },
        showRoundCounter: { type: 'boolean', default: true },
        showScore: { type: 'boolean', default: true },
        scorePoints: { type: 'number', min: 1, max: 100, default: 10 },
        wordCount: { type: 'number', min: 10, max: 50, default: 20 }
      }
    }
  },
  'picture-to-sentence': {
    id: 'picture-to-sentence',
    name: 'Picture to Sentence',
    icon: '🖼️',
    subject: 'English',
    description: 'Complete the sentence based on the picture!',
    settingsSchema: {
      general: {
        enabled: { type: 'boolean', default: true },
        soundEnabled: { type: 'boolean', default: true },
        showRoundCounter: { type: 'boolean', default: true },
        showScore: { type: 'boolean', default: true },
        scorePoints: { type: 'number', min: 1, max: 100, default: 10 },
        questionCount: { type: 'number', min: 10, max: 50, default: 20 }
      }
    }
  },
  'balloon-letter-arrange': {
    id: 'balloon-letter-arrange',
    name: 'Balloon Letter Arrange',
    icon: '🎈',
    subject: 'English',
    description: 'Arrange floating balloons to spell the word!',
    settingsSchema: {
      general: {
        enabled: { type: 'boolean', default: true },
        soundEnabled: { type: 'boolean', default: true },
        showRoundCounter: { type: 'boolean', default: true },
        showScore: { type: 'boolean', default: true },
        scorePoints: { type: 'number', min: 1, max: 100, default: 10 },
        wordCount: { type: 'number', min: 10, max: 50, default: 20 }
      }
    }
  },
  // Filipino Games
  'tamang-salita': {
    id: 'tamang-salita',
    name: 'Tamang Salita – Isulat ang Sagot',
    icon: '✍️',
    subject: 'Filipino',
    description: 'Isulat ang tamang salita para sa larawan!',
    settingsSchema: {
      general: {
        enabled: { type: 'boolean', default: true },
        soundEnabled: { type: 'boolean', default: true },
        showRoundCounter: { type: 'boolean', default: true },
        showScore: { type: 'boolean', default: true },
        scorePoints: { type: 'number', min: 1, max: 100, default: 10 },
        questionCount: { type: 'number', min: 10, max: 50, default: 20 }
      }
    }
  },
  'tama-o-mali': {
    id: 'tama-o-mali',
    name: 'Tama o Mali',
    icon: '✅',
    subject: 'Filipino',
    description: 'Tingnan kung tumugma ang larawan at salita!',
    settingsSchema: {
      general: {
        enabled: { type: 'boolean', default: true },
        soundEnabled: { type: 'boolean', default: true },
        showRoundCounter: { type: 'boolean', default: true },
        showScore: { type: 'boolean', default: true },
        scorePoints: { type: 'number', min: 1, max: 100, default: 10 },
        questionCount: { type: 'number', min: 10, max: 50, default: 30 }
      }
    }
  },
  'hanapin-ang-larawan': {
    id: 'hanapin-ang-larawan',
    name: 'Hanapin ang Larawan',
    icon: '🔍',
    subject: 'Filipino',
    description: 'Hanapin ang tamang larawan na tumugma sa salita!',
    settingsSchema: {
      general: {
        enabled: { type: 'boolean', default: true },
        soundEnabled: { type: 'boolean', default: true },
        showRoundCounter: { type: 'boolean', default: true },
        showScore: { type: 'boolean', default: true },
        scorePoints: { type: 'number', min: 1, max: 100, default: 10 },
        questionCount: { type: 'number', min: 10, max: 50, default: 30 }
      }
    }
  },
  // Mathematics Games
  'shape-builder': {
    id: 'shape-builder',
    name: 'Shape Builder Lab',
    icon: '🧩',
    subject: 'Mathematics',
    description: 'Spin the shape wheel, match glowing outlines, and learn fun geometry facts.',
    settingsSchema: {
      general: {
        enabled: { type: 'boolean', default: true },
        soundEnabled: { type: 'boolean', default: true },
        showRoundCounter: { type: 'boolean', default: true },
        showScore: { type: 'boolean', default: true },
        scorePoints: { type: 'number', min: 1, max: 100, default: 10 },
        puzzleCount: { type: 'number', min: 3, max: 10, default: 5 }
      },
      easy: {
        timeLimit: { type: 'number', min: 30, max: 120, default: 60 },
        hintEnabled: { type: 'boolean', default: true }
      },
      medium: {
        timeLimit: { type: 'number', min: 20, max: 90, default: 45 },
        hintEnabled: { type: 'boolean', default: false }
      },
      hard: {
        timeLimit: { type: 'number', min: 15, max: 60, default: 30 },
        hintEnabled: { type: 'boolean', default: false }
      }
    }
  }
  // Add more games here as they are created
};

// Get all games for a specific subject
export const getGamesBySubject = (subject) => {
  return Object.values(GAME_REGISTRY).filter(game => game.subject === subject);
};

// Get all games
export const getAllGames = () => {
  return Object.values(GAME_REGISTRY);
};

// Get game by ID
export const getGameById = (gameId) => {
  return GAME_REGISTRY[gameId];
};


import mongoose from 'mongoose';

const gameSettingsSchema = new mongoose.Schema({
  gameName: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  }, // e.g., 'abc-pop'
  
  // Easy Mode Settings
  easy: {
    bubbleCount: { type: Number, default: 12, min: 6, max: 20 },
    targetInstances: { type: Number, default: 3, min: 1, max: 5 },
    animationSpeedMin: { type: Number, default: 4, min: 1, max: 10 },
    animationSpeedMax: { type: Number, default: 6, min: 1, max: 10 },
    scorePoints: { type: Number, default: 10, min: 1, max: 100 }
  },
  
  // Medium Mode Settings
  medium: {
    bubbleCount: { type: Number, default: 12, min: 6, max: 20 },
    targetInstances: { type: Number, default: 2, min: 1, max: 5 },
    animationSpeedMin: { type: Number, default: 2, min: 1, max: 10 },
    animationSpeedMax: { type: Number, default: 3.5, min: 1, max: 10 },
    scorePoints: { type: Number, default: 15, min: 1, max: 100 }
  },
  
  // Hard Mode Settings
  hard: {
    bubbleCount: { type: Number, default: 6, min: 4, max: 10 },
    targetInstances: { type: Number, default: 1, min: 1, max: 2 },
    animationSpeedMin: { type: Number, default: 1.5, min: 0.5, max: 5 },
    animationSpeedMax: { type: Number, default: 2.5, min: 0.5, max: 5 },
    scorePoints: { type: Number, default: 20, min: 1, max: 100 }
  },
  
  // General Settings (flexible schema for different game types)
  enabled: { type: Boolean, default: true },
  soundEnabled: { type: Boolean, default: true },
  showRoundCounter: { type: Boolean, default: true },
  showScore: { type: Boolean, default: true },
  scorePoints: { type: Number, default: 10, min: 1, max: 100 },
  questionCount: { type: Number, default: 20, min: 10, max: 50 },
  
  // Letter Range Settings (for ABC Pop)
  letterRange: {
    type: String,
    enum: ['A-F', 'A-M', 'A-Z'],
    default: 'A-Z'
  },
  
  // Flexible settings storage for game-specific options
  customSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Customization metadata
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Index for efficient queries
gameSettingsSchema.index({ gameName: 1 });

const GameSettings = mongoose.model('GameSettings', gameSettingsSchema);
export default GameSettings;


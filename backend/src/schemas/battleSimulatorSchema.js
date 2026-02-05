const mongoose = require('mongoose');

// 招式结构
const moveSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  effect: { type: String, required: true },
  restriction: { type: String, required: true },
  isDynamic: { type: Boolean, default: false },
  addedAtTurn: { type: Number },
  turns_remaining: { type: Number }
}, { _id: false });

// 战斗回合记录
const battleTurnSchema = new mongoose.Schema({
  userMoveName: { type: String, required: true },
  ai: { type: String, required: true },
  result: { type: String, required: true },
  novelText: { type: String, required: true },
  bestSolution: { type: String },
  worstSolution: { type: String },
  damageToAI: { type: Number, default: 0 },
  damageToUser: { type: Number, default: 0 },
  userHealthAfter: { type: Number, required: true },
  aiHealthAfter: { type: Number, required: true }
}, { _id: false });

// 角色配置
const characterProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: { type: String, required: true },
  personality: { type: String },
  magicStyle: { type: String },
  imageUrl: { type: String },
  moves: [moveSchema]
}, { _id: false });

// 战斗会话
const battleSessionSchema = new mongoose.Schema({
  enemyId: {
    type: String,
    required: true,
    index: true
  },
  enemyProfile: {
    type: characterProfileSchema,
    required: true
  },
  userProfile: {
    type: characterProfileSchema,
    required: true
  },
  battleHistory: [battleTurnSchema],
  userHealth: {
    type: Number,
    required: true,
    default: 5
  },
  aiHealth: {
    type: Number,
    required: true,
    default: 5
  },
  activeMoves: [moveSchema],
  disabledMoves: {
    type: Map,
    of: {
      disabledUntilTurn: Number,
      reason: String
    },
    default: {}
  },
  isBattleEnd: {
    type: Boolean,
    default: false
  },
  battleWinner: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
battleSessionSchema.index({ enemyId: 1, createdAt: -1 });

const BattleSession = mongoose.model('BattleSession', battleSessionSchema);

module.exports = { BattleSession };





























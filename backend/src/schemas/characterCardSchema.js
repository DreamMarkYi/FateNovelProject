const mongoose = require('mongoose');

// 角色卡片 Schema
const characterCardSchema = new mongoose.Schema({
  // 基础信息
  season: {
    type: String,
    required: true,
    trim: true
  },
  number: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  
  // 图片资源
  backgroundImage: {
    type: String,
    required: true,
    trim: true
  },
  hoverGradient: {
    type: String,
    required: true,
    trim: true
  },
  commandImage: {
    type: String,
    default: '/storyImage/command1.png',
    trim: true
  },
  overlayColor: {
    type: String,
    default: 'rgba(100, 150, 200, 0.3)',
    trim: true
  },
  overlayDarkColor: {
    type: String,
    default: 'rgba(50, 80, 120, 0.3)',
    trim: true
  },
  overlayBackgroundImage: {
    type: String,
    default: '/storyImage/harukaBG.png',
    trim: true
  },
  
  // 装饰类型
  decorationType: {
    type: String,
    enum: ['type1', 'type2'],
    default: 'type1'
  },
  
  // 解锁状态
  unlocked: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // 排序索引
  index: {
    type: Number,
    default: 0,
    index: true
  },
  
  // 详细数据
  intro: {
    type: String,
    default: '',
    trim: true
  },
  stats: {
    Strength: { type: Number, default: 0 },
    Endurance: { type: Number, default: 0 },
    Agility: { type: Number, default: 0 },
    Mana: { type: Number, default: 0 }
  },
  skills: [{
    name: { type: String, required: true, trim: true },
    desc: { type: String, required: true, trim: true }
  }],
  
  // 元数据
  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  collection: 'characterCards'
});

// 索引
characterCardSchema.index({ index: 1 });
characterCardSchema.index({ unlocked: 1, index: 1 });
characterCardSchema.index({ season: 1, number: 1 });

module.exports = mongoose.model('CharacterCard', characterCardSchema);




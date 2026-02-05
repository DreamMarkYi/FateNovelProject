const mongoose = require('mongoose');

// DoodleStory 涂鸦故事 Schema
const doodleStorySchema = new mongoose.Schema({
  dateMark: {
    type: String,
    required: true,
    trim: true,
    comment: '日期标记（如：上课无聊画的、不开心等）'
  },
  date: {
    type: String,
    required: true,
    trim: true,
    comment: '日期显示（如：2016年10月21日）'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    comment: '故事标题'
  },
  content: {
    type: [String],
    required: true,
    comment: '故事内容段落数组'
  },
  signature: {
    type: String,
    required: true,
    trim: true,
    default: '遥',
    comment: '签名'
  },
  image: {
    type: String,
    required: true,
    trim: true,
    comment: '图片URL'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
    comment: '是否激活显示'
  },
  displayOrder: {
    type: Number,
    default: 0,
    comment: '显示顺序'
  },
  metadata: {
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  collection: 'doodle_stories'
});

// 索引
doodleStorySchema.index({ isActive: 1, displayOrder: 1 });
doodleStorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('DoodleStory', doodleStorySchema);































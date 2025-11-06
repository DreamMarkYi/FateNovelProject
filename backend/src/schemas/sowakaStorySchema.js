const mongoose = require('mongoose');

// Sowaka故事内容Schema
const sowakaStorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'そわかの物語'
  },
  subtitle: {
    type: String,
    required: true,
    trim: true,
    default: 'STORY OF SOWAKA'
  },
  storyImageLeft: {
    type: String,
    trim: true,
    default: '' // 图片URL或路径
  },
  storyTextRight: [{
    type: String,
    trim: true
  }],
  authorSignature: {
    type: String,
    trim: true,
    default: '— SOWAKA KYOTO'
  },
    prefaceContext: {
      type : String,
        trim: true,
        default: ''
    },
  chapterName: {
    type: String,
    trim: true,
    default: '第一章'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  metadata: {
    language: { type: String, default: 'ja' },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  collection: 'sowaka_stories'
});

// 索引
sowakaStorySchema.index({ isActive: 1, displayOrder: 1 });
sowakaStorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('SowakaStory', sowakaStorySchema);


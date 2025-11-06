const mongoose = require('mongoose');

// 故事章节Schema（用于SowakaPage的故事展示）
const storySectionSchema = new mongoose.Schema({
  headerTitle: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    required: true,
    trim: true
  },
  paragraphs: [{
    type: String,
    trim: true
  }],
  authorSignature: {
    type: String,
    default: '— SOWAKA KYOTO',
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  displayOrder: {
    type: Number,
    default: 0,
    index: true
  }
}, {
  timestamps: true,
  collection: 'story_sections'
});

// 索引
storySectionSchema.index({ displayOrder: 1, createdAt: -1 });

module.exports = mongoose.model('StorySection', storySectionSchema);


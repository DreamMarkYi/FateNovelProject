const mongoose = require('mongoose');

// 小说Schema
const novelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  author: {
    type: String,
    required: true,
    trim: true,
    default: '匿名'
  },
  description: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['fantasy', 'romance', 'scifi', 'mystery', 'adventure', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'paused'],
    default: 'ongoing'
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  totalChapters: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  metadata: {
    wordCount: { type: Number, default: 0 },
    language: { type: String, default: 'ja' },
    publishedDate: { type: Date }
  }
}, {
  timestamps: true,
  collection: 'novels'
});

// 索引
novelSchema.index({ title: 'text', description: 'text' });
novelSchema.index({ createdAt: -1 });
novelSchema.index({ views: -1 });
novelSchema.index({ likes: -1 });

module.exports = mongoose.model('Novel', novelSchema);


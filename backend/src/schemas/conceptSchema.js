const mongoose = require('mongoose');

// 概念卡片Schema
const conceptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  htmlContent: {
    type: String
  },
  category: {
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
  collection: 'concepts'
});

// 索引
conceptSchema.index({ displayOrder: 1, createdAt: -1 });

module.exports = mongoose.model('Concept', conceptSchema);


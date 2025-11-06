const mongoose = require('mongoose');

// 房间Schema
const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: [{
    type: String,
    trim: true
  }],
  details: [{
    type: String,
    trim: true
  }],
  date: {
    type: String,
    trim: true
  },
  htmlContent: {
    type: String
  },
  images: [{
    url: String,
    caption: String
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  pricing: {
    basePrice: Number,
    currency: { type: String, default: 'JPY' }
  },
  capacity: {
    type: Number,
    default: 2
  },
  isAvailable: {
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
  collection: 'rooms'
});

// 索引
roomSchema.index({ name: 'text', title: 'text', description: 'text' });
roomSchema.index({ displayOrder: 1, createdAt: -1 });

module.exports = mongoose.model('Room', roomSchema);


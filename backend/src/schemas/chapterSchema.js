const mongoose = require('mongoose');

// 章节Schema
const chapterSchema = new mongoose.Schema({
  novelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Novel',
    required: true,
    index: true
  },
  chapterNumber: {
    type: Number,
    required: true,
    min: 1
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  wordCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date
  },
  // 支持富文本格式
  contentFormat: {
    type: String,
    enum: ['markdown', 'html', 'plain'],
    default: 'plain'
  },
  // 前一章和后一章的引用
  previousChapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  },
  nextChapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }
}, {
  timestamps: true,
  collection: 'chapters'
});

// 复合索引：确保同一小说中章节号唯一
chapterSchema.index({ novelId: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.index({ createdAt: -1 });

// 虚拟属性：格式化的章节标题
chapterSchema.virtual('fullTitle').get(function() {
  return `第${this.chapterNumber}章 ${this.title}`;
});

module.exports = mongoose.model('Chapter', chapterSchema);


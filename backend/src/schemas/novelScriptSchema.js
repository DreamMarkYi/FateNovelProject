const mongoose = require('mongoose');

// Galgame剧情脚本Schema
const novelScriptSchema = new mongoose.Schema({
  // 剧本ID，用于标识不同的剧本/章节
  scriptId: {
    type: String,
    required: true,
    trim: true,
    index: true,
    default: 'main'
  },
  // 剧本名称
  scriptName: {
    type: String,
    required: true,
    trim: true,
    default: '主线剧情'
  },
  // 剧本描述
  description: {
    type: String,
    trim: true
  },
  // 场景列表
  scenes: [{
    // 场景序号（用于跳转和存档）
    index: {
      type: Number,
      required: true
    },
    // 场景类型：title(标题页) / text(对话) / choice(选择分支)
    type: {
      type: String,
      required: true,
      enum: ['title', 'text', 'choice'],
      default: 'text'
    },
    // === 标题页专用字段 ===
    title: {
      type: String,
      trim: true
    },
    subtitle: {
      type: String,
      trim: true
    },
    // === 对话场景专用字段 ===
    speaker: {
      type: String,
      trim: true
    },
    text: {
      type: String,
      trim: true
    },
    // === 选择分支专用字段 ===
    choices: [{
      text: String,        // 选项文本
      jumpTo: Number,      // 跳转到的场景索引
      condition: String    // 条件（可选，用于高级功能）
    }],
    // === 通用字段 ===
    bgImage: {
      type: String,
      trim: true
    },
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    },
    // 左侧角色立绘
    characterImageLeft: {
      type: String,
      trim: true
    },
    // 右侧角色立绘
    characterImageRight: {
      type: String,
      trim: true
    },
    // 背景音乐
    bgm: {
      type: String,
      trim: true
    },
    // 音效
    soundEffect: {
      type: String,
      trim: true
    },
    // 特殊效果标记
    effects: [{
      type: {
        type: String,
        enum: ['fade', 'shake', 'flash', 'custom']
      },
      params: mongoose.Schema.Types.Mixed
    }],
    // 场景标签（用于快速跳转）
    tags: [String],
    // 场景备注（仅开发使用）
    note: String
  }],
  // 剧本激活状态
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // 显示顺序
  displayOrder: {
    type: Number,
    default: 0,
    index: true
  },
  // 元数据
  metadata: {
    author: { type: String, default: 'System' },
    version: { type: String, default: '1.0.0' },
    language: { type: String, default: 'zh-CN' },
    totalScenes: { type: Number, default: 0 },
    estimatedPlayTime: { type: Number, default: 0 }, // 预计游玩时长（分钟）
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  collection: 'novel_scripts'
});

// 索引优化
novelScriptSchema.index({ scriptId: 1, isActive: 1 });
novelScriptSchema.index({ 'scenes.index': 1 });
novelScriptSchema.index({ displayOrder: 1, createdAt: -1 });

// 保存前自动更新场景总数
novelScriptSchema.pre('save', function(next) {
  if (this.scenes && this.scenes.length > 0) {
    this.metadata.totalScenes = this.scenes.length;
  }
  this.metadata.lastUpdated = new Date();
  next();
});

// 实例方法：根据索引获取场景
novelScriptSchema.methods.getSceneByIndex = function(index) {
  return this.scenes.find(scene => scene.index === index);
};

// 实例方法：根据标签获取场景
novelScriptSchema.methods.getScenesByTag = function(tag) {
  return this.scenes.filter(scene => scene.tags && scene.tags.includes(tag));
};

module.exports = mongoose.model('NovelScript', novelScriptSchema);

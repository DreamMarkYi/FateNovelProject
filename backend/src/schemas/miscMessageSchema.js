const mongoose = require('mongoose');

// 杂项消息Schema（用于终端页面右侧消息显示）
const miscMessageSchema = new mongoose.Schema({
  // 日期时间
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  // 发信人
  sender: {
    type: String,
    required: true,
    trim: true,
    default: 'UNKNOWN'
  },
  // 消息类型（如：SMS, PHONE, QQ, EMAIL, SYSTEM, NETWORK等）
  messageType: {
    type: String,
    required: true,
    trim: true,
    enum: ['SMS', 'PHONE', 'QQ', 'EMAIL', 'SYSTEM', 'NETWORK', 'ADMIN', 'USER', 'OTHER'],
    default: 'SMS',
    index: true
  },
  // 发送还是收到：'sent' = 发送, 'received' = 收到
  direction: {
    type: String,
    required: true,
    enum: ['sent', 'received'],
    default: 'received',
    index: true
  },
  // 消息主题（唯一标识，不能重复）
  topic: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  // 消息内容
  content: {
    type: String,
    required: true,
    trim: true
  },
  // 解锁条件：需要完成的剧本ID列表（空数组表示无解锁条件，始终显示）
  unlockConditions: {
    type: [String],
    default: []
  },
  // 消息链解锁条件：需要操作的消息列表（空数组表示无解锁条件，始终显示）
  // 支持两种格式：
  // 1. 旧格式（向后兼容）：字符串数组，只要操作过就算满足
  //    例如：['messageA', 'messageB']
  // 2. 新格式：对象数组，每个对象包含：
  //    - topic: 消息主题（必需）
  //    - requiredAction: 必需的操作类型
  //      - 'receive': 必须接收（messageReceiveStatus 为 true）
  //      - 'reject': 必须拒绝（messageReceiveStatus 为 false）
  //      - 'any': 任意操作都可以（默认值）
  //    例如：[{ topic: 'messageA', requiredAction: 'receive' }, { topic: 'messageB', requiredAction: 'reject' }]
  unlockTopics: {
    type: [mongoose.Schema.Types.Mixed], // 支持字符串或对象
    default: []
  },
  // 显示顺序
  displayOrder: {
    type: Number,
    default: 0,
    index: true
  },
  // 是否激活
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // 是否已读（用于前端标记）
  isRead: {
    type: Boolean,
    default: false
  },
  // 可见性：控制哪些身份的用户可以看到此消息
  // 'all' = 所有人可见, 'day' = 仅昼用户, 'night' = 仅夜用户
  visibility: {
    type: String,
    enum: ['all', 'day', 'night'],
    default: 'all',
    index: true
  },
  // 章节显示范围：消息应该在哪段章节范围内显示
  // 如果存在，消息只会在当前完成的章节数在这个范围内时显示
  // 如果不存在或为空，表示没有章节范围限制
  chapterRange: {
    startChapter: {
      type: Number,
      default: null
    },
    endChapter: {
      type: Number,
      default: null
    }
  },
  // 元数据
  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  collection: 'misc_messages'
});

// 索引优化
miscMessageSchema.index({ date: -1, displayOrder: 1 });
miscMessageSchema.index({ isActive: 1, visibility: 1 });
miscMessageSchema.index({ unlockConditions: 1 });
miscMessageSchema.index({ unlockTopics: 1 });

// 保存前自动更新 updatedAt
miscMessageSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MiscMessage', miscMessageSchema);


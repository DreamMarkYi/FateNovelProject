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

// 保存前自动更新 updatedAt
miscMessageSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MiscMessage', miscMessageSchema);


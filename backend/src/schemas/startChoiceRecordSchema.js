const mongoose = require('mongoose');

// Start页面选择记录Schema
const startChoiceRecordSchema = new mongoose.Schema({
  // 玩家ID（与game_saves的playerId对应）
  playerId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  // 玩家输入的名字
  playerName: {
    type: String,
    required: true,
    trim: true,
    default: function() {
      return `访客_${this.playerId.slice(0, 8)}`;
    }
  },
  // 是否输入了自定义名字
  hasCustomName: {
    type: Boolean,
    default: false
  },
  // 身份选择（'named' 输入名字 / 'skipped' 跳过）
  identityChoice: {
    type: String,
    enum: ['named', 'skipped'],
    required: true
  },
  // 是否已完成StartPage
  hasSeenStartPage: {
    type: Boolean,
    default: false
  },
  // StartPage完成时间
  startPageCompletedAt: {
    type: Date
  },
  // 用户的选择记录数组
  choices: [{
    // 场景ID
    sceneId: {
      type: Number,
      required: true
    },
    // 选择的文本
    choiceText: {
      type: String,
      required: true
    },
    // 选择的分数
    score: {
      type: Number,
      required: true
    },
    // 选择时间戳
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // 最终分数
  finalScore: {
    type: Number,
    required: false,
    default: 0
  },
  // 最终结果（'day' 白昼 / 'night' 永夜 / 'incomplete' 未完成）
  finalResult: {
    type: String,
    enum: ['day', 'night', 'incomplete'],
    required: false,
    default: 'incomplete'
  },
  // 结局ID
  endingId: {
    type: Number,
    required: false
  },
  // 完成时间
  completedAt: {
    type: Date,
    required: false
  },
  // 游戏时长（秒）
  playTime: {
    type: Number,
    default: 0
  },
  // IP地址（用于数据分析）
  ipAddress: {
    type: String,
    trim: true
  },
  // 用户代理（浏览器信息）
  userAgent: {
    type: String,
    trim: true
  },
  // 最后登录时间
  lastLoginAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true,
  collection: 'start_choice_records'
});

// 索引
startChoiceRecordSchema.index({ playerId: 1 });
startChoiceRecordSchema.index({ ipAddress: 1 });
startChoiceRecordSchema.index({ ipAddress: 1, hasSeenStartPage: 1 });
startChoiceRecordSchema.index({ finalResult: 1 });
startChoiceRecordSchema.index({ createdAt: -1 });
startChoiceRecordSchema.index({ completedAt: -1 });
startChoiceRecordSchema.index({ playerName: 1, hasCustomName: 1 }); // 用于检查名称是否存在

// 虚拟字段：选择数量
startChoiceRecordSchema.virtual('choiceCount').get(function() {
  return this.choices.length;
});

// 实例方法：添加选择
startChoiceRecordSchema.methods.addChoice = function(sceneId, choiceText, score) {
  this.choices.push({
    sceneId,
    choiceText,
    score,
    timestamp: new Date()
  });
  this.finalScore += score;
};

// 实例方法：设置最终结果
startChoiceRecordSchema.methods.setFinalResult = function(endingId) {
  this.endingId = endingId;
  this.finalResult = this.finalScore > 0 ? 'day' : 'night';
  this.completedAt = new Date();
};

// 静态方法：获取统计数据
startChoiceRecordSchema.statics.getStatistics = async function() {
  const totalRecords = await this.countDocuments();
  const dayCount = await this.countDocuments({ finalResult: 'day' });
  const nightCount = await this.countDocuments({ finalResult: 'night' });
  
  return {
    total: totalRecords,
    day: dayCount,
    night: nightCount,
    dayPercentage: totalRecords > 0 ? ((dayCount / totalRecords) * 100).toFixed(2) : 0,
    nightPercentage: totalRecords > 0 ? ((nightCount / totalRecords) * 100).toFixed(2) : 0
  };
};

// 静态方法：获取热门选择
startChoiceRecordSchema.statics.getPopularChoices = async function(sceneId) {
  const records = await this.find({
    'choices.sceneId': sceneId
  });
  
  const choiceMap = new Map();
  
  records.forEach(record => {
    const choice = record.choices.find(c => c.sceneId === sceneId);
    if (choice) {
      const key = choice.choiceText;
      choiceMap.set(key, (choiceMap.get(key) || 0) + 1);
    }
  });
  
  return Array.from(choiceMap.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count);
};

// 静态方法：检查IP是否首次访问
startChoiceRecordSchema.statics.isFirstTimeVisitor = async function(ipAddress) {
  const existingRecord = await this.findOne({ 
    ipAddress,
    hasSeenStartPage: true
  });
  
  return !existingRecord;
};

// 静态方法：初始化访客会话
startChoiceRecordSchema.statics.initVisitorSession = async function(playerId, ipAddress, userAgent) {
  let record = await this.findOne({ playerId });
  
  if (record) {
    // 已存在，返回现有记录
    return record;
  }
  
  // 创建新访客记录
  record = await this.create({
    playerId,
    playerName: `访客_${playerId.slice(0, 8)}`,
    hasCustomName: false,
    identityChoice: 'skipped',
    hasSeenStartPage: false,
    finalResult: 'incomplete',
    ipAddress,
    userAgent
  });
  
  return record;
};

module.exports = mongoose.model('StartChoiceRecord', startChoiceRecordSchema);


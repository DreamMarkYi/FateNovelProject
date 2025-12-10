const mongoose = require('mongoose');

// 单个存档数据的子Schema
const saveSlotSchema = new mongoose.Schema({
  // 存档名称
  saveName: {
    type: String,
    trim: true,
    default: '未命名存档'
  },
  // 存档描述/备注
  description: {
    type: String,
    trim: true
  },
  // 当前剧本ID
  scriptId: {
    type: String,
    required: true,
    trim: true
  },
  // 剧本名称
  scriptName: {
    type: String,
    trim: true
  },
  // 当前场景索引
  currentSceneIndex: {
    type: Number,
    required: true,
    default: 0
  },
  // 存档截图（可选，用于显示存档缩略图）
  screenshot: {
    type: String,
    trim: true
  },
  // 当前场景信息快照（用于快速显示）
  sceneSnapshot: {
    speaker: String,
    text: String,
    bgImage: String,
    timestamp: Date
  },
  // 游戏进度百分比
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // 游戏变量状态（用于分支剧情）
  gameVariables: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // 选择历史记录
  choiceHistory: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  // 已读场景索引列表（用于"已读跳过"功能）
  readScenes: {
    type: [Number],
    default: []
  },
  // 已解锁的CG/成就等
  unlockedContent: {
    cg: [String],
    achievements: [String],
    endings: [String]
  },
  // 游戏时长（秒）
  playTime: {
    type: Number,
    default: 0
  },
  // 是否自动存档
  isAutoSave: {
    type: Boolean,
    default: false
  },
  // 是否快速存档
  isQuickSave: {
    type: Boolean,
    default: false
  },
  // 存档有效性
  isValid: {
    type: Boolean,
    default: true
  },
  // 存档时间戳
  savedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // 不为子文档生成 _id

// 用户游戏存档总表 Schema（一个用户一条记录）
const gameSaveSchema = new mongoose.Schema({
  // 玩家ID（唯一标识）
  playerId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  // 玩家名称（可选）
  playerName: {
    type: String,
    trim: true
  },
  // 所有存档槽位（使用 Map 存储，key 为槽位号）
  saves: {
    type: Map,
    of: saveSlotSchema,
    default: new Map()
  },
  // 全局已读场景（跨存档）
  globalReadScenes: {
    type: [Number],
    default: []
  },
  // 全局解锁内容（跨存档）
  globalUnlockedContent: {
    cg: [String],
    achievements: [String],
    endings: [String]
  },
  // 元数据
  metadata: {
    // 总存档数
    totalSaves: {
      type: Number,
      default: 0
    },
    // 最后游玩时间
    lastPlayedAt: {
      type: Date,
      default: Date.now
    },
    // 总游戏时长（秒）
    totalPlayTime: {
      type: Number,
      default: 0
    },
    // 游戏版本
    gameVersion: {
      type: String,
      default: '1.0.0'
    }
  }
}, {
  timestamps: true,
  collection: 'game_saves'
});

// 索引
gameSaveSchema.index({ playerId: 1 }, { unique: true });
gameSaveSchema.index({ 'metadata.lastPlayedAt': -1 });
gameSaveSchema.index({ createdAt: -1 });

// 保存前自动更新元数据
gameSaveSchema.pre('save', function(next) {
  // 更新总存档数
  this.metadata.totalSaves = this.saves.size;
  
  // 更新最后游玩时间
  this.metadata.lastPlayedAt = new Date();
  
  // 计算总游戏时长
  let totalTime = 0;
  this.saves.forEach(save => {
    totalTime += save.playTime || 0;
  });
  this.metadata.totalPlayTime = totalTime;
  
  next();
});

// ============= 实例方法 =============

/**
 * 获取指定槽位的存档
 */
gameSaveSchema.methods.getSave = function(saveSlot) {
  return this.saves.get(saveSlot.toString());
};

/**
 * 设置/更新指定槽位的存档
 */
gameSaveSchema.methods.setSave = function(saveSlot, saveData) {
  const slotKey = saveSlot.toString();
  saveData.savedAt = new Date();
  this.saves.set(slotKey, saveData);
};

/**
 * 删除指定槽位的存档
 */
gameSaveSchema.methods.deleteSave = function(saveSlot) {
  return this.saves.delete(saveSlot.toString());
};

/**
 * 获取所有存档（转换为数组）
 */
gameSaveSchema.methods.getAllSaves = function() {
  const savesArray = [];
  this.saves.forEach((saveData, slotKey) => {
    savesArray.push({
      saveSlot: parseInt(slotKey),
      ...saveData.toObject()
    });
  });
  return savesArray.sort((a, b) => a.saveSlot - b.saveSlot);
};

/**
 * 获取快速存档
 */
gameSaveSchema.methods.getQuickSave = function() {
  return this.saves.get('99');
};

/**
 * 获取自动存档
 */
gameSaveSchema.methods.getAutoSave = function() {
  return this.saves.get('98');
};

/**
 * 标记场景为全局已读
 */
gameSaveSchema.methods.markSceneAsGlobalRead = function(sceneIndex) {
  if (!this.globalReadScenes.includes(sceneIndex)) {
    this.globalReadScenes.push(sceneIndex);
  }
};

/**
 * 检查场景是否全局已读
 */
gameSaveSchema.methods.isSceneGlobalRead = function(sceneIndex) {
  return this.globalReadScenes.includes(sceneIndex);
};

/**
 * 解锁全局内容
 */
gameSaveSchema.methods.unlockGlobalContent = function(type, contentId) {
  if (!this.globalUnlockedContent[type]) {
    this.globalUnlockedContent[type] = [];
  }
  if (!this.globalUnlockedContent[type].includes(contentId)) {
    this.globalUnlockedContent[type].push(contentId);
  }
};

// ============= 静态方法 =============

/**
 * 查找或创建用户存档记录
 */
gameSaveSchema.statics.findOrCreatePlayer = async function(playerId, playerName = null) {
  let playerSaves = await this.findOne({ playerId });
  
  if (!playerSaves) {
    playerSaves = await this.create({
      playerId,
      playerName,
      saves: new Map(),
      globalReadScenes: [],
      globalUnlockedContent: {
        cg: [],
        achievements: [],
        endings: []
      }
    });
    console.log('✅ 创建新的用户存档记录:', playerId);
  }
  
  return playerSaves;
};

module.exports = mongoose.model('GameSave', gameSaveSchema);

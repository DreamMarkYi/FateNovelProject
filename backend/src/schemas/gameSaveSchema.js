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
  // 已完成的剧本列表
  completedScripts: {
    type: [String],
    default: [],
    index: true
  },
  // 已解锁的剧本列表（缓存字段）
  unlockedScripts: {
    type: [String],
    default: [],
    index: true
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
  },
  // 消息接收状态（Map格式：key为消息ID，value为boolean，true表示接收，false表示不接收）
  messageReceiveStatus: {
    type: Map,
    of: Boolean,
    default: new Map()
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

/**
 * 标记剧本为已完成
 */
gameSaveSchema.methods.markScriptCompleted = function(scriptId) {
  if (!this.completedScripts.includes(scriptId)) {
    this.completedScripts.push(scriptId);
    console.log(`✅ 标记剧本完成: ${scriptId}`);
    return true; // 新完成
  }
  return false; // 已经完成过
};

/**
 * 检查剧本是否已完成
 */
gameSaveSchema.methods.isScriptCompleted = function(scriptId) {
  return this.completedScripts.includes(scriptId);
};

/**
 * 计算并更新已解锁的剧本列表
 */
gameSaveSchema.methods.updateUnlockedScripts = async function(allScripts) {
  const previouslyUnlocked = new Set(this.unlockedScripts || []);
  const currentlyUnlocked = [];
  
  // 根据解锁条件判断哪些剧本已解锁
  for (const script of allScripts) {
    let isUnlocked = true;
    
    // 如果有解锁条件，检查是否都满足
    if (script.unlockConditions && script.unlockConditions.length > 0) {
      isUnlocked = script.unlockConditions.every(requiredScriptId => 
        this.completedScripts.includes(requiredScriptId)
      );
    }
    
    // 如果解锁，添加到列表中
    if (isUnlocked) {
      currentlyUnlocked.push(script.scriptId);
    }
  }
  
  // 更新缓存字段
  this.unlockedScripts = currentlyUnlocked;
  
  // 找出新解锁的剧本
  const newlyUnlocked = currentlyUnlocked.filter(id => !previouslyUnlocked.has(id));
  
  console.log(`🔓 已解锁剧本: ${currentlyUnlocked.length}个`);
  if (newlyUnlocked.length > 0) {
    console.log(`🆕 新解锁: ${newlyUnlocked.join(', ')}`);
  }
  
  return newlyUnlocked;
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
      playerName: playerName || null,
      saves: new Map(),
      globalReadScenes: [],
      globalUnlockedContent: {
        cg: [],
        achievements: [],
        endings: []
      }
    });
    console.log('✅ 创建新的用户存档记录:', playerId, playerName ? `玩家名称: ${playerName}` : '');
  } else if (playerName && playerName.trim() && (!playerSaves.playerName || playerSaves.playerName !== playerName.trim())) {
    // 如果记录已存在，但 playerName 有更新，则更新它
    playerSaves.playerName = playerName.trim();
    await playerSaves.save();
    console.log('✅ 更新玩家名称:', playerId, '->', playerName.trim());
  }
  
  return playerSaves;
};

module.exports = mongoose.model('GameSave', gameSaveSchema);

const mongoose = require('mongoose');

// ============ 战斗技能相关 Schema ============

// 技能效果结构
const skillEffectSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['damage', 'heal', 'buff', 'debuff', 'seal', 'field', 'defense'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  target: {
    type: String,
    enum: ['self', 'enemy', 'field'],
    default: 'enemy'
  }
}, { _id: false });

// 技能条件结构
const skillConditionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mp_above', 'hp_below', 'hp_above', 'field_exists', 'cooldown', 'turn_count', 'sealed_enemy'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  target: {
    type: String,
    enum: ['self', 'enemy', 'field'],
    default: 'self'
  }
}, { _id: false });

// 战斗技能结构
const battleSkillSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['attack', 'defense', 'seal', 'field', 'recovery'],
    required: true
  },
  power: {
    type: Number,
    default: 50,
    min: 5,
    max: 100
  },
  cost: {
    type: Number,
    default: 15,
    min: 0,
    max: 50
  },
  accuracy: {
    type: Number,
    default: 85,
    min: 50,
    max: 100
  },
  description: {
    type: String,
    required: true
  },
  flavorText: {
    type: String,
    default: ''
  },
  flavorTextTranslation: {
    type: String,
    default: ''
  },
  effects: {
    type: [skillEffectSchema],
    default: []
  },
  conditions: {
    type: [skillConditionSchema],
    default: []
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isBase: {
    type: Boolean,
    default: true
  },
  derivedFrom: {
    type: String,
    default: null
  },
  synergyWith: {
    type: [String],
    default: []
  }
}, { _id: false });

// 旧版招式结构（兼容旧数据）
const legacyMoveSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  effect: {
    type: String,
    required: true
  },
  restriction: {
    type: String,
    required: true
  }
}, { _id: false });

// ============ 属性 Schema ============

// 战斗属性
const battleStatsSchema = new mongoose.Schema({
  maxHp: { type: Number, default: 100 },
  maxMp: { type: Number, default: 100 },
  attack: { type: Number, default: 50 },
  defense: { type: Number, default: 50 },
  magic: { type: Number, default: 50 },
  agility: { type: Number, default: 50 },
  resistance: { type: Number, default: 50 }
}, { _id: false });

// 展示属性（卡片用）
const displayStatsSchema = new mongoose.Schema({
  Strength: { type: Number, default: 0 },
  Endurance: { type: Number, default: 0 },
  Agility: { type: Number, default: 0 },
  Mana: { type: Number, default: 0 }
}, { _id: false });

// 卡片技能简化结构
const cardSkillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  desc: { type: String, required: true, trim: true }
}, { _id: false });

// ============ 统一角色 Schema ============

const unifiedCharacterSchema = new mongoose.Schema({
  // ===== 核心标识 =====
  characterId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // ===== 名称信息 =====
  name: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  
  // ===== 描述信息 =====
  desc: {
    type: String,
    default: ''
  },
  intro: {
    type: String,
    default: ''
  },
  personality: {
    type: String,
    default: ''
  },
  magicStyle: {
    type: String,
    default: ''
  },
  
  // ===== 图片资源 =====
  imageUrl: {
    type: String,
    default: null
  },
  backgroundImage: {
    type: String,
    default: ''
  },
  hoverGradient: {
    type: String,
    default: 'linear-gradient(to top, rgba(100, 150, 200, 0.8), transparent)'
  },
  commandImage: {
    type: String,
    default: '/storyImage/command1.png'
  },
  overlayColor: {
    type: String,
    default: 'rgba(100, 150, 200, 0.3)'
  },
  overlayDarkColor: {
    type: String,
    default: 'rgba(50, 80, 120, 0.3)'
  },
  overlayBackgroundImage: {
    type: String,
    default: '/storyImage/harukaBG.png'
  },
  decorationType: {
    type: String,
    enum: ['type1', 'type2'],
    default: 'type1'
  },
  
  // ===== 卡片展示 =====
  season: {
    type: String,
    default: ''
  },
  number: {
    type: String,
    default: ''
  },
  index: {
    type: Number,
    default: 0,
    index: true
  },
  unlocked: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // ===== 属性数值 =====
  displayStats: {
    type: displayStatsSchema,
    default: () => ({
      Strength: 0,
      Endurance: 0,
      Agility: 0,
      Mana: 0
    })
  },
  battleStats: {
    type: battleStatsSchema,
    default: () => ({
      maxHp: 100,
      maxMp: 100,
      attack: 50,
      defense: 50,
      magic: 50,
      agility: 50,
      resistance: 50
    })
  },
  
  // ===== 技能系统 =====
  baseSkills: {
    type: [battleSkillSchema],
    default: []
  },
  // 卡片展示用的简化技能（兼容旧数据）
  cardSkills: {
    type: [cardSkillSchema],
    default: []
  },
  // 旧版招式列表（兼容性保留）
  moves: {
    type: [legacyMoveSchema],
    default: []
  },
  
  // ===== 元信息 =====
  characterType: {
    type: String,
    enum: ['enemy', 'player', 'neutral'],
    default: 'enemy'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'normal', 'hard', 'insane', 'meme'],
    default: 'normal'
  },
  tags: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // ===== 元数据 =====
  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  collection: 'characters'
});

// ============ 索引 ============
unifiedCharacterSchema.index({ characterId: 1, isActive: 1 });
unifiedCharacterSchema.index({ characterType: 1, isActive: 1 });
unifiedCharacterSchema.index({ unlocked: 1, index: 1 });
unifiedCharacterSchema.index({ season: 1, number: 1 });
unifiedCharacterSchema.index({ tags: 1 });

// ============ 虚拟字段 ============

// 兼容旧版：stats 映射到 battleStats
unifiedCharacterSchema.virtual('stats').get(function() {
  return this.battleStats;
});

// 兼容旧版：skills 映射到卡片技能格式
unifiedCharacterSchema.virtual('skills').get(function() {
  // 优先使用 cardSkills
  if (this.cardSkills && this.cardSkills.length > 0) {
    return this.cardSkills;
  }
  // 否则从 baseSkills 转换
  if (this.baseSkills && this.baseSkills.length > 0) {
    return this.baseSkills.map(skill => ({
      name: skill.name,
      desc: skill.description
    }));
  }
  return [];
});

// ============ 静态方法：战斗系统用 ============

// 根据 characterId 查找角色
unifiedCharacterSchema.statics.findByCharacterId = function(characterId) {
  return this.findOne({ characterId, isActive: true });
};

// 获取所有激活的敌方角色
unifiedCharacterSchema.statics.findActiveEnemies = function() {
  return this.find({ characterType: 'enemy', isActive: true })
    .select('characterId name desc imageUrl difficulty tags battleStats')
    .sort({ createdAt: -1 });
};

// 获取所有激活的玩家角色
unifiedCharacterSchema.statics.findActivePlayers = function() {
  return this.find({ characterType: 'player', isActive: true })
    .select('characterId name desc imageUrl battleStats')
    .sort({ createdAt: -1 });
};

// ============ 静态方法：卡片系统用 ============

// 获取卡片展示数据
unifiedCharacterSchema.statics.getCardData = async function(characterId) {
  const doc = await this.findOne({ characterId, isActive: true })
    .select('characterId name title subtitle label desc intro season number index unlocked backgroundImage hoverGradient commandImage overlayColor overlayDarkColor overlayBackgroundImage decorationType displayStats baseSkills cardSkills')
    .lean();
  
  if (!doc) return null;
  
  // 转换为卡片格式
  return {
    ...doc,
    stats: doc.displayStats,
    skills: doc.cardSkills?.length > 0 
      ? doc.cardSkills 
      : (doc.baseSkills?.map(s => ({ name: s.name, desc: s.description })) || [])
  };
};

// 获取战斗数据
unifiedCharacterSchema.statics.getBattleData = async function(characterId) {
  const doc = await this.findOne({ characterId, isActive: true })
    .select('characterId name desc imageUrl personality magicStyle battleStats baseSkills moves characterType difficulty tags')
    .lean();
  
  if (!doc) return null;
  
  return {
    ...doc,
    stats: doc.battleStats
  };
};

// ============ 实例方法：辅助方法 ============

// 推断技能类型（从旧版 moves 转换用）
unifiedCharacterSchema.methods.inferSkillType = function(originalType) {
  if (!originalType) return 'attack';
  
  const lowerType = originalType.toLowerCase();
  
  if (lowerType.includes('攻击') || lowerType.includes('attack') || lowerType.includes('贯穿') || lowerType.includes('伤害')) {
    return 'attack';
  }
  if (lowerType.includes('防御') || lowerType.includes('defense') || lowerType.includes('护盾') || lowerType.includes('反击')) {
    return 'defense';
  }
  if (lowerType.includes('封印') || lowerType.includes('seal') || lowerType.includes('控制') || lowerType.includes('禁用')) {
    return 'seal';
  }
  if (lowerType.includes('阵地') || lowerType.includes('field') || lowerType.includes('结界') || lowerType.includes('领域')) {
    return 'field';
  }
  if (lowerType.includes('回复') || lowerType.includes('recovery') || lowerType.includes('治疗') || lowerType.includes('恢复')) {
    return 'recovery';
  }
  
  return 'attack';
};

// ============ 实例方法：战斗系统用 ============

// 获取用于战斗的技能列表（兼容新旧格式）
unifiedCharacterSchema.methods.getBattleSkills = function() {
  // 优先使用新版 baseSkills
  if (this.baseSkills && this.baseSkills.length > 0) {
    return this.baseSkills;
  }
  
  // 如果没有新版技能，将旧版 moves 转换为新格式
  if (this.moves && this.moves.length > 0) {
    return this.moves.map(move => ({
      id: move.id,
      name: move.name,
      type: this.inferSkillType(move.type),
      power: 50,
      cost: 15,
      accuracy: 85,
      description: move.effect,
      flavorText: '',
      flavorTextTranslation: '',
      effects: [],
      conditions: [],
      rarity: 'common',
      isBase: true,
      derivedFrom: null,
      synergyWith: [],
      _originalType: move.type,
      _originalRestriction: move.restriction
    }));
  }
  
  return [];
};

// 获取角色的简要信息
unifiedCharacterSchema.methods.getBriefInfo = function() {
  return {
    characterId: this.characterId,
    name: this.name,
    desc: this.desc,
    imageUrl: this.imageUrl || this.backgroundImage,
    difficulty: this.difficulty,
    stats: this.battleStats,
    skillCount: (this.baseSkills?.length || 0) + (this.moves?.length || 0)
  };
};

// 获取用于战斗的完整角色数据
unifiedCharacterSchema.methods.getBattleProfile = function() {
  return {
    characterId: this.characterId,
    name: this.name,
    desc: this.desc,
    imageUrl: this.imageUrl || this.backgroundImage,
    personality: this.personality || this.desc,
    magicStyle: this.magicStyle || '见招式库',
    stats: this.battleStats || {
      maxHp: 100,
      maxMp: 100,
      attack: 50,
      defense: 50,
      magic: 50,
      agility: 50,
      resistance: 50
    },
    baseSkills: this.getBattleSkills(),
    characterType: this.characterType,
    difficulty: this.difficulty
  };
};

// ============ 实例方法：卡片系统用 ============

// 获取卡片配置
unifiedCharacterSchema.methods.getCardProfile = function() {
  // 获取技能列表
  let skills = [];
  if (this.cardSkills && this.cardSkills.length > 0) {
    skills = this.cardSkills;
  } else if (this.baseSkills && this.baseSkills.length > 0) {
    skills = this.baseSkills.map(s => ({ name: s.name, desc: s.description }));
  }
  
  return {
    _id: this._id,
    characterId: this.characterId,
    season: this.season || '',
    number: this.number || '',
    title: this.title || this.name,
    subtitle: this.subtitle || '',
    label: this.label || '',
    backgroundImage: this.backgroundImage || this.imageUrl || '',
    hoverGradient: this.hoverGradient,
    commandImage: this.commandImage,
    overlayColor: this.overlayColor,
    overlayDarkColor: this.overlayDarkColor,
    overlayBackgroundImage: this.overlayBackgroundImage,
    decorationType: this.decorationType,
    unlocked: this.unlocked,
    index: this.index,
      intro: this.intro || this.desc || '',
      stats: this.displayStats || { Strength: 0, Endurance: 0, Agility: 0, Mana: 0 },
      skills: skills,
      // 完整战斗技能（魔术术式）
      baseSkills: this.baseSkills || []
    };
  };

// ============ 导出 ============

const Character = mongoose.model('Character', unifiedCharacterSchema);

module.exports = Character;


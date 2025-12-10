const mongoose = require('mongoose');

// StartPage 剧本 Schema
const startPageScriptSchema = new mongoose.Schema({
  // 剧本ID（唯一标识）
  scriptId: {
    type: String,
    required: true,
    unique: true,
    default: 'start_script_v1'
  },
  // 剧本版本
  version: {
    type: String,
    required: true,
    default: '1.0.0'
  },
  // 剧本名称
  name: {
    type: String,
    required: true,
    default: '白昼与永夜'
  },
  // 剧本描述
  description: {
    type: String,
    default: 'Start Page 互动剧本'
  },
  // 场景数据数组
  scenes: [{
    // 场景ID
    id: {
      type: Number,
      required: true
    },
    // 场景类型
    type: {
      type: String,
      enum: ['intro', 'gate', 'input', 'center', 'text', 'title', 'quiz'],
      required: true
    },
    // 场景文本
    text: {
      type: String,
      default: ''
    },
    // 动画类型
    anim: {
      type: String,
      enum: ['blink-long', 'blink-fast', 'fade', ''],
      default: ''
    },
    // 主题
    theme: {
      type: String,
      enum: ['gate', 'void', 'ink', 'light', 'dark', ''],
      default: ''
    },
    // 下一个场景ID
    nextId: {
      type: Number
    },
    // 选择项（仅用于 quiz 类型）
    choices: [{
      text: String,
      sub: String,
      score: Number,
      nextId: Number
    }],
    // 标题（用于 title 类型）
    title: String,
    // 副标题
    sub: String
  }],
  // 结局配置
  endings: [{
    // 结局ID
    endingId: {
      type: Number,
      required: true
    },
    // 结局类型
    type: {
      type: String,
      enum: ['day', 'night'],
      required: true
    },
    // 结局场景ID
    sceneId: {
      type: Number,
      required: true
    },
    // 触发条件（分数范围）
    condition: {
      minScore: Number,
      maxScore: Number
    }
  }],
  // 是否激活
  isActive: {
    type: Boolean,
    default: true
  },
  // 创建者
  createdBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true,
  collection: 'start_page_scripts'
});

// 索引
startPageScriptSchema.index({ scriptId: 1 }, { unique: true });
startPageScriptSchema.index({ isActive: 1 });

// 实例方法：根据ID获取场景
startPageScriptSchema.methods.getSceneById = function(sceneId) {
  return this.scenes.find(scene => scene.id === sceneId);
};

// 实例方法：根据分数获取结局
startPageScriptSchema.methods.getEndingByScore = function(score) {
  return this.endings.find(ending => {
    if (ending.condition.minScore !== undefined && score < ending.condition.minScore) {
      return false;
    }
    if (ending.condition.maxScore !== undefined && score > ending.condition.maxScore) {
      return false;
    }
    return true;
  });
};

// 静态方法：获取激活的剧本
startPageScriptSchema.statics.getActiveScript = async function() {
  return await this.findOne({ isActive: true });
};

module.exports = mongoose.model('StartPageScript', startPageScriptSchema);


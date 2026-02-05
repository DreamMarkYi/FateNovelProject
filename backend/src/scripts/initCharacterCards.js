const { connectMongoDB, mongoose } = require('../config/mongodb');
const Character = require('../schemas/unifiedCharacterSchema');

/**
 * Character Cards 数据库初始化脚本
 * 
 * 功能：
 * 1. 初始化角色卡片数据（characters 集合）
 * 2. 创建必要的索引
 * 3. 验证数据结构
 */

// 默认角色卡片数据（统一格式）
const defaultCharacterCards = [
  {
    characterId: 'ShiratoriHaruka',
    name: '白鳥 瑤',
    title: '白鳥 瑤',
    season: 'Saber',
    number: 'H O 1',
    subtitle: 'SHIRATORI HARUKA',
    label: 'Distrust',
    backgroundImage: '/storyImage/haruka1_Alpha_position.png',
    hoverGradient: 'linear-gradient(168deg, rgba(252, 253, 257 ,0.9) 0%, rgba(227, 252, 254, 0.8) 50%, rgba(50, 51, 51, 0.9) 100%)',
    decorationType: 'type1',
    commandImage: '/storyImage/command1.png',
    overlayColor: 'rgb(100, 200, 255)',
    overlayDarkColor: 'rgba(247,252,255,1)',
    overlayBackgroundImage: '/storyImage/harukaBG2.png',
    unlocked: true,
    index: 0,
    intro: '"剑所指的方向，即是吾心之所向。<br>在纯白的誓言下，绝不允许任何背叛。"',
    desc: '冷静的优等生，拥有观测因果的魔眼，擅长天体/水晶魔术。',
    personality: '1. 冷静理智，擅长观察与分析。\n2. 拥有因果透视的魔眼，能预见攻击轨迹。\n3. 战斗风格优雅而精准，如同星辰运行般井然有序。',
    magicStyle: '1. 核心概念：天体水晶魔术 (Astral Crystal Magic)。\n2. 通过操纵光的折射与能量束，进行远程精准打击。\n3. 战斗风格：高机动、精准打击、战术布局。',
    displayStats: {
      Strength: 80,
      Endurance: 90,
      Agility: 60,
      Mana: 40
    },
    battleStats: {
      maxHp: 120,
      maxMp: 100,
      attack: 60,
      defense: 55,
      magic: 70,
      agility: 65,
      resistance: 50
    },
    cardSkills: [
      { name: '皎月剑舞 (A)', desc: '提升自身 Arts 卡性能 (3回合)' },
      { name: '绝对信任 (B+)', desc: '赋予己方单体无敌状态 (1回合)' }
    ],
    baseSkills: [
      {
        id: 'vega_arrow',
        name: '织星贯流 (Vega Arrow)',
        type: 'attack',
        power: 65,
        cost: 12,
        accuracy: 95,
        description: '施放一束极高速、高密度、不可折射的能量光束，精准锁定目标并贯穿防御。',
        flavorText: 'Sagitta stellae, penetra umbras!',
        flavorTextTranslation: '星之箭矢，贯穿阴影！',
        effects: [{ type: 'damage', value: 65, target: 'enemy' }],
        conditions: [],
        rarity: 'common',
        isBase: true
      },
      {
        id: 'vega_prism_net',
        name: '织星折光网 (Vega Prism Net)',
        type: 'defense',
        power: 40,
        cost: 18,
        accuracy: 90,
        description: '布置多枚水晶节点形成折射网。既可自动拦截敌方攻击，也可让己方光束不断弹跳变轨。',
        flavorText: 'Rete lucis, protege me!',
        flavorTextTranslation: '光之网，守护我！',
        effects: [{ type: 'defense', value: 40, duration: 2, target: 'self' }],
        conditions: [],
        rarity: 'common',
        isBase: true
      },
      {
        id: 'causality_vision',
        name: '魔眼：因果透视',
        type: 'defense',
        power: 30,
        cost: 20,
        accuracy: 100,
        description: '观察24小时内的因果线，看到攻击的源头与必然走向，提前规避。',
        flavorText: 'Oculus fati, revela veritatem!',
        flavorTextTranslation: '命运之眼，揭示真相！',
        effects: [{ type: 'buff', value: 'evasion_up', duration: 1, target: 'self' }],
        conditions: [{ type: 'mp_above', value: 20, target: 'self' }],
        rarity: 'rare',
        isBase: true
      }
    ],
    characterType: 'player',
    difficulty: 'normal',
    tags: ['光系', '天体', '因果'],
    isActive: true
  },
  {
    characterId: 'AkamiyaHina',
    name: '天宮院 菲娜',
    title: '天宮院 菲娜',
    season: 'Archer',
    number: 'H O 2',
    subtitle: 'AKAMIYA HINA',
    label: 'Thinker',
    backgroundImage: '/storyImage/Ruri1.png',
    hoverGradient: 'linear-gradient(168deg, rgba(252, 242, 238, 0.7) 0%, rgba(148, 49, 49, 0.5) 50%, rgba(59, 52, 50, 0.9) 100%)',
    decorationType: 'type2',
    commandImage: '/storyImage/command2.png',
    overlayColor: 'rgb(212, 93, 93)',
    overlayDarkColor: 'rgba(60,17,23,1)',
    overlayBackgroundImage: '/storyImage/SeraphinaBG4.png',
    unlocked: true,
    index: 1,
    intro: '"这把弓不是为了守护而拉开的，而是为了裁定。<br>在赤红的满月之下，没有猎物能逃脱我的视线。"',
    desc: '冷酷的狙击手，操纵赤红之月的力量。',
    personality: '1. 冷酷精准，不轻易表露情感。\n2. 拥有超凡的远程狙击能力。\n3. 擅长在暗处观察并给予致命一击。',
    magicStyle: '1. 核心概念：赤月弓术。\n2. 通过月光能量强化箭矢。\n3. 战斗风格：远程、高暴击、隐匿。',
    displayStats: {
      Strength: 60,
      Endurance: 40,
      Agility: 90,
      Mana: 75
    },
    battleStats: {
      maxHp: 90,
      maxMp: 110,
      attack: 75,
      defense: 35,
      magic: 60,
      agility: 80,
      resistance: 45
    },
    cardSkills: [
      { name: '千里眼 (C+)', desc: '提升自身的暴击星掉落率' },
      { name: '赤红之月 (A)', desc: '赋予自身回避状态 & 攻击力提升' }
    ],
    baseSkills: [
      {
        id: 'crimson_shot',
        name: '赤月穿心箭',
        type: 'attack',
        power: 75,
        cost: 15,
        accuracy: 90,
        description: '以月光能量凝聚的箭矢，追踪敌人心脏进行精准打击。',
        flavorText: 'Luna rubra, cor transfige!',
        flavorTextTranslation: '赤红之月，贯穿心脏！',
        effects: [{ type: 'damage', value: 75, target: 'enemy' }],
        conditions: [],
        rarity: 'common',
        isBase: true
      },
      {
        id: 'shadow_step',
        name: '月影遁步',
        type: 'defense',
        power: 35,
        cost: 12,
        accuracy: 95,
        description: '融入月影之中，短暂消失于敌人视野。',
        flavorText: 'Umbra lunae, occulta me!',
        flavorTextTranslation: '月之阴影，隐藏我！',
        effects: [{ type: 'buff', value: 'evasion_up', duration: 1, target: 'self' }],
        conditions: [],
        rarity: 'common',
        isBase: true
      }
    ],
    characterType: 'player',
    difficulty: 'normal',
    tags: ['月系', '弓术', '狙击'],
    isActive: true
  },
  {
    characterId: 'KashiroRuri',
    name: '神代 琉璃',
    title: '神代 琉璃',
    season: 'Caster',
    number: 'H O 3',
    subtitle: 'KASHIRO RURI',
    label: 'Recurrence',
    backgroundImage: '/storyImage/Seraphina.png',
    hoverGradient: 'linear-gradient(168deg, rgba(240, 242, 245, 0.9) 0%, rgba(123, 123, 114, 0.9) 50%, rgba(20, 20, 20, 0.9) 100%)',
    decorationType: 'type1',
    commandImage: '/storyImage/command3.png',
    overlayColor: 'rgb(140, 140, 160)',
    overlayDarkColor: 'rgba(50, 80, 120, 0.3)',
    overlayBackgroundImage: '/storyImage/RuriBG5.png',
    unlocked: true,
    index: 2,
    intro: '"魔法并非奇迹，而是对世界法则的重构。<br>你想听听这古老的歌谣吗？"',
    desc: '古老魔术的传承者，掌握着失落的咒歌。',
    personality: '1. 温和而神秘，说话总带着古老的韵味。\n2. 拥有超凡的魔力储备。\n3. 擅长大范围魔术和结界构筑。',
    magicStyle: '1. 核心概念：咒歌魔术。\n2. 通过古老歌谣引导魔力。\n3. 战斗风格：范围控制、魔力压制。',
    displayStats: {
      Strength: 30,
      Endurance: 50,
      Agility: 40,
      Mana: 100
    },
    battleStats: {
      maxHp: 85,
      maxMp: 150,
      attack: 40,
      defense: 45,
      magic: 90,
      agility: 35,
      resistance: 70
    },
    cardSkills: [
      { name: '阵地建造 (Ex)', desc: '提升自身的 Arts 卡性能' },
      { name: '高速神言 (A)', desc: '大幅增加 NP 充能' }
    ],
    baseSkills: [
      {
        id: 'ancient_hymn',
        name: '太古咒歌',
        type: 'attack',
        power: 55,
        cost: 20,
        accuracy: 85,
        description: '吟唱失落的古老歌谣，以纯粹魔力震碎敌人。',
        flavorText: 'Carmen antiquum, frange hostem!',
        flavorTextTranslation: '太古之歌，粉碎敌人！',
        effects: [{ type: 'damage', value: 55, target: 'enemy' }],
        conditions: [],
        rarity: 'common',
        isBase: true
      },
      {
        id: 'barrier_weave',
        name: '结界编织',
        type: 'field',
        power: 45,
        cost: 25,
        accuracy: 100,
        description: '编织一层古老的魔力结界，保护己方并削弱敌方。',
        flavorText: 'Velum magicum, protege et impedi!',
        flavorTextTranslation: '魔力帷幕，守护与阻碍！',
        effects: [
          { type: 'field', value: 'barrier', duration: 3, target: 'field' },
          { type: 'defense', value: 30, duration: 3, target: 'self' }
        ],
        conditions: [{ type: 'mp_above', value: 25, target: 'self' }],
        rarity: 'rare',
        isBase: true
      },
      {
        id: 'mana_recovery',
        name: '魔力涌泉',
        type: 'recovery',
        power: 40,
        cost: 10,
        accuracy: 100,
        description: '从大地汲取魔力，恢复自身状态。',
        flavorText: 'Fons magiae, reple me!',
        flavorTextTranslation: '魔力之泉，填满我！',
        effects: [{ type: 'heal', value: 40, target: 'self' }],
        conditions: [],
        rarity: 'common',
        isBase: true
      }
    ],
    characterType: 'player',
    difficulty: 'normal',
    tags: ['魔术', '咒歌', '结界'],
    isActive: true
  },
  {
    characterId: 'locked_winter',
    name: '雪之結晶',
    title: '雪之結晶',
    season: '冬',
    number: 'H O 4',
    subtitle: 'SNOW CRYSTAL',
    label: 'Crystal',
    backgroundImage: '/storyImage/haruka1_Alpha_position.png',
    hoverGradient: 'linear-gradient(168deg, rgba(238, 242, 247, 0.7) 0%, rgba(229, 233, 242, 0.6) 50%, rgba(201, 206, 221, 0.5) 100%)',
    decorationType: 'type2',
    unlocked: false,
    index: 3,
    commandImage: '/storyImage/command1.png',
    overlayColor: 'rgba(200, 220, 255, 1)',
    overlayDarkColor: 'rgba(50, 80, 120, 0.3)',
    overlayBackgroundImage: '/storyImage/harukaBG.png',
    intro: '尚未解锁的数据...',
    desc: '未知角色',
    displayStats: {
      Strength: 0,
      Endurance: 0,
      Agility: 0,
      Mana: 0
    },
    battleStats: {
      maxHp: 100,
      maxMp: 100,
      attack: 50,
      defense: 50,
      magic: 50,
      agility: 50,
      resistance: 50
    },
    cardSkills: [],
    baseSkills: [],
    characterType: 'neutral',
    difficulty: 'normal',
    isActive: true
  },
  {
    characterId: 'locked_dawn',
    name: '暁之光',
    title: '暁之光',
    season: '暁',
    number: 'H O 5',
    subtitle: 'DAWN LIGHT',
    label: 'Dawn',
    backgroundImage: '/storyImage/haruka1_Alpha_position.png',
    hoverGradient: 'linear-gradient(168deg, rgba(238, 247, 242, 0.7) 0%, rgba(229, 242, 233, 0.6) 50%, rgba(201, 220, 207, 0.5) 100%)',
    decorationType: 'type1',
    unlocked: false,
    index: 4,
    commandImage: '/storyImage/command1.png',
    overlayColor: 'rgba(255, 220, 150, 0.4)',
    overlayDarkColor: 'rgba(50, 80, 120, 0.3)',
    overlayBackgroundImage: '/storyImage/harukaBG.png',
    intro: '',
    desc: '未知角色',
    displayStats: {},
    battleStats: {},
    cardSkills: [],
    baseSkills: [],
    characterType: 'neutral',
    difficulty: 'normal',
    isActive: true
  },
  {
    characterId: 'locked_twilight',
    name: '黄昏之影',
    title: '黄昏之影',
    season: '暮',
    number: 'H O 6',
    subtitle: 'TWILIGHT SHADOW',
    label: 'Twilight',
    backgroundImage: '/storyImage/haruka1_Alpha_position.png',
    hoverGradient: 'linear-gradient(168deg, rgba(252, 247, 238, 0.7) 0%, rgba(249, 242, 229, 0.6) 50%, rgba(235, 222, 201, 0.5) 100%)',
    decorationType: 'type2',
    unlocked: false,
    index: 5,
    commandImage: '/storyImage/command2.png',
    overlayColor: 'rgba(255, 180, 140, 0.4)',
    overlayDarkColor: 'rgba(50, 80, 120, 0.3)',
    overlayBackgroundImage: '/storyImage/harukaBG.png',
    intro: '',
    desc: '未知角色',
    displayStats: {},
    battleStats: {},
    cardSkills: [],
    baseSkills: [],
    characterType: 'neutral',
    difficulty: 'normal',
    isActive: true
  },
  {
    characterId: 'locked_moon',
    name: '月夜幻想',
    title: '月夜幻想',
    season: '夜',
    number: 'H O 7',
    subtitle: 'MOON FANTASY',
    label: 'Fantasy',
    backgroundImage: '/storyImage/haruka1_Alpha_position.png',
    hoverGradient: 'linear-gradient(168deg, rgba(245, 238, 245, 0.7) 0%, rgba(239, 229, 239, 0.6) 50%, rgba(217, 202, 217, 0.5) 100%)',
    decorationType: 'type1',
    unlocked: false,
    index: 6,
    commandImage: '/storyImage/command2.png',
    overlayColor: 'rgba(180, 160, 220, 0.4)',
    overlayDarkColor: 'rgba(50, 80, 120, 0.3)',
    overlayBackgroundImage: '/storyImage/harukaBG.png',
    intro: '',
    desc: '未知角色',
    displayStats: {},
    battleStats: {},
    cardSkills: [],
    baseSkills: [],
    characterType: 'neutral',
    difficulty: 'normal',
    isActive: true
  }
];

/**
 * 初始化角色卡片数据
 */
async function initCharacterCards() {
  try {
    console.log('\n📇 正在初始化角色卡片数据...');
    
    // 检查是否已存在数据
    const existingCount = await Character.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  数据库中已存在 ${existingCount} 个角色`);
      console.log('🔄 检查并更新现有数据...');
      
      let createdCount = 0;
      let updatedCount = 0;
      
      for (const cardData of defaultCharacterCards) {
        const existingCard = await Character.findOne({
          characterId: cardData.characterId
        });
        
        if (existingCard) {
          // 更新现有卡片，保留原有数据，只更新缺失字段
          const updates = {};
          Object.keys(cardData).forEach(key => {
            if (!existingCard[key] || 
                (Array.isArray(existingCard[key]) && existingCard[key].length === 0) ||
                (typeof existingCard[key] === 'object' && Object.keys(existingCard[key]).length === 0)) {
              updates[key] = cardData[key];
            }
          });
          
          if (Object.keys(updates).length > 0) {
            Object.assign(existingCard, updates);
            existingCard.metadata = existingCard.metadata || {};
            existingCard.metadata.updatedAt = new Date();
            await existingCard.save();
            updatedCount++;
          }
        } else {
          // 创建新卡片
          const card = new Character(cardData);
          await card.save();
          createdCount++;
        }
      }
      
      console.log(`✅ 已创建 ${createdCount} 个新角色`);
      console.log(`✅ 已更新 ${updatedCount} 个现有角色`);
    } else {
      console.log('📝 创建默认角色...');
      
      // 批量创建卡片
      const cards = await Character.insertMany(defaultCharacterCards);
      console.log(`✅ 成功创建 ${cards.length} 个角色`);
    }
    
    // 显示统计信息
    const totalCount = await Character.countDocuments();
    const unlockedCount = await Character.countDocuments({ unlocked: true });
    const lockedCount = await Character.countDocuments({ unlocked: false });
    const playerCount = await Character.countDocuments({ characterType: 'player' });
    const enemyCount = await Character.countDocuments({ characterType: 'enemy' });
    
    console.log('\n   📊 角色统计:');
    console.log(`      - 总角色数: ${totalCount}`);
    console.log(`      - 已解锁: ${unlockedCount}`);
    console.log(`      - 未解锁: ${lockedCount}`);
    console.log(`      - 玩家角色: ${playerCount}`);
    console.log(`      - 敌方角色: ${enemyCount}`);
    
    // 显示每个角色信息
    const allCards = await Character.find().sort({ index: 1 });
    console.log('\n   📋 角色列表:');
    allCards.forEach((card, idx) => {
      const typeIcon = card.characterType === 'player' ? '🎮' : (card.characterType === 'enemy' ? '👹' : '❓');
      console.log(`      ${idx + 1}. [${card.unlocked ? '✓' : '✗'}] ${typeIcon} ${card.season || '-'} - ${card.name} (${card.characterId})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ 初始化角色卡片失败:', error);
    throw error;
  }
}

/**
 * 创建索引
 */
async function createIndexes() {
  try {
    console.log('\n📇 创建索引...');
    
    const collection = mongoose.connection.db.collection('characters');
    
    // characterId 索引
    try {
      await collection.createIndex({ characterId: 1 }, {
        name: 'characterId_1',
        unique: true,
        background: true
      });
      console.log('   ✅ characterId 索引已创建');
    } catch (err) {
      if (err.code !== 85) {
        console.log('   ⚠️  characterId 索引可能已存在或创建失败');
      }
    }
    
    // index 索引
    try {
      await collection.createIndex({ index: 1 }, {
        name: 'index_1',
        background: true
      });
      console.log('   ✅ index 索引已创建');
    } catch (err) {
      if (err.code !== 85) {
        console.log('   ⚠️  index 索引可能已存在或创建失败');
      }
    }
    
    // unlocked + index 复合索引
    try {
      await collection.createIndex({ unlocked: 1, index: 1 }, {
        name: 'unlocked_1_index_1',
        background: true
      });
      console.log('   ✅ unlocked + index 复合索引已创建');
    } catch (err) {
      if (err.code !== 85) {
        console.log('   ⚠️  unlocked + index 索引可能已存在或创建失败');
      }
    }
    
    // characterType + isActive 复合索引
    try {
      await collection.createIndex({ characterType: 1, isActive: 1 }, {
        name: 'characterType_1_isActive_1',
        background: true
      });
      console.log('   ✅ characterType + isActive 复合索引已创建');
    } catch (err) {
      if (err.code !== 85) {
        console.log('   ⚠️  characterType + isActive 索引可能已存在或创建失败');
      }
    }
    
    // season + number 复合索引
    try {
      await collection.createIndex({ season: 1, number: 1 }, {
        name: 'season_1_number_1',
        background: true
      });
      console.log('   ✅ season + number 复合索引已创建');
    } catch (err) {
      if (err.code !== 85) {
        console.log('   ⚠️  season + number 索引可能已存在或创建失败');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ 创建索引失败:', error);
    throw error;
  }
}

/**
 * 验证数据结构
 */
async function validateDataStructure() {
  try {
    console.log('\n🔍 验证数据结构...');
    
    // 验证卡片数据完整性
    const cards = await Character.find().sort({ index: 1 });
    
    if (cards.length === 0) {
      throw new Error('没有找到任何角色数据');
    }
    
    console.log(`   ✅ 找到 ${cards.length} 个角色`);
    
    // 验证必填字段
    const requiredFields = ['characterId', 'name'];
    let validationPassed = true;
    
    for (const card of cards) {
      for (const field of requiredFields) {
        if (!card[field]) {
          console.warn(`   ⚠️  角色 ${card.characterId || card._id} 缺少必填字段: ${field}`);
          validationPassed = false;
        }
      }
    }
    
    if (validationPassed) {
      console.log('   ✅ 必填字段验证通过');
    }
    
    // 验证 characterId 唯一性
    const characterIds = cards.map(c => c.characterId);
    const uniqueIds = new Set(characterIds);
    if (characterIds.length !== uniqueIds.size) {
      console.warn('   ⚠️  存在重复的 characterId 值');
    } else {
      console.log('   ✅ characterId 唯一性验证通过');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 数据验证失败:', error);
    throw error;
  }
}

/**
 * 主初始化函数
 */
async function initCharacterCardsDatabase() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 统一角色数据库初始化开始');
    console.log('='.repeat(60));
    
    // 连接 MongoDB
    const connected = await connectMongoDB();
    if (!connected) {
      throw new Error('MongoDB 连接失败');
    }
    
    console.log(`📂 数据库: ${mongoose.connection.name}`);
    
    // 1. 初始化卡片数据
    await initCharacterCards();
    
    // 2. 创建索引
    await createIndexes();
    
    // 3. 验证数据结构
    await validateDataStructure();
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ 统一角色数据库初始化完成！');
    console.log('='.repeat(60));
    
    console.log('\n📡 相关 API 端点:');
    console.log('   GET  /api/mongo/character-cards - 获取所有卡片');
    console.log('   GET  /api/mongo/character-cards/:id - 根据ID获取卡片');
    console.log('   GET  /api/mongo/character-cards/index/:index - 根据索引获取卡片');
    console.log('   POST /api/mongo/character-cards - 创建新卡片');
    console.log('   POST /api/mongo/character-cards/batch - 批量创建卡片');
    console.log('   PUT  /api/mongo/character-cards/:id - 更新卡片');
    console.log('   DELETE /api/mongo/character-cards/:id - 删除卡片');
    console.log('   PATCH /api/mongo/character-cards/:id/unlock - 更新解锁状态');
    console.log('\n   GET  /api/battle-simulator/characters - 获取战斗角色列表');
    console.log('   POST /api/battle-simulator/init - 初始化战斗');
    console.log('   POST /api/battle-simulator/turn - 执行战斗回合');
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行初始化
if (require.main === module) {
  initCharacterCardsDatabase();
}

module.exports = initCharacterCardsDatabase;

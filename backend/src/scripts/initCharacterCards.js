const { connectMongoDB, mongoose } = require('../config/mongodb');
const CharacterCard = require('../schemas/characterCardSchema');

/**
 * Character Cards 数据库初始化脚本
 * 
 * 功能：
 * 1. 初始化角色卡片数据（characterCards 集合）
 * 2. 创建必要的索引
 * 3. 验证数据结构
 */

// 默认角色卡片数据
const defaultCharacterCards = [
  {
    season: 'Saber',
    number: 'H O 1',
    title: '白鳥 瑤',
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
    stats: {
      Strength: 80,
      Endurance: 90,
      Agility: 60,
      Mana: 40
    },
    skills: [
      { name: '皎月剑舞 (A)', desc: '提升自身 Arts 卡性能 (3回合)' },
      { name: '绝对信任 (B+)', desc: '赋予己方单体无敌状态 (1回合)' }
    ]
  },
  {
    season: 'Archer',
    number: 'H O 2',
    title: '天宮院 菲娜',
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
    stats: {
      Strength: 60,
      Endurance: 40,
      Agility: 90,
      Mana: 75
    },
    skills: [
      { name: '千里眼 (C+)', desc: '提升自身的暴击星掉落率' },
      { name: '赤红之月 (A)', desc: '赋予自身回避状态 & 攻击力提升' }
    ]
  },
  {
    season: 'Caster',
    number: 'H O 3',
    title: '神代 琉璃',
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
    stats: {
      Strength: 30,
      Endurance: 50,
      Agility: 40,
      Mana: 100
    },
    skills: [
      { name: '阵地建造 (Ex)', desc: '提升自身的 Arts 卡性能' },
      { name: '高速神言 (A)', desc: '大幅增加 NP 充能' }
    ]
  },
  {
    season: '冬',
    number: 'H O 4',
    title: '雪之結晶',
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
    stats: {
      Strength: 0,
      Endurance: 0,
      Agility: 0,
      Mana: 0
    },
    skills: []
  },
  {
    season: '暁',
    number: 'H O 5',
    title: '暁之光',
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
    stats: {},
    skills: []
  },
  {
    season: '暮',
    number: 'H O 6',
    title: '黄昏之影',
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
    stats: {},
    skills: []
  },
  {
    season: '夜',
    number: 'H O 7',
    title: '月夜幻想',
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
    stats: {},
    skills: []
  }
];

/**
 * 初始化角色卡片数据
 */
async function initCharacterCards() {
  try {
    console.log('\n📇 正在初始化角色卡片数据...');
    
    // 检查是否已存在数据
    const existingCount = await CharacterCard.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  数据库中已存在 ${existingCount} 张角色卡片`);
      console.log('🔄 检查并更新现有数据...');
      
      // 更新或创建每张卡片
      let createdCount = 0;
      let updatedCount = 0;
      
      for (const cardData of defaultCharacterCards) {
        const existingCard = await CharacterCard.findOne({
          season: cardData.season,
          number: cardData.number
        });
        
        if (existingCard) {
          // 更新现有卡片，保留原有数据，只更新缺失字段
          const updates = {};
          Object.keys(cardData).forEach(key => {
            if (!existingCard[key] || (Array.isArray(existingCard[key]) && existingCard[key].length === 0)) {
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
          const card = new CharacterCard(cardData);
          await card.save();
          createdCount++;
        }
      }
      
      console.log(`✅ 已创建 ${createdCount} 张新卡片`);
      console.log(`✅ 已更新 ${updatedCount} 张现有卡片`);
    } else {
      console.log('📝 创建默认角色卡片...');
      
      // 批量创建卡片
      const cards = await CharacterCard.insertMany(defaultCharacterCards);
      console.log(`✅ 成功创建 ${cards.length} 张角色卡片`);
    }
    
    // 显示统计信息
    const totalCount = await CharacterCard.countDocuments();
    const unlockedCount = await CharacterCard.countDocuments({ unlocked: true });
    const lockedCount = await CharacterCard.countDocuments({ unlocked: false });
    
    console.log('\n   📊 卡片统计:');
    console.log(`      - 总卡片数: ${totalCount}`);
    console.log(`      - 已解锁: ${unlockedCount}`);
    console.log(`      - 未解锁: ${lockedCount}`);
    
    // 显示每张卡片信息
    const allCards = await CharacterCard.find().sort({ index: 1 });
    console.log('\n   📋 卡片列表:');
    allCards.forEach((card, idx) => {
      console.log(`      ${idx + 1}. [${card.unlocked ? '✓' : '✗'}] ${card.season} - ${card.title} (${card.number})`);
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
    
    const collection = mongoose.connection.db.collection('characterCards');
    
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
    const cards = await CharacterCard.find().sort({ index: 1 });
    
    if (cards.length === 0) {
      throw new Error('没有找到任何卡片数据');
    }
    
    console.log(`   ✅ 找到 ${cards.length} 张卡片`);
    
    // 验证必填字段
    const requiredFields = ['season', 'number', 'title', 'subtitle', 'label', 'backgroundImage', 'hoverGradient'];
    let validationPassed = true;
    
    for (const card of cards) {
      for (const field of requiredFields) {
        if (!card[field]) {
          console.warn(`   ⚠️  卡片 ${card.season} - ${card.number} 缺少必填字段: ${field}`);
          validationPassed = false;
        }
      }
    }
    
    if (validationPassed) {
      console.log('   ✅ 必填字段验证通过');
    }
    
    // 验证索引唯一性
    const indexes = cards.map(c => c.index);
    const uniqueIndexes = new Set(indexes);
    if (indexes.length !== uniqueIndexes.size) {
      console.warn('   ⚠️  存在重复的索引值');
    } else {
      console.log('   ✅ 索引唯一性验证通过');
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
    console.log('🚀 Character Cards 数据库初始化开始');
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
    console.log('✨ Character Cards 数据库初始化完成！');
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




const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../../config');
const Character = require('../schemas/unifiedCharacterSchema');

// 连接MongoDB
async function connectDB() {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('✅ MongoDB 连接成功');
    return true;
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    return false;
  }
}

// 读取角色JSON文件
function loadCharacterFile(filePath) {
  try {
    const fullPath = path.resolve(__dirname, '../../../', filePath);
    console.log(`📖 读取文件: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`文件不存在: ${fullPath}`);
    }
    
    let fileContent = fs.readFileSync(fullPath, 'utf-8');
    
    // 移除 BOM (Byte Order Mark) 字符
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1);
    }
    
    const data = JSON.parse(fileContent);
    
    console.log(`✅ 成功解析: ${data.name || data.id}`);
    return data;
  } catch (error) {
    console.error(`❌ 读取文件失败 (${filePath}):`, error.message);
    return null;
  }
}

// 推断技能类型
function inferSkillType(originalType) {
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
}

// 转换JSON数据为统一格式
function transformCharacterData(jsonData, characterType = 'enemy') {
  // 验证必要字段
  if (!jsonData.id || !jsonData.name || !jsonData.desc || !jsonData.moves) {
    throw new Error('缺少必要字段: id, name, desc, moves');
  }

  // 确定难度等级
  let difficulty = 'normal';
  if (jsonData.desc.includes('meme') || jsonData.desc.includes('恶搞') || jsonData.desc.includes('降智')) {
    difficulty = 'meme';
  } else if (jsonData.desc.includes('Boss') || jsonData.desc.includes('终极')) {
    difficulty = 'insane';
  } else if (jsonData.desc.includes('强大') || jsonData.desc.includes('传说')) {
    difficulty = 'hard';
  }

  // 提取标签
  const tags = [];
  if (jsonData.desc.includes('冰')) tags.push('冰系');
  if (jsonData.desc.includes('光')) tags.push('光系');
  if (jsonData.desc.includes('恶搞')) tags.push('搞笑');
  if (jsonData.desc.includes('因果')) tags.push('因果系');
  if (jsonData.desc.includes('精神')) tags.push('精神系');
  if (jsonData.desc.includes('物理')) tags.push('物理系');
  if (jsonData.name.includes('燕双鹰')) tags.push('神剧');
  if (jsonData.name.includes('勇者')) tags.push('反英雄');

  // 转换 moves 到 baseSkills
  const baseSkills = jsonData.moves.map(move => ({
    id: move.id,
    name: move.name,
    type: inferSkillType(move.type),
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
    synergyWith: []
  }));

  // 生成卡片展示用的简化技能
  const cardSkills = jsonData.moves.slice(0, 2).map(move => ({
    name: move.name,
    desc: move.effect.substring(0, 50) + (move.effect.length > 50 ? '...' : '')
  }));

  return {
    characterId: jsonData.id,
    name: jsonData.name,
    title: jsonData.name,
    subtitle: jsonData.id.toUpperCase(),
    label: characterType === 'enemy' ? 'Enemy' : 'Ally',
    desc: jsonData.desc,
    intro: jsonData.desc,
    imageUrl: jsonData.imageUrl || null,
    backgroundImage: jsonData.imageUrl || '',
    personality: jsonData.personality || jsonData.desc,
    magicStyle: jsonData.magicStyle || '见招式库',
    displayStats: {
      Strength: 50,
      Endurance: 50,
      Agility: 50,
      Mana: 50
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
    baseSkills: baseSkills,
    cardSkills: cardSkills,
    moves: jsonData.moves, // 保留原始 moves 以兼容
    characterType: characterType,
    isActive: true,
    tags: tags,
    difficulty: difficulty,
    unlocked: characterType === 'player',
    index: 100 + Math.floor(Math.random() * 900) // 敌人索引从100开始
  };
}

// 插入或更新角色数据
async function upsertCharacter(characterData) {
  try {
    const existing = await Character.findOne({ characterId: characterData.characterId });
    
    if (existing) {
      console.log(`🔄 更新现有角色: ${characterData.name} (${characterData.characterId})`);
      await Character.updateOne(
        { characterId: characterData.characterId },
        { $set: characterData }
      );
      console.log(`✅ 更新成功`);
    } else {
      console.log(`➕ 创建新角色: ${characterData.name} (${characterData.characterId})`);
      await Character.create(characterData);
      console.log(`✅ 创建成功`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ 保存角色失败 (${characterData.name}):`, error.message);
    return false;
  }
}

// 初始化内置角色
async function initBuiltInCharacters() {
  console.log('\n📦 初始化内置敌方角色...\n');
  
  const builtInCharacters = [
    {
      characterId: 'HimuroRinne',
      name: '氷室 凛音 (Himuro Rinne)',
      title: '氷室 凛音',
      subtitle: 'HIMURO RINNE',
      label: 'Ice Queen',
      season: 'Enemy',
      number: 'E-01',
      desc: '私立樱羽学园学生会副会长，操纵冰结律法的冷酷大小姐。',
      intro: '"秩序即是正义，混乱必须被冻结。<br>在我的极寒律法之下，没有例外。"',
      imageUrl: './web-project/public/栩.jpg',
      backgroundImage: '/storyImage/enemy_ice.png',
      personality: '1. 像冰晶般纯粹而坚硬，在规则与秩序中寻求极致的正确。\n2. 说话言简意赅，如冰棱般锐利，总能一针见血指出逻辑谬误。\n3. 对"失序"和"暧昧"有近乎洁癖的排斥。\n4. 内心深处有极致的脆弱，渴望有人能理解她严苛背后的善意。',
      magicStyle: '1. 核心概念：冰结律法 (Frozen Ordinance)。不仅是冰冻，而是将"秩序"具现化，将"混沌"强制凝固。\n2. 擅长使用"极寒之戒"作为媒介，施加无法抗拒的束缚与凝固。\n3. 战斗风格：静态、压倒性、强制力。不进行野蛮的肉搏，而是优雅地降下裁决。',
      displayStats: {
        Strength: 70,
        Endurance: 85,
        Agility: 50,
        Mana: 95
      },
      battleStats: {
        maxHp: 130,
        maxMp: 120,
        attack: 55,
        defense: 70,
        magic: 85,
        agility: 45,
        resistance: 80
      },
      cardSkills: [
        { name: '冰结律法', desc: '将混沌凝固，强制施加秩序的极寒魔术' },
        { name: '永恒冰狱', desc: '将目标的存在本身封冻在虚无的时间点' }
      ],
      baseSkills: [
        {
          id: 'ice_lance_1',
          name: '氷结断罪・一之枪',
          type: 'attack',
          power: 70,
          cost: 12,
          accuracy: 90,
          description: '凝聚大气水分形成亚音速射出的高压冰之弹头，追求极致的单点物理贯穿力。',
          flavorText: 'Glacies iustitiae, transfige!',
          flavorTextTranslation: '正义之冰，贯穿！',
          effects: [{ type: 'damage', value: 70, target: 'enemy' }],
          conditions: [],
          rarity: 'common',
          isBase: true
        },
        {
          id: 'law_rain',
          name: '法则之雨・冰晶连射',
          type: 'attack',
          power: 45,
          cost: 18,
          accuracy: 80,
          description: '如暴雨般降下数百枚手术刀般的微小冰晶，进行大范围覆盖或单点凌迟。',
          flavorText: 'Pluvia legis, descende!',
          flavorTextTranslation: '法则之雨，降临！',
          effects: [{ type: 'damage', value: 45, target: 'enemy' }],
          conditions: [],
          rarity: 'common',
          isBase: true
        },
        {
          id: 'snowflake_shield',
          name: '秩序之壁・六花之盾',
          type: 'defense',
          power: 50,
          cost: 15,
          accuracy: 95,
          description: '制造三面雪花结晶冰盾。破碎瞬间会爆散成追踪冰片反击攻击者。',
          flavorText: 'Clipeus nivis, protege et ulciscere!',
          flavorTextTranslation: '雪之盾，守护与复仇！',
          effects: [
            { type: 'defense', value: 50, duration: 1, target: 'self' },
            { type: 'damage', value: 20, target: 'enemy' }
          ],
          conditions: [],
          rarity: 'rare',
          isBase: true
        },
        {
          id: 'frozen_ordinance',
          name: '冰结律法・概念冻结',
          type: 'seal',
          power: 60,
          cost: 25,
          accuracy: 75,
          description: '暂时冻结目标某个简单的\'概念\'（如平衡感），使其思维或行动产生逻辑断层。',
          flavorText: 'Lex glacialis, congela conceptum!',
          flavorTextTranslation: '冰之律法，冻结概念！',
          effects: [{ type: 'seal', value: 'random_skill', duration: 2, target: 'enemy' }],
          conditions: [{ type: 'mp_above', value: 25, target: 'self' }],
          rarity: 'epic',
          isBase: true
        },
        {
          id: 'eternal_ice_prison',
          name: '秘奥义・永恒冰狱',
          type: 'attack',
          power: 100,
          cost: 40,
          accuracy: 70,
          description: '强制修改局部法则，将目标的\'存在\'本身封冻在虚无的时间点中。',
          flavorText: 'Carcer aeternus glaciei, in nihilum congela!',
          flavorTextTranslation: '永恒冰狱，冻结于虚无！',
          effects: [
            { type: 'damage', value: 100, target: 'enemy' },
            { type: 'seal', value: 'all', duration: 1, target: 'enemy' }
          ],
          conditions: [
            { type: 'mp_above', value: 40, target: 'self' },
            { type: 'hp_below', value: 50, target: 'self' }
          ],
          rarity: 'legendary',
          isBase: true
        }
      ],
      characterType: 'enemy',
      isActive: true,
      tags: ['冰系', '秩序', '法则', 'Boss'],
      difficulty: 'hard',
      unlocked: true,
      index: 100
    }
  ];

  let successCount = 0;
  for (const character of builtInCharacters) {
    const success = await upsertCharacter(character);
    if (success) successCount++;
  }

  console.log(`\n✅ 内置角色初始化完成: ${successCount}/${builtInCharacters.length}\n`);
}

// 初始化外部JSON文件中的角色
async function initExternalCharacters() {
  console.log('\n📂 初始化外部JSON文件中的角色...\n');
  
  const characterFiles = [
    { path: 'yan_shuang_ying_boss.json', type: 'enemy' },
    { path: 'yongzhe_ma.json', type: 'enemy' },
    { path: 'HeroQiYaoYao.json', type: 'enemy' }
  ];

  let successCount = 0;
  
  for (const fileInfo of characterFiles) {
    const jsonData = loadCharacterFile(fileInfo.path);
    if (!jsonData) {
      console.log(`⏩ 跳过: ${fileInfo.path}\n`);
      continue;
    }

    try {
      const characterData = transformCharacterData(jsonData, fileInfo.type);
      const success = await upsertCharacter(characterData);
      if (success) successCount++;
    } catch (error) {
      console.error(`❌ 转换数据失败 (${fileInfo.path}):`, error.message);
    }
    
    console.log('');
  }

  console.log(`✅ 外部角色初始化完成: ${successCount}/${characterFiles.length}\n`);
}

// 显示所有角色列表
async function displayCharacters() {
  console.log('\n📋 当前数据库中的角色列表:\n');
  console.log('='.repeat(80));
  
  const characters = await Character.find().sort({ characterType: 1, index: 1 });
  
  if (characters.length === 0) {
    console.log('（无角色数据）');
  } else {
    for (const char of characters) {
      const typeIcon = char.characterType === 'player' ? '🎮' : (char.characterType === 'enemy' ? '👹' : '❓');
      console.log(`\n${typeIcon} 【${char.characterType.toUpperCase()}】 ${char.name}`);
      console.log(`  ID: ${char.characterId}`);
      console.log(`  难度: ${char.difficulty}`);
      console.log(`  标签: ${char.tags.join(', ') || '无'}`);
      console.log(`  战斗技能数量: ${char.baseSkills?.length || 0}`);
      console.log(`  状态: ${char.isActive ? '✅ 激活' : '❌ 未激活'} | 解锁: ${char.unlocked ? '✅' : '❌'}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n总计: ${characters.length} 个角色\n`);
}

// 主函数
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('⚔️  战斗角色数据库初始化脚本（统一Schema版）');
  console.log('='.repeat(80) + '\n');

  // 连接数据库
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ 无法连接数据库，初始化终止');
    process.exit(1);
  }

  try {
    // 1. 初始化内置角色
    await initBuiltInCharacters();

    // 2. 初始化外部JSON文件中的角色
    await initExternalCharacters();

    // 3. 显示所有角色
    await displayCharacters();

    console.log('🎉 所有角色初始化完成！\n');
  } catch (error) {
    console.error('❌ 初始化过程中发生错误:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('👋 数据库连接已关闭\n');
  }
}

// 执行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});

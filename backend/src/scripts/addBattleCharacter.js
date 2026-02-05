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

// 读取JSON文件
function readJsonFile(filePath) {
  try {
    let fullPath = filePath;
    
    if (!path.isAbsolute(filePath)) {
      fullPath = path.resolve(__dirname, '../../../', filePath);
    }
    
    console.log(`📖 读取文件: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`文件不存在: ${fullPath}`);
    }
    
    let fileContent = fs.readFileSync(fullPath, 'utf-8');
    
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1);
    }
    
    const data = JSON.parse(fileContent);
    
    console.log(`✅ 成功解析: ${data.name || data.id || '未知角色'}`);
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`文件不存在: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`JSON 格式错误: ${error.message}`);
    } else {
      throw error;
    }
  }
}

// 验证JSON数据
function validateCharacterData(data) {
  const errors = [];
  
  if (!data.id) errors.push('缺少字段: id');
  if (!data.name) errors.push('缺少字段: name');
  if (!data.desc) errors.push('缺少字段: desc');
  if (!data.moves || !Array.isArray(data.moves)) {
    errors.push('缺少字段: moves (必须是数组)');
  } else if (data.moves.length === 0) {
    errors.push('moves 数组不能为空');
  }
  
  if (data.moves && Array.isArray(data.moves)) {
    data.moves.forEach((move, index) => {
      if (!move.id) errors.push(`招式 ${index + 1}: 缺少 id`);
      if (!move.name) errors.push(`招式 ${index + 1}: 缺少 name`);
      if (!move.type) errors.push(`招式 ${index + 1}: 缺少 type`);
      if (!move.effect) errors.push(`招式 ${index + 1}: 缺少 effect`);
      if (!move.restriction) errors.push(`招式 ${index + 1}: 缺少 restriction`);
    });
  }
  
  return errors;
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
function transformCharacterData(jsonData, options = {}) {
  const {
    characterType = 'enemy',
    difficulty = null,
    tags = [],
    isActive = true
  } = options;
  
  // 自动判断难度等级
  let autoDifficulty = difficulty || 'normal';
  if (!difficulty) {
    const desc = jsonData.desc.toLowerCase();
    
    if (desc.includes('meme') || desc.includes('恶搞') || desc.includes('降智') || desc.includes('搞笑')) {
      autoDifficulty = 'meme';
    } else if (desc.includes('boss') || desc.includes('终极') || desc.includes('传说')) {
      autoDifficulty = 'insane';
    } else if (desc.includes('强大') || desc.includes('精英')) {
      autoDifficulty = 'hard';
    } else if (desc.includes('简单') || desc.includes('新手')) {
      autoDifficulty = 'easy';
    }
  }
  
  // 自动提取标签
  const autoTags = [...tags];
  const desc = jsonData.desc;
  const magicStyle = jsonData.magicStyle || '';
  
  if (desc.includes('冰') || magicStyle.includes('冰')) autoTags.push('冰系');
  if (desc.includes('火') || magicStyle.includes('火')) autoTags.push('火系');
  if (desc.includes('光') || magicStyle.includes('光')) autoTags.push('光系');
  if (desc.includes('暗') || magicStyle.includes('暗')) autoTags.push('暗系');
  if (desc.includes('雷') || magicStyle.includes('雷')) autoTags.push('雷系');
  if (desc.includes('风') || magicStyle.includes('风')) autoTags.push('风系');
  if (desc.includes('水') || magicStyle.includes('水')) autoTags.push('水系');
  if (desc.includes('土') || magicStyle.includes('土')) autoTags.push('土系');
  
  if (desc.includes('恶搞') || desc.includes('搞笑')) autoTags.push('搞笑');
  if (desc.includes('因果')) autoTags.push('因果系');
  if (desc.includes('精神') || desc.includes('心理')) autoTags.push('精神系');
  if (desc.includes('物理') || desc.includes('格斗')) autoTags.push('物理系');
  if (desc.includes('魔法') || desc.includes('魔术')) autoTags.push('魔法系');
  if (jsonData.name.includes('燕双鹰')) autoTags.push('神剧');
  if (desc.includes('勇者') || jsonData.name.includes('勇者')) autoTags.push('反英雄');
  
  const uniqueTags = [...new Set(autoTags)];
  
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
    season: characterType === 'enemy' ? 'Enemy' : 'Ally',
    number: `C-${Date.now().toString().slice(-4)}`,
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
    isActive: isActive,
    tags: uniqueTags,
    difficulty: autoDifficulty,
    unlocked: characterType === 'player',
    index: 100 + Math.floor(Math.random() * 900)
  };
}

// 插入或更新角色数据
async function upsertCharacter(characterData, forceUpdate = false) {
  try {
    const existing = await Character.findOne({ characterId: characterData.characterId });
    
    if (existing) {
      if (forceUpdate) {
        console.log(`🔄 更新现有角色: ${characterData.name} (${characterData.characterId})`);
        await Character.updateOne(
          { characterId: characterData.characterId },
          { $set: characterData }
        );
        console.log(`✅ 更新成功`);
        return { action: 'updated', character: characterData };
      } else {
        console.log(`⚠️  角色已存在: ${characterData.name} (${characterData.characterId})`);
        console.log(`   使用 --force 参数强制更新`);
        return { action: 'skipped', character: existing };
      }
    } else {
      console.log(`➕ 创建新角色: ${characterData.name} (${characterData.characterId})`);
      const newCharacter = await Character.create(characterData);
      console.log(`✅ 创建成功`);
      return { action: 'created', character: newCharacter };
    }
  } catch (error) {
    console.error(`❌ 保存角色失败:`, error.message);
    throw error;
  }
}

// 显示角色信息
function displayCharacterInfo(character) {
  const typeIcon = character.characterType === 'player' ? '🎮' : (character.characterType === 'enemy' ? '👹' : '❓');
  
  console.log('\n' + '='.repeat(80));
  console.log(`${typeIcon} 角色信息`);
  console.log('='.repeat(80));
  console.log(`ID:           ${character.characterId}`);
  console.log(`名称:         ${character.name}`);
  console.log(`类型:         ${character.characterType}`);
  console.log(`难度:         ${character.difficulty}`);
  console.log(`标签:         ${character.tags?.join(', ') || '无'}`);
  console.log(`战斗技能数:   ${character.baseSkills?.length || 0}`);
  console.log(`状态:         ${character.isActive ? '✅ 激活' : '❌ 未激活'} | 解锁: ${character.unlocked ? '✅' : '❌'}`);
  console.log(`描述:         ${character.desc?.substring(0, 60)}${(character.desc?.length || 0) > 60 ? '...' : ''}`);
  
  if (character.baseSkills && character.baseSkills.length > 0) {
    console.log('\n战斗技能列表:');
    character.baseSkills.forEach((skill, index) => {
      console.log(`  ${index + 1}. [${skill.type}] ${skill.name} (威力:${skill.power} 消耗:${skill.cost})`);
    });
  }
  console.log('='.repeat(80) + '\n');
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  
  const options = {
    files: [],
    characterType: 'enemy',
    difficulty: null,
    tags: [],
    isActive: true,
    force: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--type' || arg === '-t') {
      options.characterType = args[++i];
    } else if (arg === '--difficulty' || arg === '-d') {
      options.difficulty = args[++i];
    } else if (arg === '--tags') {
      options.tags = args[++i].split(',').map(t => t.trim());
    } else if (arg === '--inactive') {
      options.isActive = false;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (!arg.startsWith('--')) {
      options.files.push(arg);
    }
  }
  
  return options;
}

// 显示帮助信息
function showHelp() {
  console.log(`
⚔️  战斗角色导入脚本（统一Schema版）

用法:
  node addBattleCharacter.js <文件路径> [选项]

参数:
  <文件路径>              一个或多个JSON文件路径（必需）

选项:
  --type, -t <类型>       角色类型 (enemy/player/neutral)
                          默认: enemy
  
  --difficulty, -d <难度> 难度等级 (easy/normal/hard/insane/meme)
                          默认: 自动判断
  
  --tags <标签>           逗号分隔的标签列表
                          示例: --tags "冰系,Boss,精英"
  
  --inactive              设置角色为未激活状态
                          默认: 激活
  
  --force, -f             强制更新已存在的角色
                          默认: 跳过已存在的角色
  
  --help, -h              显示此帮助信息

示例:
  # 导入单个角色
  node addBattleCharacter.js yan_shuang_ying_boss.json

  # 导入多个角色
  node addBattleCharacter.js file1.json file2.json file3.json

  # 指定角色类型和难度
  node addBattleCharacter.js custom_boss.json --type enemy --difficulty insane

  # 添加标签
  node addBattleCharacter.js character.json --tags "冰系,Boss,精英"

  # 强制更新已存在的角色
  node addBattleCharacter.js character.json --force

  # 设置为未激活
  node addBattleCharacter.js character.json --inactive

JSON文件格式:
  {
    "id": "CharacterId",
    "name": "角色名称",
    "desc": "角色描述",
    "imageUrl": "图片URL（可选）",
    "personality": "性格描述（可选）",
    "magicStyle": "战斗风格（可选）",
    "moves": [
      {
        "id": "move_id",
        "name": "招式名称",
        "type": "招式类型",
        "effect": "招式效果",
        "restriction": "使用限制"
      }
    ]
  }

注意:
  - id 字段必须唯一
  - moves 数组至少包含1个招式
  - 所有招式都必须包含 id, name, type, effect, restriction 字段
  - 导入后角色可同时用于卡片展示和战斗系统
`);
}

// 主函数
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  if (options.files.length === 0) {
    console.error('❌ 错误: 请提供至少一个JSON文件路径');
    console.log('\n使用 --help 查看帮助信息\n');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('⚔️  战斗角色导入脚本（统一Schema版）');
  console.log('='.repeat(80) + '\n');
  
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ 无法连接数据库，导入终止');
    process.exit(1);
  }
  
  console.log('');
  
  const results = {
    created: [],
    updated: [],
    skipped: [],
    failed: []
  };
  
  for (const filePath of options.files) {
    try {
      console.log(`\n处理文件: ${filePath}`);
      console.log('-'.repeat(80));
      
      const jsonData = readJsonFile(filePath);
      
      const errors = validateCharacterData(jsonData);
      if (errors.length > 0) {
        console.error(`❌ 数据验证失败:`);
        errors.forEach(err => console.error(`   - ${err}`));
        results.failed.push({ file: filePath, reason: 'validation_error', errors });
        continue;
      }
      
      const characterData = transformCharacterData(jsonData, {
        characterType: options.characterType,
        difficulty: options.difficulty,
        tags: options.tags,
        isActive: options.isActive
      });
      
      const result = await upsertCharacter(characterData, options.force);
      
      if (result.action === 'created') {
        results.created.push(result.character);
      } else if (result.action === 'updated') {
        results.updated.push(result.character);
      } else if (result.action === 'skipped') {
        results.skipped.push(result.character);
      }
      
      displayCharacterInfo(result.character);
      
    } catch (error) {
      console.error(`❌ 处理失败: ${error.message}\n`);
      results.failed.push({ file: filePath, reason: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 导入汇总');
  console.log('='.repeat(80));
  console.log(`✅ 创建:   ${results.created.length} 个角色`);
  console.log(`🔄 更新:   ${results.updated.length} 个角色`);
  console.log(`⏭️  跳过:   ${results.skipped.length} 个角色`);
  console.log(`❌ 失败:   ${results.failed.length} 个文件`);
  console.log('='.repeat(80));
  
  if (results.created.length > 0) {
    console.log('\n新创建的角色:');
    results.created.forEach(char => {
      console.log(`  ✅ ${char.name} (${char.characterId})`);
    });
  }
  
  if (results.updated.length > 0) {
    console.log('\n已更新的角色:');
    results.updated.forEach(char => {
      console.log(`  🔄 ${char.name} (${char.characterId})`);
    });
  }
  
  if (results.skipped.length > 0) {
    console.log('\n已跳过的角色（使用 --force 强制更新）:');
    results.skipped.forEach(char => {
      console.log(`  ⏭️  ${char.name} (${char.characterId})`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n导入失败的文件:');
    results.failed.forEach(fail => {
      console.log(`  ❌ ${fail.file}: ${fail.reason}`);
    });
  }
  
  console.log('');
  
  await mongoose.connection.close();
  console.log('👋 数据库连接已关闭\n');
  
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});

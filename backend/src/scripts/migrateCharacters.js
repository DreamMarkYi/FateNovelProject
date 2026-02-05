const mongoose = require('mongoose');
const config = require('../../config');
const Character = require('../schemas/unifiedCharacterSchema');

/**
 * 数据迁移脚本
 * 
 * 将旧的 characterCards 和 battle_characters 集合数据迁移到新的统一 characters 集合
 */

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

// 从旧的 characterCards 集合迁移数据
async function migrateCharacterCards() {
  console.log('\n📇 正在迁移 characterCards 集合...');
  
  const db = mongoose.connection.db;
  const oldCollection = db.collection('characterCards');
  
  // 检查旧集合是否存在
  const collections = await db.listCollections({ name: 'characterCards' }).toArray();
  if (collections.length === 0) {
    console.log('   ⚠️ characterCards 集合不存在，跳过迁移');
    return { migrated: 0, skipped: 0 };
  }
  
  const oldCards = await oldCollection.find({}).toArray();
  console.log(`   找到 ${oldCards.length} 条旧卡片数据`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const oldCard of oldCards) {
    // 生成 characterId
    const characterId = oldCard.title 
      ? oldCard.title.replace(/\s+/g, '').replace(/[^\w\u4e00-\u9fa5]/g, '') + '_card'
      : 'card_' + oldCard._id.toString();
    
    // 检查是否已存在
    const existing = await Character.findOne({ characterId });
    if (existing) {
      console.log(`   ⏭️ 跳过已存在: ${oldCard.title || characterId}`);
      skippedCount++;
      continue;
    }
    
    // 转换为统一格式
    const newCharacter = {
      characterId: characterId,
      name: oldCard.title || '未命名',
      title: oldCard.title || '',
      subtitle: oldCard.subtitle || '',
      label: oldCard.label || '',
      season: oldCard.season || '',
      number: oldCard.number || '',
      desc: oldCard.intro || '',
      intro: oldCard.intro || '',
      backgroundImage: oldCard.backgroundImage || '',
      hoverGradient: oldCard.hoverGradient || 'linear-gradient(to top, rgba(100, 150, 200, 0.8), transparent)',
      commandImage: oldCard.commandImage || '/storyImage/command1.png',
      overlayColor: oldCard.overlayColor || 'rgba(100, 150, 200, 0.3)',
      overlayDarkColor: oldCard.overlayDarkColor || 'rgba(50, 80, 120, 0.3)',
      overlayBackgroundImage: oldCard.overlayBackgroundImage || '/storyImage/harukaBG.png',
      decorationType: oldCard.decorationType || 'type1',
      unlocked: oldCard.unlocked !== false,
      index: oldCard.index || 0,
      displayStats: oldCard.stats || {
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
      cardSkills: oldCard.skills || [],
      baseSkills: [],
      characterType: 'player',
      difficulty: 'normal',
      isActive: true,
      metadata: oldCard.metadata || { createdAt: new Date(), updatedAt: new Date() }
    };
    
    try {
      await Character.create(newCharacter);
      console.log(`   ✅ 迁移成功: ${newCharacter.name}`);
      migratedCount++;
    } catch (error) {
      console.error(`   ❌ 迁移失败 (${newCharacter.name}):`, error.message);
    }
  }
  
  console.log(`\n   📊 characterCards 迁移完成: ${migratedCount} 成功, ${skippedCount} 跳过`);
  return { migrated: migratedCount, skipped: skippedCount };
}

// 从旧的 battle_characters 集合迁移数据
async function migrateBattleCharacters() {
  console.log('\n⚔️ 正在迁移 battle_characters 集合...');
  
  const db = mongoose.connection.db;
  const oldCollection = db.collection('battle_characters');
  
  // 检查旧集合是否存在
  const collections = await db.listCollections({ name: 'battle_characters' }).toArray();
  if (collections.length === 0) {
    console.log('   ⚠️ battle_characters 集合不存在，跳过迁移');
    return { migrated: 0, skipped: 0, merged: 0 };
  }
  
  const oldCharacters = await oldCollection.find({}).toArray();
  console.log(`   找到 ${oldCharacters.length} 条旧战斗角色数据`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  let mergedCount = 0;
  
  for (const oldChar of oldCharacters) {
    const characterId = oldChar.characterId || oldChar.name?.replace(/\s+/g, '') || 'battle_' + oldChar._id.toString();
    
    // 检查是否已存在（可能是从 characterCards 迁移过来的）
    const existing = await Character.findOne({ characterId });
    
    if (existing) {
      // 合并战斗数据到现有角色
      console.log(`   🔄 合并战斗数据到: ${existing.name}`);
      
      // 转换 moves 到 baseSkills
      let baseSkills = [];
      if (oldChar.baseSkills && oldChar.baseSkills.length > 0) {
        baseSkills = oldChar.baseSkills;
      } else if (oldChar.moves && oldChar.moves.length > 0) {
        baseSkills = oldChar.moves.map(move => ({
          id: move.id,
          name: move.name,
          type: inferSkillType(move.type),
          power: 50,
          cost: 15,
          accuracy: 85,
          description: move.effect || move.description || '',
          flavorText: '',
          flavorTextTranslation: '',
          effects: [],
          conditions: [],
          rarity: 'common',
          isBase: true,
          derivedFrom: null,
          synergyWith: []
        }));
      }
      
      // 更新现有角色的战斗相关字段
      await Character.updateOne(
        { characterId },
        {
          $set: {
            personality: oldChar.personality || existing.personality,
            magicStyle: oldChar.magicStyle || existing.magicStyle,
            desc: oldChar.desc || existing.desc,
            imageUrl: oldChar.imageUrl || existing.imageUrl,
            battleStats: oldChar.stats || existing.battleStats,
            baseSkills: baseSkills.length > 0 ? baseSkills : existing.baseSkills,
            moves: oldChar.moves || existing.moves,
            characterType: oldChar.characterType || existing.characterType,
            difficulty: oldChar.difficulty || existing.difficulty,
            tags: [...new Set([...(existing.tags || []), ...(oldChar.tags || [])])]
          }
        }
      );
      
      mergedCount++;
      continue;
    }
    
    // 转换 moves 到 baseSkills
    let baseSkills = [];
    if (oldChar.baseSkills && oldChar.baseSkills.length > 0) {
      baseSkills = oldChar.baseSkills;
    } else if (oldChar.moves && oldChar.moves.length > 0) {
      baseSkills = oldChar.moves.map(move => ({
        id: move.id,
        name: move.name,
        type: inferSkillType(move.type),
        power: 50,
        cost: 15,
        accuracy: 85,
        description: move.effect || move.description || '',
        flavorText: '',
        flavorTextTranslation: '',
        effects: [],
        conditions: [],
        rarity: 'common',
        isBase: true,
        derivedFrom: null,
        synergyWith: []
      }));
    }
    
    // 生成卡片技能
    const cardSkills = baseSkills.slice(0, 2).map(skill => ({
      name: skill.name,
      desc: (skill.description || '').substring(0, 50) + ((skill.description || '').length > 50 ? '...' : '')
    }));
    
    // 转换为统一格式
    const newCharacter = {
      characterId: characterId,
      name: oldChar.name || '未命名',
      title: oldChar.name || '',
      subtitle: characterId.toUpperCase(),
      label: oldChar.characterType === 'enemy' ? 'Enemy' : 'Ally',
      season: oldChar.characterType === 'enemy' ? 'Enemy' : 'Ally',
      number: `M-${Date.now().toString().slice(-4)}`,
      desc: oldChar.desc || '',
      intro: oldChar.desc || '',
      imageUrl: oldChar.imageUrl || null,
      backgroundImage: oldChar.imageUrl || '',
      personality: oldChar.personality || oldChar.desc || '',
      magicStyle: oldChar.magicStyle || '见招式库',
      displayStats: {
        Strength: 50,
        Endurance: 50,
        Agility: 50,
        Mana: 50
      },
      battleStats: oldChar.stats || {
        maxHp: 100,
        maxMp: 100,
        attack: 50,
        defense: 50,
        magic: 50,
        agility: 50,
        resistance: 50
      },
      cardSkills: cardSkills,
      baseSkills: baseSkills,
      moves: oldChar.moves || [],
      characterType: oldChar.characterType || 'enemy',
      difficulty: oldChar.difficulty || 'normal',
      tags: oldChar.tags || [],
      isActive: oldChar.isActive !== false,
      unlocked: oldChar.characterType !== 'enemy',
      index: 100 + Math.floor(Math.random() * 900)
    };
    
    try {
      await Character.create(newCharacter);
      console.log(`   ✅ 迁移成功: ${newCharacter.name}`);
      migratedCount++;
    } catch (error) {
      console.error(`   ❌ 迁移失败 (${newCharacter.name}):`, error.message);
    }
  }
  
  console.log(`\n   📊 battle_characters 迁移完成: ${migratedCount} 新建, ${mergedCount} 合并, ${skippedCount} 跳过`);
  return { migrated: migratedCount, skipped: skippedCount, merged: mergedCount };
}

// 验证迁移结果
async function validateMigration() {
  console.log('\n🔍 验证迁移结果...');
  
  const totalCount = await Character.countDocuments();
  const playerCount = await Character.countDocuments({ characterType: 'player' });
  const enemyCount = await Character.countDocuments({ characterType: 'enemy' });
  const neutralCount = await Character.countDocuments({ characterType: 'neutral' });
  const unlockedCount = await Character.countDocuments({ unlocked: true });
  const withBattleSkills = await Character.countDocuments({ 'baseSkills.0': { $exists: true } });
  
  console.log(`\n   📊 统一角色集合统计:`);
  console.log(`      - 总数: ${totalCount}`);
  console.log(`      - 玩家角色: ${playerCount}`);
  console.log(`      - 敌方角色: ${enemyCount}`);
  console.log(`      - 中立角色: ${neutralCount}`);
  console.log(`      - 已解锁: ${unlockedCount}`);
  console.log(`      - 有战斗技能: ${withBattleSkills}`);
  
  // 显示所有角色
  const allCharacters = await Character.find().sort({ characterType: 1, index: 1 });
  console.log('\n   📋 角色列表:');
  allCharacters.forEach((char, idx) => {
    const typeIcon = char.characterType === 'player' ? '🎮' : (char.characterType === 'enemy' ? '👹' : '❓');
    const skillCount = char.baseSkills?.length || 0;
    console.log(`      ${idx + 1}. ${typeIcon} [${char.unlocked ? '✓' : '✗'}] ${char.name} (技能:${skillCount})`);
  });
  
  return true;
}

// 清理旧集合（可选）
async function cleanupOldCollections(dryRun = true) {
  console.log('\n🧹 检查旧集合...');
  
  const db = mongoose.connection.db;
  
  const oldCollections = ['characterCards', 'battle_characters'];
  
  for (const collName of oldCollections) {
    const collections = await db.listCollections({ name: collName }).toArray();
    if (collections.length > 0) {
      const count = await db.collection(collName).countDocuments();
      if (dryRun) {
        console.log(`   ℹ️ 发现旧集合 ${collName} (${count} 条记录) - 使用 --cleanup 参数删除`);
      } else {
        console.log(`   🗑️ 删除旧集合 ${collName} (${count} 条记录)...`);
        await db.collection(collName).drop();
        console.log(`   ✅ 已删除 ${collName}`);
      }
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const doCleanup = args.includes('--cleanup');
  const skipCards = args.includes('--skip-cards');
  const skipBattle = args.includes('--skip-battle');
  
  console.log('\n' + '='.repeat(80));
  console.log('🔄 角色数据迁移脚本');
  console.log('   将 characterCards 和 battle_characters 迁移到统一的 characters 集合');
  console.log('='.repeat(80) + '\n');
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
用法: node migrateCharacters.js [选项]

选项:
  --cleanup       迁移后删除旧集合
  --skip-cards    跳过 characterCards 迁移
  --skip-battle   跳过 battle_characters 迁移
  --help, -h      显示帮助信息
`);
    process.exit(0);
  }
  
  // 连接数据库
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ 无法连接数据库，迁移终止');
    process.exit(1);
  }
  
  try {
    let cardResult = { migrated: 0, skipped: 0 };
    let battleResult = { migrated: 0, skipped: 0, merged: 0 };
    
    // 迁移 characterCards
    if (!skipCards) {
      cardResult = await migrateCharacterCards();
    } else {
      console.log('\n⏭️ 跳过 characterCards 迁移');
    }
    
    // 迁移 battle_characters
    if (!skipBattle) {
      battleResult = await migrateBattleCharacters();
    } else {
      console.log('\n⏭️ 跳过 battle_characters 迁移');
    }
    
    // 验证结果
    await validateMigration();
    
    // 清理旧集合
    await cleanupOldCollections(!doCleanup);
    
    // 总结
    console.log('\n' + '='.repeat(80));
    console.log('📊 迁移总结');
    console.log('='.repeat(80));
    console.log(`   characterCards:    ${cardResult.migrated} 迁移, ${cardResult.skipped} 跳过`);
    console.log(`   battle_characters: ${battleResult.migrated} 迁移, ${battleResult.merged} 合并, ${battleResult.skipped} 跳过`);
    console.log('='.repeat(80));
    
    console.log('\n🎉 迁移完成！\n');
    
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 数据库连接已关闭\n');
  }
}

main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});


























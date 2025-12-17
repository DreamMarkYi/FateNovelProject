/**
 * 游戏存档数据迁移脚本
 * 将旧的"每个存档一条记录"模式迁移到"每个用户一条记录"模式
 * 
 * 使用方法：
 * node src/scripts/migrateGameSaves.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fate_novel';

// 旧的存档Schema（仅用于读取）
const oldSaveSchema = new mongoose.Schema({
  playerId: String,
  saveSlot: Number,
  saveName: String,
  description: String,
  scriptId: String,
  scriptName: String,
  currentSceneIndex: Number,
  screenshot: String,
  sceneSnapshot: {
    speaker: String,
    text: String,
    bgImage: String,
    timestamp: Date
  },
  progressPercentage: Number,
  gameVariables: Map,
  readScenes: [Number],
  unlockedContent: {
    cg: [String],
    achievements: [String],
    endings: [String]
  },
  playTime: Number,
  isAutoSave: Boolean,
  isQuickSave: Boolean,
  isValid: Boolean,
  gameVersion: String
}, { timestamps: true, collection: 'game_saves_old' });

const OldSave = mongoose.model('OldSave', oldSaveSchema);

// 新的用户存档Schema
const GameSave = require('../schemas/gameSaveSchema');

async function migrate() {
  try {
    console.log('🔄 开始数据迁移...');
    console.log(`📡 连接到数据库: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 数据库连接成功\n');
    
    // 1. 先将旧表备份（重命名）
    console.log('📦 备份旧存档表...');
    try {
      await mongoose.connection.db.renameCollection('game_saves', 'game_saves_old');
      console.log('✅ 备份完成: game_saves → game_saves_old\n');
    } catch (error) {
      if (error.codeName === 'NamespaceNotFound') {
        console.log('⚠️  旧表不存在，跳过备份\n');
      } else if (error.codeName === 'NamespaceExists') {
        console.log('⚠️  备份表已存在，使用现有备份\n');
      } else {
        throw error;
      }
    }
    
    // 2. 读取所有旧存档
    console.log('📖 读取旧存档数据...');
    const oldSaves = await OldSave.find({});
    console.log(`✅ 找到 ${oldSaves.length} 条旧存档记录\n`);
    
    if (oldSaves.length === 0) {
      console.log('ℹ️  没有数据需要迁移');
      await mongoose.disconnect();
      return;
    }
    
    // 3. 按玩家ID分组
    console.log('🔀 按用户分组存档...');
    const savesByPlayer = {};
    
    oldSaves.forEach(save => {
      const playerId = save.playerId;
      if (!savesByPlayer[playerId]) {
        savesByPlayer[playerId] = [];
      }
      savesByPlayer[playerId].push(save);
    });
    
    const playerCount = Object.keys(savesByPlayer).length;
    console.log(`✅ 共 ${playerCount} 个用户\n`);
    
    // 4. 创建新的用户存档记录
    console.log('💾 迁移到新结构...');
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const [playerId, saves] of Object.entries(savesByPlayer)) {
      try {
        console.log(`  处理用户: ${playerId} (${saves.length} 个存档)`);
        
        // 创建新的用户存档记录
        const playerSaves = new GameSave({
          playerId,
          playerName: null, // 可以从 start_choice_records 表获取
          saves: new Map(),
          globalReadScenes: [],
          globalUnlockedContent: {
            cg: [],
            achievements: [],
            endings: []
          },
          metadata: {
            totalSaves: saves.length,
            lastPlayedAt: new Date(),
            totalPlayTime: 0,
            gameVersion: saves[0]?.gameVersion || '1.0.0'
          }
        });
        
        // 收集全局数据
        const allReadScenes = new Set();
        const allCG = new Set();
        const allAchievements = new Set();
        const allEndings = new Set();
        let totalPlayTime = 0;
        
        // 迁移每个存档槽位
        saves.forEach(save => {
          const saveSlot = save.saveSlot;
          
          // 添加到 saves Map
          playerSaves.saves.set(saveSlot.toString(), {
            saveName: save.saveName || `存档 ${saveSlot}`,
            description: save.description || '',
            scriptId: save.scriptId,
            scriptName: save.scriptName || '',
            currentSceneIndex: save.currentSceneIndex,
            screenshot: save.screenshot,
            sceneSnapshot: save.sceneSnapshot || {},
            progressPercentage: save.progressPercentage || 0,
            gameVariables: save.gameVariables || new Map(),
            choiceHistory: [], // 旧结构没有这个字段
            readScenes: save.readScenes || [],
            unlockedContent: save.unlockedContent || { cg: [], achievements: [], endings: [] },
            playTime: save.playTime || 0,
            isAutoSave: save.isAutoSave || false,
            isQuickSave: save.isQuickSave || false,
            isValid: save.isValid !== false,
            savedAt: save.updatedAt || save.createdAt || new Date()
          });
          
          // 收集全局数据
          (save.readScenes || []).forEach(scene => allReadScenes.add(scene));
          (save.unlockedContent?.cg || []).forEach(cg => allCG.add(cg));
          (save.unlockedContent?.achievements || []).forEach(ach => allAchievements.add(ach));
          (save.unlockedContent?.endings || []).forEach(end => allEndings.add(end));
          totalPlayTime += save.playTime || 0;
        });
        
        // 设置全局数据
        playerSaves.globalReadScenes = Array.from(allReadScenes);
        playerSaves.globalUnlockedContent.cg = Array.from(allCG);
        playerSaves.globalUnlockedContent.achievements = Array.from(allAchievements);
        playerSaves.globalUnlockedContent.endings = Array.from(allEndings);
        playerSaves.metadata.totalPlayTime = totalPlayTime;
        
        // 保存新记录
        await playerSaves.save();
        migratedCount++;
        console.log(`  ✅ 迁移成功\n`);
        
      } catch (error) {
        errorCount++;
        console.error(`  ❌ 迁移失败: ${error.message}\n`);
      }
    }
    
    // 5. 显示迁移结果
    console.log('\n📊 迁移完成！');
    console.log('═══════════════════════════════════');
    console.log(`✅ 成功: ${migratedCount} 个用户`);
    console.log(`❌ 失败: ${errorCount} 个用户`);
    console.log(`📦 旧记录数: ${oldSaves.length} 条`);
    console.log(`👤 新记录数: ${migratedCount} 条`);
    console.log('═══════════════════════════════════\n');
    
    console.log('ℹ️  旧数据已备份到 game_saves_old 表');
    console.log('ℹ️  如需回滚，请运行: db.game_saves_old.renameCollection("game_saves")\n');
    
    // 6. 断开连接
    await mongoose.disconnect();
    console.log('👋 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 运行迁移
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('✅ 迁移脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = migrate;







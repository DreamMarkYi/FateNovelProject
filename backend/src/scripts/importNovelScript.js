const fs = require('fs');
const path = require('path');
const { connectMongoDB, mongoose } = require('../config/mongodb');
const NovelScript = require('../schemas/novelScriptSchema');

/**
 * 解析文本行，提取 speaker 和 text
 * @param {string} line - 文本行
 * @returns {Object} - { speaker: string | null, text: string }
 */
function parseLine(line) {
  // 匹配行开头的（speaker）：格式（冒号可选）
  // 例如：（秋山痕）： 或 （秋山痕）
  const speakerMatch = line.match(/^（([^）]+)）\s*：?\s*(.*)$/);
  
  if (speakerMatch) {
    const speaker = speakerMatch[1].trim();
    const text = speakerMatch[2].trim();
    
    // 如果提取的 text 为空，说明整行只有 speaker，返回 null speaker
    if (!text) {
      return {
        speaker: null,
        text: line.trim()
      };
    }
    
    return {
      speaker: speaker,
      text: text
    };
  }
  
  return {
    speaker: null,
    text: line.trim()
  };
}

/**
 * 从文本文件导入到数据库
 * @param {string} filePath - 文本文件路径
 * @param {string} scriptId - 剧本ID
 * @param {string} scriptName - 剧本名称
 * @param {string} description - 剧本描述（可选）
 */
async function importNovelScript(filePath, scriptId, scriptName, description = '') {
  try {
    console.log('\n🔧 开始导入小说脚本...\n');
    
    // 连接MongoDB
    const connected = await connectMongoDB();
    if (!connected) {
      throw new Error('MongoDB连接失败');
    }
    
    // 读取文本文件
    console.log(`📖 读取文件: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    console.log(`📝 共 ${lines.length} 行文本\n`);
    
    // 解析每一行，创建 scenes
    const scenes = [];
    let sceneIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过空行
      if (!line) {
        continue;
      }
      
      // 解析行内容
      const { speaker, text } = parseLine(line);
      
      // 如果解析后 text 为空或只有空白字符，跳过
      if (!text || !text.trim()) {
        continue;
      }
      
      // 创建 scene 对象，与 initNovelScript.js 的结构完全一致
      // 包含所有可能的字段，使用默认值
      const scene = {
        index: sceneIndex++,
        type: 'text',
        text: text.trim(), // 确保去除首尾空白
        bgImage: '/storyImage/StoryBG/storyBG2.png', // 默认背景图片
        theme: 'dark', // 默认主题，与 initNovelScript.js 保持一致
        // 人物图片字段（可选，导入时默认为空，后续可通过API更新）
        characterImageLeft: '/storyImage/Seraphina.png', // 左侧角色立绘
        characterImageRight: '/storyImage/Seraphina.png', // 右侧角色立绘
        tags: [], // 空数组，与图片中的结构一致
        choices: [], // 空数组，与图片中的结构一致
        effects: [] // 空数组，与图片中的结构一致
      };
      
      // 如果有 speaker，添加到 scene（去除首尾空白）
      // 注意：initNovelScript.js 中 speaker 可以是空字符串 ''
      if (speaker !== null) {
        scene.speaker = speaker.trim();
      }
      // 如果 speaker 为 null（没有匹配到），则不设置，让 schema 的默认值处理
      
      scenes.push(scene);
    }
    
    console.log(`✅ 解析完成，共 ${scenes.length} 个场景\n`);
    
    // 验证 scenes 数组
    if (scenes.length === 0) {
      throw new Error('解析后的场景数组为空，请检查文本文件格式');
    }
    
    // 显示前几个场景示例
    console.log('📋 前3个场景示例:');
    scenes.slice(0, 3).forEach((scene, idx) => {
      console.log(`   [${scene.index}] type: ${scene.type}, speaker: ${scene.speaker || '(无)'}, text: ${scene.text.substring(0, 30)}...`);
    });
    console.log('');
    
    // 检查是否已存在相同 scriptId 的剧本
    console.log(`🔍 检查是否已存在剧本: ${scriptId}...`);
    const existingScript = await NovelScript.findOne({ scriptId });
    
    if (existingScript) {
      console.log(`⚠️  发现已存在的剧本: ${scriptId}`);
      console.log('   将更新现有剧本...\n');
      
      // 更新现有剧本，保持与 initNovelScript.js 一致的字段结构
      existingScript.scriptName = scriptName;
      existingScript.description = description;
      existingScript.scenes = scenes;
      // 如果 unlockConditions 不存在，设置为空数组（默认值）
      if (existingScript.unlockConditions === undefined) {
        existingScript.unlockConditions = [];
      }
      // 如果 connectNode 不存在，设置为空数组（默认值）
      if (existingScript.connectNode === undefined) {
        existingScript.connectNode = [];
      }
      // 如果 position 不存在，设置为默认位置
      if (existingScript.position === undefined) {
        existingScript.position = { x: 0, y: 0 };
      }
      existingScript.metadata.totalScenes = scenes.length;
      existingScript.metadata.estimatedPlayTime = Math.ceil(scenes.length * 0.5);
      // 不设置 lastUpdated，让 schema 的默认值处理（与 initNovelScript.js 一致）
      
      try {
        const savedScript = await existingScript.save();
        console.log(`✅ 剧本更新成功: ${scriptId}`);
        console.log(`   MongoDB ID: ${savedScript._id}`);
      } catch (saveError) {
        console.error(`❌ 保存失败:`, saveError.message);
        if (saveError.errors) {
          console.error(`   验证错误详情:`, JSON.stringify(saveError.errors, null, 2));
        }
        throw saveError;
      }
    } else {
      // 创建新剧本，与 initNovelScript.js 的结构完全一致
      console.log(`📝 创建新剧本: ${scriptId}...`);
      const novelScript = new NovelScript({
        scriptId,
        scriptName,
        description,
        unlockConditions: [], // 解锁条件，默认为空数组（无解锁条件，默认解锁）
        connectNode: [], // 连接的节点，默认为空数组
        position: { x: 0, y: 0 }, // 世界坐标位置，默认为 (0, 0)
        scenes,
        isActive: true,
        displayOrder: 0, // 默认值，与初始化脚本保持一致（初始化脚本使用 1 或 2，但默认是 0）
        metadata: {
          author: 'System',
          version: '1.0.0',
          language: 'zh-CN',
          totalScenes: scenes.length,
          estimatedPlayTime: Math.ceil(scenes.length * 0.5) // 假设每个场景0.5分钟
          // 不设置 lastUpdated，让 schema 的默认值处理（与 initNovelScript.js 一致）
        }
      });
      
      try {
        const savedScript = await novelScript.save();
        console.log(`✅ 剧本创建成功: ${scriptId}`);
        console.log(`   MongoDB ID: ${savedScript._id}`);
      } catch (saveError) {
        console.error(`❌ 保存失败:`, saveError.message);
        if (saveError.errors) {
          console.error(`   验证错误详情:`, JSON.stringify(saveError.errors, null, 2));
        }
        if (saveError.name === 'ValidationError') {
          console.error(`   这是 Schema 验证错误，请检查数据格式是否符合要求`);
        }
        throw saveError;
      }
    }
    
    // 再次查询验证数据已保存
    console.log(`\n🔍 验证数据保存...`);
    const verifyScript = await NovelScript.findOne({ scriptId });
    if (verifyScript) {
      console.log(`✅ 验证成功: 剧本已存在于数据库中`);
      console.log(`   - 剧本ID: ${verifyScript.scriptId}`);
      console.log(`   - 剧本名称: ${verifyScript.scriptName}`);
      console.log(`   - 场景数量: ${verifyScript.scenes.length}`);
      console.log(`   - 创建时间: ${verifyScript.createdAt}`);
    } else {
      console.error(`❌ 验证失败: 无法在数据库中找到剧本 ${scriptId}`);
      throw new Error('数据保存验证失败');
    }
    
    // 查询所有剧本数量
    const totalScripts = await NovelScript.countDocuments();
    console.log(`\n📊 数据库中共有 ${totalScripts} 个剧本`);
    
    console.log(`\n📊 统计信息:`);
    console.log(`   - 剧本ID: ${scriptId}`);
    console.log(`   - 剧本名称: ${scriptName}`);
    console.log(`   - 场景总数: ${scenes.length}`);
    console.log(`   - 有对话者的场景: ${scenes.filter(s => s.speaker).length}`);
    console.log(`   - 纯文本场景: ${scenes.filter(s => !s.speaker).length}\n`);
    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('✅ 数据库连接已关闭\n');
    
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 主函数
async function main() {
  // 从命令行参数获取文件路径和剧本信息
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ 用法: node importNovelScript.js <文件路径> <剧本ID> [剧本名称] [描述]');
    console.error('   示例: node importNovelScript.js web-project/public/storyText/Chapter1-1.txt chapter1-1 "第一章-第一幕" "第一章第一幕的剧情"');
    console.error('   或者: node importNovelScript.js "D:/FateNovelProject/web-project/public/storyText/Chapter1-1.txt" chapter1-1');
    process.exit(1);
  }
  
  // 处理文件路径：支持绝对路径和相对路径
  let filePath = args[0];
  if (!path.isAbsolute(filePath)) {
    // 如果是相对路径，尝试从项目根目录解析
    // 脚本在 backend/src/scripts/，项目根目录在 backend/../，即上一级目录
    const projectRoot = path.resolve(__dirname, '../../..');
    filePath = path.resolve(projectRoot, filePath);
  }
  
  const scriptId = args[1];
  const scriptName = args[2] || scriptId;
  const description = args[3] || '';
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    console.error(`   请检查文件路径是否正确`);
    process.exit(1);
  }
  
  await importNovelScript(filePath, scriptId, scriptName, description);
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { importNovelScript, parseLine };


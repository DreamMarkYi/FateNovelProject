const fs = require('fs');
const path = require('path');
const { connectMongoDB, mongoose } = require('../config/mongodb');
const NovelScript = require('../schemas/novelScriptSchema');

/**
 * 从JSON文件导入novel_script数据到数据库
 * @param {string} jsonFilePath - JSON文件路径
 * @param {boolean} updateIfExists - 如果已存在是否更新（默认：true）
 */
async function importNovelScriptFromJson(jsonFilePath, updateIfExists = true) {
  try {
    console.log('\n🔧 开始从JSON文件导入novel_script数据...\n');
    
    // 连接MongoDB
    const connected = await connectMongoDB();
    if (!connected) {
      throw new Error('MongoDB连接失败');
    }
    
    // 读取JSON文件
    console.log(`📖 读取JSON文件: ${jsonFilePath}`);
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`文件不存在: ${jsonFilePath}`);
    }
    
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf-8');
    let scriptData;
    
    try {
      scriptData = JSON.parse(jsonContent);
    } catch (parseError) {
      throw new Error(`JSON解析失败: ${parseError.message}`);
    }
    
    // 验证必需字段
    if (!scriptData.scriptId) {
      throw new Error('JSON文件中缺少必需字段: scriptId');
    }
    
    if (!scriptData.scriptName) {
      throw new Error('JSON文件中缺少必需字段: scriptName');
    }
    
    // 验证scenes数组
    if (!Array.isArray(scriptData.scenes)) {
      throw new Error('scenes字段必须是数组');
    }
    
    // 验证每个scene的基本结构
    scriptData.scenes.forEach((scene, index) => {
      if (typeof scene.index !== 'number') {
        throw new Error(`场景 ${index} 缺少必需字段: index (必须是数字)`);
      }
      if (!scene.type || !['title', 'text', 'choice'].includes(scene.type)) {
        throw new Error(`场景 ${index} 的type字段无效，必须是 'title', 'text', 或 'choice'`);
      }
    });
    
    console.log(`✅ JSON文件解析成功`);
    console.log(`   - 剧本ID: ${scriptData.scriptId}`);
    console.log(`   - 剧本名称: ${scriptData.scriptName}`);
    console.log(`   - 场景数量: ${scriptData.scenes.length}\n`);
    
    // 检查是否已存在相同scriptId的剧本
    const existingScript = await NovelScript.findOne({ scriptId: scriptData.scriptId });
    
    if (existingScript) {
      if (!updateIfExists) {
        console.log(`⚠️  剧本 ${scriptData.scriptId} 已存在，跳过导入（使用 --update 参数可强制更新）`);
        await mongoose.connection.close();
        return;
      }
      
      console.log(`⚠️  发现已存在的剧本: ${scriptData.scriptId}`);
      console.log('   将更新现有剧本...\n');
      
      // 更新现有剧本
      // 保留一些字段，如果JSON中没有提供
      const updateData = {
        scriptName: scriptData.scriptName,
        description: scriptData.description || existingScript.description,
        summary: scriptData.summary !== undefined ? scriptData.summary : existingScript.summary,
        thumbnailImage: scriptData.thumbnailImage !== undefined ? scriptData.thumbnailImage : existingScript.thumbnailImage,
        unlockConditions: scriptData.unlockConditions !== undefined ? scriptData.unlockConditions : existingScript.unlockConditions,
        visibility: scriptData.visibility || existingScript.visibility || 'all',
        connectNode: scriptData.connectNode !== undefined ? scriptData.connectNode : existingScript.connectNode,
        position: scriptData.position || existingScript.position || { x: 0, y: 0 },
        scenes: scriptData.scenes,
        isActive: scriptData.isActive !== undefined ? scriptData.isActive : existingScript.isActive,
        displayOrder: scriptData.displayOrder !== undefined ? scriptData.displayOrder : existingScript.displayOrder,
        metadata: {
          ...existingScript.metadata,
          ...(scriptData.metadata || {}),
          totalScenes: scriptData.scenes.length,
          lastUpdated: new Date()
        }
      };
      
      Object.assign(existingScript, updateData);
      
      try {
        const savedScript = await existingScript.save();
        console.log(`✅ 剧本更新成功: ${scriptData.scriptId}`);
        console.log(`   MongoDB ID: ${savedScript._id}`);
        console.log(`   - 场景总数: ${savedScript.scenes.length}`);
        console.log(`   - 显示顺序: ${savedScript.displayOrder}`);
        console.log(`   - 激活状态: ${savedScript.isActive ? '是' : '否'}`);
      } catch (saveError) {
        console.error(`❌ 保存失败:`, saveError.message);
        if (saveError.errors) {
          console.error(`   验证错误详情:`, JSON.stringify(saveError.errors, null, 2));
        }
        throw saveError;
      }
    } else {
      // 创建新剧本
      console.log(`📝 创建新剧本: ${scriptData.scriptId}...`);
      
      // 设置默认值
      const newScriptData = {
        scriptId: scriptData.scriptId,
        scriptName: scriptData.scriptName,
        description: scriptData.description || '',
        summary: scriptData.summary || '',
        thumbnailImage: scriptData.thumbnailImage || '',
        unlockConditions: scriptData.unlockConditions || [],
        visibility: scriptData.visibility || 'all',
        connectNode: scriptData.connectNode || [],
        position: scriptData.position || { x: 0, y: 0 },
        scenes: scriptData.scenes,
        isActive: scriptData.isActive !== undefined ? scriptData.isActive : true,
        displayOrder: scriptData.displayOrder !== undefined ? scriptData.displayOrder : 0,
        metadata: {
          author: scriptData.metadata?.author || 'System',
          version: scriptData.metadata?.version || '1.0.0',
          language: scriptData.metadata?.language || 'zh-CN',
          totalScenes: scriptData.scenes.length,
          estimatedPlayTime: scriptData.metadata?.estimatedPlayTime || Math.ceil(scriptData.scenes.length * 0.5),
          lastUpdated: new Date()
        }
      };
      
      const novelScript = new NovelScript(newScriptData);
      
      try {
        const savedScript = await novelScript.save();
        console.log(`✅ 剧本创建成功: ${scriptData.scriptId}`);
        console.log(`   MongoDB ID: ${savedScript._id}`);
        console.log(`   - 场景总数: ${savedScript.scenes.length}`);
        console.log(`   - 显示顺序: ${savedScript.displayOrder}`);
        console.log(`   - 激活状态: ${savedScript.isActive ? '是' : '否'}`);
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
    const verifyScript = await NovelScript.findOne({ scriptId: scriptData.scriptId });
    if (verifyScript) {
      console.log(`✅ 验证成功: 剧本已存在于数据库中`);
      console.log(`   - 剧本ID: ${verifyScript.scriptId}`);
      console.log(`   - 剧本名称: ${verifyScript.scriptName}`);
      console.log(`   - 场景数量: ${verifyScript.scenes.length}`);
      console.log(`   - 创建时间: ${verifyScript.createdAt}`);
      console.log(`   - 更新时间: ${verifyScript.updatedAt}`);
    } else {
      console.error(`❌ 验证失败: 无法在数据库中找到剧本 ${scriptData.scriptId}`);
      throw new Error('数据保存验证失败');
    }
    
    // 查询所有剧本数量
    const totalScripts = await NovelScript.countDocuments();
    console.log(`\n📊 数据库中共有 ${totalScripts} 个剧本`);
    
    // 统计信息
    const scenes = scriptData.scenes;
    console.log(`\n📊 统计信息:`);
    console.log(`   - 剧本ID: ${scriptData.scriptId}`);
    console.log(`   - 剧本名称: ${scriptData.scriptName}`);
    console.log(`   - 场景总数: ${scenes.length}`);
    console.log(`   - 标题场景: ${scenes.filter(s => s.type === 'title').length}`);
    console.log(`   - 对话场景: ${scenes.filter(s => s.type === 'text').length}`);
    console.log(`   - 选择场景: ${scenes.filter(s => s.type === 'choice').length}`);
    console.log(`   - 有对话者的场景: ${scenes.filter(s => s.speaker).length}`);
    console.log(`   - 有背景图片的场景: ${scenes.filter(s => s.bgImage).length}`);
    console.log(`   - 有选择分支的场景: ${scenes.filter(s => s.choices && s.choices.length > 0).length}\n`);
    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('✅ 数据库连接已关闭\n');
    
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * 批量导入多个JSON文件
 * @param {string[]} jsonFilePaths - JSON文件路径数组
 * @param {boolean} updateIfExists - 如果已存在是否更新
 */
async function batchImportNovelScripts(jsonFilePaths, updateIfExists = true) {
  try {
    console.log(`\n🔧 开始批量导入 ${jsonFilePaths.length} 个JSON文件...\n`);
    
    const results = {
      success: [],
      failed: []
    };
    
    for (let i = 0; i < jsonFilePaths.length; i++) {
      const filePath = jsonFilePaths[i];
      console.log(`\n[${i + 1}/${jsonFilePaths.length}] 处理文件: ${filePath}`);
      console.log('─'.repeat(60));
      
      try {
        await importNovelScriptFromJson(filePath, updateIfExists);
        results.success.push(filePath);
        console.log(`✅ 文件 ${filePath} 导入成功\n`);
      } catch (error) {
        console.error(`❌ 文件 ${filePath} 导入失败: ${error.message}\n`);
        results.failed.push({ file: filePath, error: error.message });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 批量导入结果汇总:');
    console.log(`   ✅ 成功: ${results.success.length} 个文件`);
    console.log(`   ❌ 失败: ${results.failed.length} 个文件`);
    
    if (results.failed.length > 0) {
      console.log('\n失败的文件:');
      results.failed.forEach(({ file, error }) => {
        console.log(`   - ${file}: ${error}`);
      });
    }
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ 批量导入失败:', error.message);
    process.exit(1);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('❌ 用法: node importNovelScriptFromJson.js <JSON文件路径> [选项]');
    console.error('');
    console.error('选项:');
    console.error('  --no-update    如果剧本已存在，不更新（默认会更新）');
    console.error('  --batch        批量导入模式，可以指定多个文件或目录');
    console.error('');
    console.error('示例:');
    console.error('  # 导入单个JSON文件');
    console.error('  node importNovelScriptFromJson.js script.json');
    console.error('');
    console.error('  # 导入单个JSON文件（如果已存在则不更新）');
    console.error('  node importNovelScriptFromJson.js script.json --no-update');
    console.error('');
    console.error('  # 批量导入多个JSON文件');
    console.error('  node importNovelScriptFromJson.js script1.json script2.json script3.json --batch');
    console.error('');
    console.error('  # 批量导入目录中的所有JSON文件');
    console.error('  node importNovelScriptFromJson.js ./scripts/*.json --batch');
    process.exit(1);
  }
  
  const updateIfExists = !args.includes('--no-update');
  const isBatchMode = args.includes('--batch');
  
  // 过滤掉选项参数
  const fileArgs = args.filter(arg => !arg.startsWith('--'));
  
  if (fileArgs.length === 0) {
    console.error('❌ 请至少指定一个JSON文件路径');
    process.exit(1);
  }
  
  // 处理文件路径
  const jsonFilePaths = [];
  
  for (const fileArg of fileArgs) {
    let filePath = fileArg;
    
    // 处理相对路径
    if (!path.isAbsolute(filePath)) {
      const projectRoot = path.resolve(__dirname, '../../..');
      filePath = path.resolve(projectRoot, filePath);
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`⚠️  警告: 文件不存在，跳过: ${filePath}`);
      continue;
    }
    
    // 检查是否是目录
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // 如果是目录，查找其中的所有JSON文件
      const files = fs.readdirSync(filePath);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          jsonFilePaths.push(path.join(filePath, file));
        }
      });
    } else if (filePath.endsWith('.json')) {
      jsonFilePaths.push(filePath);
    } else {
      console.error(`⚠️  警告: 不是JSON文件，跳过: ${filePath}`);
    }
  }
  
  if (jsonFilePaths.length === 0) {
    console.error('❌ 没有找到有效的JSON文件');
    process.exit(1);
  }
  
  // 执行导入
  if (jsonFilePaths.length === 1 && !isBatchMode) {
    // 单个文件导入
    await importNovelScriptFromJson(jsonFilePaths[0], updateIfExists);
  } else {
    // 批量导入
    await batchImportNovelScripts(jsonFilePaths, updateIfExists);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { importNovelScriptFromJson, batchImportNovelScripts };


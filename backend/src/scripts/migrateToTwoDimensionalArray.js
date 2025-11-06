const mongoose = require('mongoose');
const config = require('../../config');
const SowakaStory = require('../schemas/sowakaStorySchema');

// 连接MongoDB
async function connectMongoDB() {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB连接成功');
    return true;
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    return false;
  }
}

// 迁移一维数组到二维数组
async function migrateToTwoDimensionalArray() {
  try {
    console.log('\n🔧 开始迁移 storyTextRight 到二维数组结构...\n');
    
    // 查找所有需要迁移的记录
    const stories = await SowakaStory.find({});
    console.log(`📊 找到 ${stories.length} 条记录`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const story of stories) {
      console.log(`\n📖 处理故事: ${story.title} (ID: ${story._id})`);
      
      // 检查 storyTextRight 的结构
      if (!story.storyTextRight || !Array.isArray(story.storyTextRight)) {
        console.log('   ⚠️  storyTextRight 不存在或不是数组，跳过');
        skippedCount++;
        continue;
      }
      
      // 检查是否已经是二维数组
      if (story.storyTextRight.length > 0 && Array.isArray(story.storyTextRight[0])) {
        console.log('   ✅ 已经是二维数组结构，跳过');
        skippedCount++;
        continue;
      }
      
      // 将一维数组转换为二维数组
      const originalArray = story.storyTextRight;
      console.log(`   📝 原始数组长度: ${originalArray.length}`);
      
      // 将数组分组，每2个元素为一组（可以根据需要调整）
      const groupSize = 2;
      const newTwoDimensionalArray = [];
      
      for (let i = 0; i < originalArray.length; i += groupSize) {
        const group = originalArray.slice(i, i + groupSize);
        newTwoDimensionalArray.push(group);
      }
      
      console.log(`   🔄 转换为 ${newTwoDimensionalArray.length} 个组`);
      
      // 更新数据库
      await SowakaStory.findByIdAndUpdate(
        story._id,
        { 
          storyTextRight: newTwoDimensionalArray,
          'metadata.lastUpdated': new Date()
        }
      );
      
      console.log('   ✅ 迁移完成');
      migratedCount++;
    }
    
    console.log('\n🎉 迁移完成！');
    console.log(`   - 成功迁移: ${migratedCount} 条记录`);
    console.log(`   - 跳过: ${skippedCount} 条记录`);
    
    // 验证迁移结果
    console.log('\n🔍 验证迁移结果...');
    const verificationStories = await SowakaStory.find({});
    
    for (const story of verificationStories) {
      if (story.storyTextRight && Array.isArray(story.storyTextRight)) {
        const isNowTwoDimensional = story.storyTextRight.length > 0 && Array.isArray(story.storyTextRight[0]);
        console.log(`   ${story.title}: ${isNowTwoDimensional ? '✅ 二维数组' : '❌ 仍为一维数组'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    const connected = await connectMongoDB();
    if (!connected) {
      process.exit(1);
    }
    
    await migrateToTwoDimensionalArray();
    
  } catch (error) {
    console.error('脚本执行失败:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { migrateToTwoDimensionalArray, connectMongoDB };

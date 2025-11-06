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

// 为现有记录添加chapterName字段
async function addChapterNameField() {
  try {
    console.log('\n🔧 开始为sowaka_stories表添加chapterName字段...\n');
    
    // 查找所有没有chapterName字段的记录
    const storiesWithoutChapter = await SowakaStory.find({
      chapterName: { $exists: false }
    });
    
    if (storiesWithoutChapter.length === 0) {
      console.log('✅ 所有记录都已包含chapterName字段，无需迁移');
      return;
    }
    
    console.log(`📝 找到 ${storiesWithoutChapter.length} 条需要更新的记录`);
    
    let updatedCount = 0;
    
    // 为每条记录添加默认的chapterName
    for (let i = 0; i < storiesWithoutChapter.length; i++) {
      const story = storiesWithoutChapter[i];
      
      // 根据displayOrder或创建时间设置章节名称
      let chapterName = `第${i + 1}章`;
      
      // 如果有displayOrder，使用它来确定章节编号
      if (story.displayOrder !== undefined && story.displayOrder >= 0) {
        chapterName = `第${story.displayOrder + 1}章`;
      }
      
      // 更新记录
      await SowakaStory.findByIdAndUpdate(
        story._id,
        { 
          chapterName: chapterName,
          'metadata.lastUpdated': new Date()
        },
        { new: true }
      );
      
      updatedCount++;
      console.log(`   ✓ 更新记录 ${story._id}: "${story.title}" -> 章节: "${chapterName}"`);
    }
    
    console.log(`\n✅ 迁移完成！共更新了 ${updatedCount} 条记录`);
    
    // 验证更新结果
    const totalStories = await SowakaStory.countDocuments();
    const storiesWithChapter = await SowakaStory.countDocuments({
      chapterName: { $exists: true }
    });
    
    console.log(`\n📊 迁移结果统计:`);
    console.log(`   - 总记录数: ${totalStories}`);
    console.log(`   - 包含chapterName字段的记录: ${storiesWithChapter}`);
    console.log(`   - 迁移成功率: ${((storiesWithChapter / totalStories) * 100).toFixed(1)}%`);
    
    // 显示所有记录的章节信息
    console.log(`\n📋 当前所有记录的章节信息:`);
    const allStories = await SowakaStory.find({})
      .select('title chapterName displayOrder isActive')
      .sort({ displayOrder: 1, createdAt: -1 });
    
    allStories.forEach((story, index) => {
      console.log(`   ${index + 1}. ${story.chapterName} - "${story.title}" (显示顺序: ${story.displayOrder}, 状态: ${story.isActive ? '激活' : '未激活'})`);
    });
    
  } catch (error) {
    console.error('❌ 添加chapterName字段失败:', error);
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
    
    await addChapterNameField();
    
    console.log('\n🎉 数据库迁移完成！');
    console.log('现在所有sowaka_stories记录都包含chapterName字段');
    
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

module.exports = { addChapterNameField, connectMongoDB };

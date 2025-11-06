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

// 检查数据格式
async function checkDataFormat() {
  try {
    console.log('\n🔍 检查数据库中的数据格式...\n');
    
    const stories = await SowakaStory.find({}).select('title storyImageLeft storyTextRight');
    
    if (stories.length === 0) {
      console.log('⚠️  数据库中没有找到任何故事数据');
      return { needsMigration: false, stories: [] };
    }
    
    console.log(`📊 找到 ${stories.length} 条故事记录\n`);
    
    let needsMigration = false;
    const migrationNeeded = [];
    
    stories.forEach((story, index) => {
      console.log(`📖 故事 ${index + 1}: ${story.title}`);
      console.log(`   ID: ${story._id}`);
      
      // 检查 storyImageLeft 格式
      const imageLeftType = Array.isArray(story.storyImageLeft) ? 'array' : typeof story.storyImageLeft;
      console.log(`   storyImageLeft 类型: ${imageLeftType}`);
      
      if (imageLeftType === 'string') {
        console.log(`   ⚠️  storyImageLeft 是字符串格式，需要迁移为数组`);
        needsMigration = true;
        migrationNeeded.push({
          id: story._id,
          field: 'storyImageLeft',
          currentValue: story.storyImageLeft,
          currentType: 'string'
        });
      } else if (imageLeftType === 'array') {
        console.log(`   ✅ storyImageLeft 已是数组格式`);
        console.log(`   数组长度: ${story.storyImageLeft.length}`);
      }
      
      // 检查 storyTextRight 格式
      const textRightType = Array.isArray(story.storyTextRight) ? 'array' : typeof story.storyTextRight;
      console.log(`   storyTextRight 类型: ${textRightType}`);
      
      if (textRightType === 'array') {
        console.log(`   ✅ storyTextRight 已是数组格式`);
        console.log(`   数组长度: ${story.storyTextRight.length}`);
        
        // 检查是否是二维数组
        if (story.storyTextRight.length > 0) {
          const firstElement = story.storyTextRight[0];
          const isNestedArray = Array.isArray(firstElement);
          console.log(`   是否为二维数组: ${isNestedArray ? '是' : '否'}`);
        }
      }
      
      console.log(''); // 空行分隔
    });
    
    return { needsMigration, migrationNeeded, stories };
    
  } catch (error) {
    console.error('❌ 检查数据格式失败:', error);
    throw error;
  }
}

// 数据迁移函数
async function migrateData(migrationNeeded) {
  try {
    console.log('\n🔧 开始数据迁移...\n');
    
    for (const item of migrationNeeded) {
      console.log(`🔄 迁移记录 ${item.id}...`);
      
      if (item.field === 'storyImageLeft') {
        // 将字符串转换为数组
        const newValue = item.currentValue ? [item.currentValue] : [];
        
        await SowakaStory.findByIdAndUpdate(
          item.id,
          { 
            storyImageLeft: newValue,
            'metadata.lastUpdated': new Date()
          }
        );
        
        console.log(`   ✅ storyImageLeft 已从字符串迁移为数组: ${JSON.stringify(newValue)}`);
      }
    }
    
    console.log('\n✅ 数据迁移完成！');
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
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
    
    const { needsMigration, migrationNeeded, stories } = await checkDataFormat();
    
    if (needsMigration) {
      console.log('\n⚠️  检测到数据格式不匹配，需要进行迁移');
      console.log('🔧 开始自动迁移...');
      await migrateData(migrationNeeded);
      
      // 再次检查迁移结果
      console.log('\n🔍 验证迁移结果...');
      await checkDataFormat();
    } else {
      console.log('\n✅ 所有数据格式都正确，无需迁移');
    }
    
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

module.exports = { checkDataFormat, migrateData, connectMongoDB };

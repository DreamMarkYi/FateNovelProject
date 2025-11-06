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

// 初始化Sowaka故事数据
async function initSowakaStory() {
  try {
    console.log('\n🔧 开始初始化Sowaka故事数据...\n');
    
    // 检查是否已存在数据
    const existingCount = await SowakaStory.countDocuments();
    
    // 默认的Sowaka故事数据
    const defaultStory = {
      title: 'そわかの物語',
      subtitle: 'STORY OF SOWAKA',
      storyImageLeft: '', // 可以后续添加图片URL
      storyTextRight: [
        '京都の静かな朝、打ち水のされた石畳を歩くと、そこには時を超えた美しさが息づいています。',
        '「そわか」は、古き良き日本の伝統と現代の洗練が調和した、特別な空間です。歴史的な建築を大切に保存しながら、現代の快適さを融合させました。',
        '四季折々の京都の風景を感じながら、心安らぐひとときをお過ごしいただけます。坪庭の緑、石畳の音、風の香り。五感すべてで感じる日本の美がここにあります。',
        '私たちは、訪れるすべての方に「幸あれ」という祝福の心を込めて、最高のおもてなしを提供いたします。'
      ],
      authorSignature: '— SOWAKA KYOTO',
      prefaceContext: ['内心收到罪恶感苛责的他，只能朝着唯一的星星徘徊买进','再怎么徘徊都无法找到前往天国之路的他，最终向着星星提问，然后星星如此谕令到：','抱着人类的理性，是无法前往天国的'],
      isActive: true,
      displayOrder: 0,
      metadata: {
        language: 'ja',
        lastUpdated: new Date()
      }
    };
    
    let story;
    
    if (existingCount > 0) {
      console.log(`⚠️  数据库中已存在 ${existingCount} 条Sowaka故事记录`);
      console.log('🔄 更新现有记录以包含新字段...');
      
      // 更新所有现有记录，添加缺失的字段
      const updateResult = await SowakaStory.updateMany(
        { prefaceContext: { $exists: false } }, // 只更新没有prefaceContext字段的记录
        { 
          $set: { 
            prefaceContext: defaultStory.prefaceContext,
            'metadata.lastUpdated': new Date()
          } 
        }
      );
      
      console.log(`✅ 已更新 ${updateResult.modifiedCount} 条记录`);
      
      // 获取第一条记录作为示例
      story = await SowakaStory.findOne().sort({ displayOrder: 1 });
      
      if (!story) {
        console.log('📝 没有找到现有记录，创建新的默认故事...');
        story = new SowakaStory(defaultStory);
        await story.save();
      }
    } else {
      console.log('📝 创建默认Sowaka故事...');
      story = new SowakaStory(defaultStory);
      await story.save();
    }
    
    console.log('✅ Sowaka故事数据初始化完成！');
    console.log(`   - 标题: ${story.title}`);
    console.log(`   - 副标题: ${story.subtitle}`);
    console.log(`   - 段落数量: ${story.storyTextRight.length}`);
    console.log(`   - 作者签名: ${story.authorSignature}`);
    console.log(`   - 前言内容: ${story.prefaceContext}`);
    console.log(`   - 状态: ${story.isActive ? '激活' : '未激活'}`);
    console.log(`   - ID: ${story._id}`);
    
    console.log('\n🎉 初始化完成！现在可以通过以下API访问数据：');
    console.log(`   GET /api/mongo/sowaka-stories/current - 获取当前故事`);
    console.log(`   GET /api/mongo/sowaka-stories - 获取所有故事`);
    console.log(`   POST /api/mongo/sowaka-stories - 创建新故事`);
    console.log(`   PUT /api/mongo/sowaka-stories/${story._id} - 更新故事`);
    
  } catch (error) {
    console.error('❌ 初始化Sowaka故事数据失败:', error);
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
    
    await initSowakaStory();
    
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

module.exports = { initSowakaStory, connectMongoDB };


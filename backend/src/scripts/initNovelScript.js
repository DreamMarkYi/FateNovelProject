const mongoose = require('mongoose');
const NovelScript = require('../schemas/novelScriptSchema');
const config = require('../../config');

// 连接MongoDB
async function connectDB() {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 示例剧本数据 - 基于NovelShowPage.vue的数据结构
const sampleScript = {
  scriptId: 'phantom-vision',
  scriptName: '幻视 - Phantom Vision',
  description: '一个沉浸式的阅读体验演示',
  scenes: [
    {
      index: 0,
      type: 'title',
      title: '幻视',
      subtitle: 'Phantom Vision',
      bgImage: 'https://picsum.photos/id/1015/1920/1080',
      theme: 'dark',
      tags: ['opening', 'title']
    },
    {
      index: 1,
      type: 'text',
      speaker: 'Guide',
      text: '这是一种沉浸式的阅读体验。文字不再被禁锢在方框里，而是生长在画面之中。',
      bgImage: 'https://picsum.photos/id/1015/1920/1080',
      theme: 'dark',
      tags: ['introduction']
    },
    {
      index: 2,
      type: 'text',
      speaker: 'System',
      text: '当切换到明亮的场景时，UI会自动调整为白色渐变，模拟过曝的光感。',
      bgImage: 'https://picsum.photos/id/1050/1920/1080',
      theme: 'light',
      tags: ['explanation']
    },
    {
      index: 3,
      type: 'text',
      speaker: 'Narrator',
      text: '现在，文字就像是漂浮在海面上的泡沫，或者是空气中的尘埃。',
      bgImage: 'https://picsum.photos/id/1050/1920/1080',
      theme: 'light',
      tags: ['narration']
    },
    {
      index: 4,
      type: 'text',
      speaker: 'Night Watch',
      text: '回到黑夜，一切又沉入深海。这种渐变设计保证了无论背景多么复杂，文字底部总有足够的对比度。',
      bgImage: 'https://picsum.photos/id/1036/1920/1080',
      theme: 'dark',
      tags: ['narration']
    },
    {
      index: 5,
      type: 'text',
      speaker: '',
      text: '（体验结束，点击屏幕重置）',
      bgImage: 'https://picsum.photos/id/1036/1920/1080',
      theme: 'dark',
      tags: ['ending']
    }
  ],
  isActive: true,
  displayOrder: 1,
  metadata: {
    author: 'System',
    version: '1.0.0',
    language: 'zh-CN',
    totalScenes: 6,
    estimatedPlayTime: 5
  }
};

// 更复杂的示例剧本 - 包含选择分支
const advancedScript = {
  scriptId: 'fate-prologue',
  scriptName: 'Fate/Stay Night - 序章',
  description: '命运之夜的序章，展示分支剧情功能',
  scenes: [
    {
      index: 0,
      type: 'title',
      title: 'Fate/Stay Night',
      subtitle: '序章',
      bgImage: 'https://picsum.photos/id/1018/1920/1080',
      theme: 'dark',
      tags: ['opening', 'prologue']
    },
    {
      index: 1,
      type: 'text',
      speaker: '旁白',
      text: '冬木市，一个看似平凡的城市，却隐藏着魔术师们的秘密战争。',
      bgImage: 'https://picsum.photos/id/1018/1920/1080',
      theme: 'dark',
      bgm: 'prologue_bgm.mp3',
      tags: ['introduction', 'setting']
    },
    {
      index: 2,
      type: 'text',
      speaker: '旁白',
      text: '每六十年一次，七位魔术师会召唤七位英灵，争夺能实现任何愿望的圣杯。',
      bgImage: 'https://picsum.photos/id/1025/1920/1080',
      theme: 'dark',
      tags: ['introduction', 'lore']
    },
    {
      index: 3,
      type: 'text',
      speaker: '士郎',
      text: '（这就是...圣杯战争吗？）',
      bgImage: 'https://picsum.photos/id/1025/1920/1080',
      theme: 'dark',
      characterImageLeft: '/storyImage/Seraphina.png',
      tags: ['protagonist']
    },
    {
      index: 4,
      type: 'choice',
      speaker: '旁白',
      text: '此时，一个身影出现在了你的面前...',
      bgImage: 'https://picsum.photos/id/1033/1920/1080',
      theme: 'dark',
      choices: [
        {
          text: '选择召唤Saber',
          jumpTo: 10
        },
        {
          text: '选择召唤Archer',
          jumpTo: 20
        },
        {
          text: '选择召唤Lancer',
          jumpTo: 30
        }
      ],
      tags: ['choice', 'servant-selection']
    },
    // Saber路线
    {
      index: 10,
      type: 'text',
      speaker: 'Saber',
      text: '问你一句，你就是我的Master吗？',
      bgImage: 'https://picsum.photos/id/1040/1920/1080',
      theme: 'light',
      characterImageRight: '/storyImage/Seraphina.png',
      soundEffect: 'summon.mp3',
      tags: ['saber', 'route']
    },
    {
      index: 11,
      type: 'text',
      speaker: '士郎',
      text: '是的，我会成为你的Master。让我们一起战斗吧！',
      bgImage: 'https://picsum.photos/id/1040/1920/1080',
      theme: 'light',
      characterImageLeft: '/storyImage/Seraphina.png',
      tags: ['saber', 'route']
    },
    // Archer路线
    {
      index: 20,
      type: 'text',
      speaker: 'Archer',
      text: '哼，看来我被一个奇怪的家伙召唤了。',
      bgImage: 'https://picsum.photos/id/1045/1920/1080',
      theme: 'dark',
      characterImageRight: '/storyImage/Seraphina.png',
      soundEffect: 'summon.mp3',
      tags: ['archer', 'route']
    },
    {
      index: 21,
      type: 'text',
      speaker: '士郎',
      text: '虽然你看起来很不友善，但请你多多指教。',
      bgImage: 'https://picsum.photos/id/1045/1920/1080',
      theme: 'dark',
      characterImageLeft: '/storyImage/Seraphina.png',
      tags: ['archer', 'route']
    },
    // Lancer路线
    {
      index: 30,
      type: 'text',
      speaker: 'Lancer',
      text: '哈哈！总算等到了一场好战斗！',
      bgImage: 'https://picsum.photos/id/1048/1920/1080',
      theme: 'dark',
      characterImageRight: '/storyImage/Seraphina.png',
      soundEffect: 'summon.mp3',
      tags: ['lancer', 'route']
    },
    {
      index: 31,
      type: 'text',
      speaker: '士郎',
      text: '看起来是一个很有活力的英灵...希望我们能配合好。',
      bgImage: 'https://picsum.photos/id/1048/1920/1080',
      theme: 'dark',
      characterImageLeft: '/storyImage/Seraphina.png',
      tags: ['lancer', 'route']
    }
  ],
  isActive: true,
  displayOrder: 2,
  metadata: {
    author: 'TYPE-MOON (Demo)',
    version: '1.0.0',
    language: 'zh-CN',
    totalScenes: 12,
    estimatedPlayTime: 15
  }
};

// 初始化数据库
async function initializeDatabase() {
  try {
    console.log('\n🚀 开始初始化剧本数据...\n');

    // 清空现有数据（可选）
    const existingCount = await NovelScript.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  发现 ${existingCount} 个现有剧本`);
      console.log('正在清空现有数据...');
      await NovelScript.deleteMany({});
      console.log('✅ 清空完成\n');
    }

    // 插入示例剧本
    console.log('📝 插入示例剧本...');
    
    const script1 = new NovelScript(sampleScript);
    await script1.save();
    console.log(`✅ 创建剧本: ${script1.scriptName} (${script1.metadata.totalScenes} 个场景)`);

    const script2 = new NovelScript(advancedScript);
    await script2.save();
    console.log(`✅ 创建剧本: ${script2.scriptName} (${script2.metadata.totalScenes} 个场景)`);

    console.log('\n✨ 数据初始化完成！\n');
    console.log('可用的剧本:');
    console.log(`  1. ${script1.scriptId} - ${script1.scriptName}`);
    console.log(`  2. ${script2.scriptId} - ${script2.scriptName}`);
    console.log('\n使用方法:');
    console.log(`  GET /api/mongo/novel-scripts/${script1.scriptId}`);
    console.log(`  GET /api/mongo/novel-scripts/${script2.scriptId}`);
    console.log('');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await connectDB();
    await initializeDatabase();
    
    console.log('🎉 所有操作完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { initializeDatabase };







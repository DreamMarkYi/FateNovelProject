const { connectMongoDB } = require('../config/mongodb');
const StartPageScript = require('../schemas/startPageScriptSchema');

// StartPage 剧本数据
const startPageScriptData = {
  scriptId: 'start_script_v1',
  version: '1.0.0',
  name: '白昼与永夜',
  description: 'Start Page 互动剧本 - 探索黑白交织的边界',
  scenes: [
    // --- Intro ---
    { 
      id: 0, 
      type: 'intro', 
      text: '如果你在读这段文字，说明你终于醒了。', 
      anim: 'blink-long', 
      nextId: 1 
    },
    { 
      id: 1, 
      type: 'intro', 
      text: '昨晚的梦很长，对吗？长到让你分不清现在是黑夜还是白昼。', 
      anim: 'blink-fast', 
      nextId: 2 
    },
    { 
      id: 2, 
      type: 'intro', 
      text: '别害怕。在这个房间里，时间是静止的。', 
      anim: 'blink-fast', 
      nextId: 3 
    },
    { 
      id: 3, 
      type: 'intro', 
      text: '你会慢慢想起一切。但在那之前……', 
      anim: 'blink-fast', 
      nextId: 4 
    },
    { 
      id: 4, 
      type: 'intro', 
      text: '告诉我，我该怎么称呼现在的你？', 
      anim: 'blink-fast', 
      nextId: 10 
    },

    // --- 阶段 2: 身份选择 ---
    { 
      id: 10, 
      type: 'gate', 
      theme: 'gate', 
      text: '在黑白交织的边界<br>你以何种形态存在？' 
    },
    { 
      id: 11, 
      type: 'input', 
      theme: 'gate' 
    },

    // --- 阶段 3: 身份确认分支 ---
    { 
      id: 20, 
      type: 'center', 
      theme: 'void', 
      text: '无名者……<br>看来你已决定归于尘土。', 
      anim: 'fade', 
      nextId: 30 
    },
    { 
      id: 21, 
      type: 'center', 
      theme: 'gate', 
      text: '" ${name} "<br>是的，这正是将你锚定于此的咒语。', 
      anim: 'fade', 
      nextId: 30 
    },

    // --- 阶段 4: 第一个抉择 ---
    {
      id: 30, 
      type: 'quiz', 
      text: '既然找回了意识，你必须做出第一个选择。<br>在这个没有光的世界里，你渴望什么？',
      choices: [
        { text: '微光的窄门', sub: 'Narrow Glimmer', score: 1, nextId: 31 },
        { text: '漆黑的洞口', sub: 'Abyssal Void', score: -1, nextId: 31 }
      ]
    },
    {
      id: 31, 
      type: 'quiz', 
      text: '在绝对的寂静中<br>你似乎听到了...',
      choices: [
        { text: '时钟的滴答声', sub: 'Ticking Clock', score: 1, nextId: 99 },
        { text: '遥远的心跳声', sub: 'Distant Heartbeat', score: -1, nextId: 99 }
      ]
    },

    // --- 阶段 5: 结局场景 ---
    // 注意：不包含 id: 99 的 calc 类型场景
    { 
      id: 100, 
      type: 'center', 
      theme: 'gate', 
      text: '光线透过灰尘洒下。${name}，你选择了清醒的荒凉。', 
      anim: 'fade' 
    },
    { 
      id: 200, 
      type: 'center', 
      theme: 'gate', 
      text: '黑暗温柔地包裹了一切。${name}，欢迎回到沉睡之地。', 
      anim: 'fade' 
    }
  ],
  endings: [
    {
      endingId: 100,
      type: 'day',
      sceneId: 100,
      condition: {
        minScore: 1  // 分数 > 0 触发白昼结局
      }
    },
    {
      endingId: 200,
      type: 'night',
      sceneId: 200,
      condition: {
        maxScore: 0  // 分数 <= 0 触发永夜结局
      }
    }
  ],
  isActive: true,
  createdBy: 'system'
};

async function initStartPageScript() {
  try {
    console.log('🔧 正在初始化 StartPage 剧本数据...\n');
    
    // 连接 MongoDB
    const connected = await connectMongoDB();
    if (!connected) {
      throw new Error('MongoDB 连接失败');
    }
    
    console.log('📄 检查现有剧本...');
    
    // 检查是否已存在
    const existingScript = await StartPageScript.findOne({ 
      scriptId: startPageScriptData.scriptId 
    });
    
    if (existingScript) {
      console.log('⚠️  剧本已存在，将更新数据...');
      
      // 更新现有剧本
      Object.assign(existingScript, startPageScriptData);
      await existingScript.save();
      
      console.log('✅ 剧本更新成功！');
    } else {
      console.log('📝 创建新剧本...');
      
      // 创建新剧本
      const script = new StartPageScript(startPageScriptData);
      await script.save();
      
      console.log('✅ 剧本创建成功！');
    }
    
    // 显示统计信息
    console.log('\n📊 剧本统计:');
    console.log(`   剧本ID: ${startPageScriptData.scriptId}`);
    console.log(`   版本: ${startPageScriptData.version}`);
    console.log(`   场景数量: ${startPageScriptData.scenes.length}`);
    console.log(`   结局数量: ${startPageScriptData.endings.length}`);
    console.log(`   状态: ${startPageScriptData.isActive ? '已激活' : '未激活'}`);
    
    console.log('\n='.repeat(60));
    console.log('✨ StartPage 剧本初始化完成！');
    console.log('='.repeat(60));
    console.log('\n可以通过以下 API 访问：');
    console.log('  GET  /api/mongo/start-page-script/active');
    console.log('  POST /api/mongo/start-page-script/calculate-ending');
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

// 执行初始化
if (require.main === module) {
  initStartPageScript();
}

module.exports = initStartPageScript;


const mongoose = require('mongoose');
const config = require('../../config');
const DoodleStory = require('../schemas/doodleStorySchema');

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

// 初始化涂鸦故事数据
async function initDoodleStories() {
  try {
    console.log('\n🔧 开始初始化涂鸦故事数据...\n');
    
    // 检查是否已存在数据
    const existingCount = await DoodleStory.countDocuments();
    console.log(`📊 数据库中现有 ${existingCount} 条记录`);
    
    // 从前端代码中提取的默认数据
    const defaultStories = [
      {
        dateMark: '上课无聊画的',
        date: '2016年10月21日',
        title: '汉堡店的秘密',
        content: [
          '今天做了一件"坏事"。 我带着琉璃,还有顺手抓来的秋山,逃掉了学生会的例会。',
          '理由很简单:琉璃盯着校门口快餐店的眼神太直白了。那个平日里完美无缺的大小姐 ,居然会对廉价的油炸食品露出这种渴望又胆怯的表情,实在让人没法放着不管。',
          '到了店里,琉璃拿着汉堡的样子如临大敌。果然,第一口下去,番茄酱就沾到了嘴角。 她瞬间僵住,脸色惨白,仿佛犯下了什么不可饶恕的社交错误。',
          '笨蛋秋山叹了口气,极其自然地递过一张纸巾,用那种毫无起伏的语调说:"神代同学,这里没有观众,也没人给你打分,放松点。"',
          '琉璃愣了一下,脸颊瞬间涨红。她狠狠瞪了痕一眼,接过纸巾擦掉了污渍,但紧绷的肩膀却垮了下来。',
          'P.S. 其实,我早就注意到痕的口袋里装着那包没开封的纸巾了。 故意没提醒琉璃小心酱汁,就是想看看那个木头会怎么做。'
        ],
        signature: '遥',
        image: 'https://mini-story-bg.oss-cn-shanghai.aliyuncs.com/MiniStoryBG1.png',
        isActive: true,
        displayOrder: 0
      },
      {
        dateMark: '不开心',
        date: '2016年11月05日',
        title: '图书馆的偶遇',
        content: [
          '如果有"在毫无意义的事情上浪费人生"的比赛，痕这家伙绝对能拿金牌。',
          '今天躲雨的时候钻进了一家电玩城。本来只是想打发时间，结果这家伙在一台抓娃娃机前走不动路了。橱窗里明明只是一只长得像被生活痛殴过的、眼歪嘴斜的蓝色鲨鱼玩偶，审美奇差无比。但整个笨蛋就像是被下了降头一样，死死盯着那只鲨鱼。',
          '真的太好笑了。 平日里那副对什么都提不起劲、仿佛看破红尘的死鱼眼去哪了？现在这个为了几十块钱的布偶跟机器较劲的笨蛋是谁啊？',
          '"喂，秋山同学"，"再投下去，这只鲨鱼的身价都要超过神户牛肉了。"',
          '痕被我吓得手一抖，摇杆一歪，爪子却奇迹般地勾住了鲨鱼的尾巴。 伴随着欢快的廉价电子音，那只丑鲨鱼滚了出来。',
          '他愣了一下，把玩偶从取物口拿出来，长舒了一口气，然后极其顺手地，把那个丑东西塞进了我的怀里。',
          '"拿去堵住你的嘴。"',
          '既然你这么诚心诚意地供奉了，本小姐就勉为其难收下吧。 虽然它真的很丑，丑得和你刚才那副不服输的表情一模一样。',
          'P.S. 回家把鲨鱼摆在床头了。 盯着看了会儿，发现这鲨鱼死气沉沉的眼神……怎么越看越像痕？ 以后心情不好的时候，就戳它的脸出气好了。'
        ],
        signature: '遥',
        image: 'https://mini-story-bg.oss-cn-shanghai.aliyuncs.com/MiniStoryBG2.png',
        isActive: true,
        displayOrder: 1
      }
    ];
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (let i = 0; i < defaultStories.length; i++) {
      const storyData = defaultStories[i];
      
      // 检查是否已存在相同标题的故事
      const existingStory = await DoodleStory.findOne({ 
        title: storyData.title,
        date: storyData.date
      });
      
      if (existingStory) {
        console.log(`⚠️  故事 "${storyData.title}" 已存在，跳过...`);
        updatedCount++;
        continue;
      }
      
      // 创建新故事
      const story = new DoodleStory({
        ...storyData,
        metadata: {
          createdAt: new Date(),
          lastUpdated: new Date()
        }
      });
      
      await story.save();
      createdCount++;
      console.log(`✅ 已创建故事: "${storyData.title}" (ID: ${story._id})`);
    }
    
    console.log('\n✅ 涂鸦故事数据初始化完成！');
    console.log(`   - 创建新记录: ${createdCount} 条`);
    console.log(`   - 已存在记录: ${updatedCount} 条`);
    console.log(`   - 总计: ${await DoodleStory.countDocuments()} 条`);
    
    // 显示所有激活的故事
    const activeStories = await DoodleStory.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .select('title date displayOrder');
    
    if (activeStories.length > 0) {
      console.log('\n📖 激活的故事列表:');
      activeStories.forEach((story, index) => {
        console.log(`   ${index + 1}. ${story.title} (${story.date}) - 顺序: ${story.displayOrder}`);
      });
    }
    
    console.log('\n🎉 初始化完成！现在可以通过以下API访问数据：');
    console.log(`   GET /api/mongo/doodle-stories/active - 获取所有激活的故事`);
    console.log(`   GET /api/mongo/doodle-stories - 获取所有故事`);
    console.log(`   GET /api/mongo/doodle-stories/:id - 根据ID获取故事`);
    console.log(`   POST /api/mongo/doodle-stories - 创建新故事`);
    console.log(`   POST /api/mongo/doodle-stories/batch - 批量创建故事`);
    console.log(`   PUT /api/mongo/doodle-stories/:id - 更新故事`);
    
  } catch (error) {
    console.error('❌ 初始化涂鸦故事数据失败:', error);
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
    
    await initDoodleStories();
    
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

module.exports = { initDoodleStories, connectMongoDB };































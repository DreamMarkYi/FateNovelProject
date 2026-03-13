const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { testConnection } = require('./config/database');
const { connectMongoDB } = require('./config/mongodb');

// MySQL路由
const contentRoutes = require('./routes/contentRoutes');
const storySectionRoutes = require('./routes/storySectionRoutes');

// MongoDB路由
const novelRoutes = require('./routes/mongo/novelRoutes');
const chapterRoutes = require('./routes/mongo/chapterRoutes');
const storySectionMongoRoutes = require('./routes/mongo/storySectionMongoRoutes');
const roomMongoRoutes = require('./routes/mongo/roomMongoRoutes');
const conceptMongoRoutes = require('./routes/mongo/conceptMongoRoutes');
const sowakaStoryRoutes = require('./routes/mongo/sowakaStoryRoutes');
const novelScriptRoutes = require('./routes/mongo/novelScriptRoutes');
const gameSaveRoutes = require('./routes/mongo/gameSaveRoutes');
const startChoiceRoutes = require('./routes/mongo/startChoiceRoutes');
const startPageScriptRoutes = require('./routes/mongo/startPageScriptRoutes');
const miscMessageRoutes = require('./routes/mongo/miscMessageRoutes');
const characterCardRoutes = require('./routes/mongo/characterCardRoutes');
const doodleStoryRoutes = require('./routes/mongo/doodleStoryRoutes');
const battleSimulatorRoutes = require('./routes/battleSimulatorRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');

const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// 请求体解析 - 增加限制以支持大型战斗数据
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 压缩响应
app.use(compression());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制100个请求
});
app.use('/api/', limiter);

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MySQL API路由
app.use('/api/contents', contentRoutes);
app.use('/api/story-sections', storySectionRoutes);

// MongoDB API路由
app.use('/api/mongo/novels', novelRoutes);
app.use('/api/mongo/chapters', chapterRoutes);
app.use('/api/mongo/story-sections', storySectionMongoRoutes);
app.use('/api/mongo/rooms', roomMongoRoutes);
app.use('/api/mongo/concepts', conceptMongoRoutes);
app.use('/api/mongo/sowaka-stories', sowakaStoryRoutes);
app.use('/api/mongo/novel-scripts', novelScriptRoutes);
app.use('/api/mongo/game-saves', gameSaveRoutes);
app.use('/api/mongo/start-choices', startChoiceRoutes);
app.use('/api/mongo/start-page-script', startPageScriptRoutes);
app.use('/api/mongo/misc-messages', miscMessageRoutes);
app.use('/api/mongo/character-cards', characterCardRoutes);
app.use('/api/mongo/doodle-stories', doodleStoryRoutes);
app.use('/api/battle-simulator', battleSimulatorRoutes);
app.use('/api/portfolio', portfolioRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '轻小说阅读网站API - MySQL + MongoDB混合架构',
    version: '2.0.0',
    databases: {
      mysql: 'MySQL - 用于用户、认证等关系型数据',
      mongodb: 'MongoDB - 用于小说、章节等文档数据'
    },
    endpoints: {
      // MySQL端点
      mysql: {
        contents: '/api/contents',
        contentsByType: '/api/contents/type/:type',
        contentById: '/api/contents/:id',
        storySections: '/api/story-sections',
        activeStorySections: '/api/story-sections/active'
      },
      // MongoDB端点
      mongodb: {
        novels: '/api/mongo/novels',
        novelsPublished: '/api/mongo/novels/published',
        chapters: '/api/mongo/chapters',
        chaptersByNovel: '/api/mongo/chapters/novel/:novelId',
        storySections: '/api/mongo/story-sections',
        activeStorySections: '/api/mongo/story-sections/active',
        rooms: '/api/mongo/rooms',
        availableRooms: '/api/mongo/rooms/available',
        concepts: '/api/mongo/concepts',
        activeConcepts: '/api/mongo/concepts/active',
        sowakaStories: '/api/mongo/sowaka-stories',
        currentSowakaStory: '/api/mongo/sowaka-stories/current',
        novelScripts: '/api/mongo/novel-scripts',
        novelScriptById: '/api/mongo/novel-scripts/:scriptId',
        gameSaves: '/api/mongo/game-saves/player/:playerId',
        saveGame: '/api/mongo/game-saves/player/:playerId/slot/:saveSlot',
        startChoices: '/api/mongo/start-choices',
        createPlayer: '/api/mongo/start-choices/create-player',
        startStatistics: '/api/mongo/start-choices/statistics',
        doodleStories: '/api/mongo/doodle-stories',
        activeDoodleStories: '/api/mongo/doodle-stories/active'
      },
      portfolio: {
        listArticles: '/api/portfolio/articles',
        articleById: '/api/portfolio/articles/:id',
        saveArticle: '/api/portfolio/articles'
      }
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'development' ? err.message : '服务器内部错误'
  });
});

// 启动服务器
async function startServer() {
  try {
    console.log('\n🔧 正在初始化服务器...\n');
    
    // 测试MySQL连接
    console.log('📊 连接MySQL数据库...');
    const mysqlConnected = await testConnection();
    
    if (!mysqlConnected) {
      console.error('⚠️  MySQL连接失败，但服务器仍将启动');
      console.error('请检查MySQL配置并运行初始化脚本');
    }
    
    // 连接MongoDB
    console.log('📄 连接MongoDB数据库...');
    const mongoConnected = await connectMongoDB();
    
    if (!mongoConnected) {
      console.error('⚠️  MongoDB连接失败，但服务器仍将启动');
      console.error('请检查MongoDB配置和服务状态');
    }
    
    console.log('');
    
    // 启动服务器
    app.listen(config.port, () => {
      console.log('='.repeat(60));
      console.log(`🚀 服务器运行在: http://localhost:${config.port}`);
      console.log(`📝 环境: ${config.nodeEnv}`);
      console.log('='.repeat(60));
      console.log('\n数据库连接状态:');
      console.log(`  MySQL:   ${mysqlConnected ? '✅ 已连接' : '❌ 未连接'} - ${config.database.host}:${config.database.port}`);
      console.log(`  MongoDB: ${mongoConnected ? '✅ 已连接' : '❌ 未连接'} - ${config.mongodb.uri}`);
      console.log('='.repeat(60));
      console.log('\nMySQL API端点:');
      console.log(`  GET  /api/contents               - 获取所有内容`);
      console.log(`  GET  /api/contents/type/:type    - 获取指定类型内容`);
      console.log(`  GET  /api/story-sections/active  - 获取激活的故事章节`);
      console.log('\nMongoDB API端点:');
      console.log(`  GET  /api/mongo/novels           - 获取所有小说`);
      console.log(`  GET  /api/mongo/novels/published - 获取已发布的小说`);
      console.log(`  GET  /api/mongo/chapters/novel/:id - 获取小说的所有章节`);
      console.log(`  GET  /api/mongo/rooms/available  - 获取可用房间`);
      console.log(`  GET  /api/mongo/concepts/active  - 获取激活的概念`);
      console.log(`  GET  /api/mongo/sowaka-stories/current - 获取当前Sowaka故事`);
      console.log(`  GET  /api/mongo/novel-scripts/:scriptId - 获取剧本脚本`);
      console.log(`  GET  /api/mongo/game-saves/player/:playerId - 获取玩家存档`);
      console.log(`  GET  /api/mongo/doodle-stories/active - 获取激活的涂鸦故事`);
      console.log('\n详细API文档: http://localhost:${config.port}/');
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;



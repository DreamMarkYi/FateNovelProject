// 配置文件（如果.env不可用，使用此文件）
module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MySQL数据库配置（用于用户、认证等关系型数据）
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'aa8455460',
    database: process.env.DB_NAME || 'novel_reading_db'
  },
  
  // MongoDB数据库配置（用于小说、章节等文档数据）
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/novel_reading_db',
    options: {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    }
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
};



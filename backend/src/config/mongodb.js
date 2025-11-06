const mongoose = require('mongoose');
const config = require('../../config');

// MongoDB连接
let isConnected = false;

async function connectMongoDB() {
  if (isConnected) {
    console.log('✅ MongoDB 已连接');
    return true;
  }

  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    isConnected = true;
    console.log('✅ MongoDB 连接成功');
    console.log(`📂 数据库: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    return false;
  }
}

// 监听连接事件
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose 已连接到 MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose 连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose 已断开连接');
  isConnected = false;
});

// 优雅关闭
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB 连接已通过 app 终止关闭');
    process.exit(0);
  } catch (err) {
    console.error('关闭 MongoDB 连接时出错:', err);
    process.exit(1);
  }
});

module.exports = {
  connectMongoDB,
  mongoose
};


# MongoDB快速启动指南

## 🚀 快速开始（3步启动）

### 步骤1: 安装依赖

```bash
cd backend
npm install
```

### 步骤2: 初始化数据库

```bash
# 确保MongoDB服务已启动
# Windows: net start MongoDB
# macOS/Linux: sudo systemctl start mongod

# 初始化MongoDB数据库
npm run init-mongodb

# 或初始化所有数据库（MySQL + MongoDB）
npm run init-db
```

### 步骤3: 启动服务器

```bash
npm run dev
```

## ✅ 验证安装

访问 http://localhost:3000/，应该看到：

```json
{
  "message": "轻小说阅读网站API - MySQL + MongoDB混合架构",
  "version": "2.0.0",
  "databases": {
    "mysql": "MySQL - 用于用户、认证等关系型数据",
    "mongodb": "MongoDB - 用于小说、章节等文档数据"
  },
  "endpoints": {
    "mongodb": {
      "novels": "/api/mongo/novels",
      "chapters": "/api/mongo/chapters",
      "storySections": "/api/mongo/story-sections",
      "rooms": "/api/mongo/rooms",
      "concepts": "/api/mongo/concepts"
    }
  }
}
```

## 🧪 测试API

### 测试故事章节API
```bash
curl http://localhost:3000/api/mongo/story-sections/active
```

### 测试小说API
```bash
curl http://localhost:3000/api/mongo/novels/published
```

### 测试房间API
```bash
curl http://localhost:3000/api/mongo/rooms/available
```

## 📦 NPM Scripts

```bash
npm start          # 启动服务器
npm run dev        # 开发模式（自动重启）
npm run init-mysql # 初始化MySQL数据库
npm run init-mongodb # 初始化MongoDB数据库
npm run init-db    # 初始化所有数据库
```

## 🔍 常见问题

### MongoDB连接失败

**问题**: `MongoDB连接失败`

**解决方案**:
```bash
# 检查MongoDB是否运行
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
sudo systemctl status mongod
```

### 端口被占用

**问题**: `MongoDB端口27017被占用`

**解决方案**:
```bash
# 修改 backend/config.js 中的MongoDB URI
mongodb: {
  uri: 'mongodb://localhost:27018/novel_reading_db'  // 使用其他端口
}
```

### 初始化失败

**问题**: `数据库初始化失败`

**解决方案**:
1. 确保MongoDB服务正在运行
2. 检查连接字符串配置
3. 查看详细错误信息
4. 清空数据库重新初始化

```bash
# 进入MongoDB shell
mongosh

# 删除数据库
use novel_reading_db
db.dropDatabase()

# 重新初始化
npm run init-mongodb
```

## 📝 配置说明

### 默认配置 (backend/config.js)

```javascript
mongodb: {
  uri: 'mongodb://localhost:27017/novel_reading_db'
}
```

### 自定义配置

创建 `.env` 文件：

```env
MONGODB_URI=mongodb://username:password@host:port/database
```

## 🎯 下一步

1. **查看完整文档**: `MongoDB集成完整指南.md`
2. **测试前端集成**: 启动web-project并访问SowakaPage
3. **探索API**: 使用Postman或curl测试所有端点
4. **数据管理**: 使用MongoDB Compass可视化管理数据

## 📚 相关文档

- [MongoDB集成完整指南.md](../MongoDB集成完整指南.md)
- [Story章节表说明.md](Story章节表说明.md)
- [快速启动指南.md](快速启动指南.md)

---

**快速帮助**: 遇到问题？运行 `npm run dev` 查看详细的启动日志。


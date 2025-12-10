# Start Page 快速启动指南

## 🚀 快速开始（5分钟）

### 步骤 1：安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../web-project
npm install
```

### 步骤 2：启动 MongoDB

Windows：
```bash
mongod --dbpath "C:\data\db"
```

Mac/Linux：
```bash
mongod --dbpath /data/db
```

### 步骤 3：启动后端服务器

```bash
cd backend
npm start
```

看到以下输出表示成功：
```
🚀 服务器运行在: http://localhost:3000
MongoDB: ✅ 已连接
```

### 步骤 4：启动前端开发服务器

```bash
cd web-project
npm run dev
```

### 步骤 5：访问页面

打开浏览器访问：`http://localhost:5173/start`

## ✅ 验证功能

### 1. 测试用户输入
1. 访问 `/start` 页面
2. 点击进入游戏
3. 选择 "刻下名讳"
4. 输入名字（如：张三）
5. 确定

**检查**：浏览器控制台应显示 `玩家创建成功`

### 2. 测试选择记录
1. 继续游戏到选择场景
2. 点击任一选项卡片
3. 再次进行第二个选择

**检查**：控制台应显示 `选择已记录`（两次）

### 3. 测试结局保存
1. 到达结局
2. 查看结局文字

**检查**：控制台应显示 `游戏完成` 和最终结果（白昼或永夜）

### 4. 查看数据库记录

连接 MongoDB：
```bash
mongosh mongodb://localhost:27017/novel_reading
```

查询记录：
```javascript
// 查看所有游戏记录
db.start_choice_records.find().pretty()

// 查看统计
db.start_choice_records.aggregate([
  { $group: { _id: "$finalResult", count: { $sum: 1 } } }
])
```

## 🔧 配置选项

### 修改 API 地址

创建 `web-project/.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:3000
```

如果后端在其他服务器：
```env
VITE_API_BASE_URL=http://your-server.com:3000
```

### 修改数据库

编辑 `backend/config.js`：
```javascript
mongodb: {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/novel_reading',
  options: {
    // ... 选项
  }
}
```

## 📊 查看统计数据

### 使用浏览器

访问：`http://localhost:3000/api/mongo/start-choices/statistics`

返回示例：
```json
{
  "success": true,
  "data": {
    "total": 100,
    "day": 60,
    "night": 40,
    "dayPercentage": "60.00",
    "nightPercentage": "40.00"
  }
}
```

### 使用命令行

```bash
curl http://localhost:3000/api/mongo/start-choices/statistics
```

## 🧪 运行测试

### Windows

```bash
cd backend
quick-start-test.bat
```

### Mac/Linux

```bash
cd backend
curl -X POST http://localhost:3000/api/mongo/start-choices/create-player \
  -H "Content-Type: application/json" \
  -d '{"playerName":"测试","identityChoice":"named"}'
```

## 🐛 故障排查

### 问题 1：MongoDB 连接失败

**错误信息**：`MongoServerError: connect ECONNREFUSED`

**解决方案**：
1. 确认 MongoDB 是否运行
2. 检查端口 27017 是否被占用
3. 查看 MongoDB 日志

### 问题 2：后端启动失败

**错误信息**：`Error: Cannot find module 'uuid'`

**解决方案**：
```bash
cd backend
npm install uuid
```

### 问题 3：前端无法连接后端

**错误信息**：浏览器控制台 `Network Error`

**解决方案**：
1. 确认后端是否运行（访问 http://localhost:3000/health）
2. 检查 CORS 配置
3. 查看浏览器开发者工具 Network 标签

### 问题 4：玩家创建失败

**错误信息**：`创建玩家失败`

**检查**：
1. MongoDB 是否正常连接
2. 后端日志是否有错误
3. playerName 和 identityChoice 是否正确传递

## 📱 完整测试流程

### 测试脚本
```javascript
// 在浏览器控制台运行

// 1. 打开 /start 页面
// 2. 粘贴以下代码到控制台

// 监听所有API调用
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('API调用:', args[0]);
  return originalFetch.apply(this, args)
    .then(res => {
      console.log('API响应:', res);
      return res;
    });
};

console.log('✅ API监听已启用');
```

### 预期输出
```
API调用: http://localhost:3000/api/mongo/start-choices/create-player
玩家创建成功: {playerId: "start_xxx", ...}

API调用: http://localhost:3000/api/mongo/start-choices/player/start_xxx/choice
选择已记录

API调用: http://localhost:3000/api/mongo/start-choices/player/start_xxx/choice
选择已记录

API调用: http://localhost:3000/api/mongo/start-choices/player/start_xxx/complete
游戏完成: {finalResult: "day", ...}
```

## 📈 数据分析示例

### 查询所有白昼结局
```javascript
db.start_choice_records.find({ finalResult: "day" }).count()
```

### 查询平均游戏时长
```javascript
db.start_choice_records.aggregate([
  { $group: { _id: null, avgTime: { $avg: "$playTime" } } }
])
```

### 查询最受欢迎的选择
```javascript
db.start_choice_records.aggregate([
  { $unwind: "$choices" },
  { $group: { 
    _id: "$choices.choiceText", 
    count: { $sum: 1 } 
  }},
  { $sort: { count: -1 } },
  { $limit: 5 }
])
```

## 🎯 下一步

1. ✅ 系统运行成功
2. 📊 查看数据统计
3. 🎨 自定义 UI（如需要）
4. 🚀 部署到生产环境

## 📚 相关文档

- [完整 API 文档](./START_PAGE_API_INTEGRATION.md)
- [后端 README](./backend/README.md)
- [MongoDB 启动指南](./backend/MongoDB快速启动指南.md)

## 💡 提示

- 游戏数据自动保存，无需手动操作
- 可以重复游玩，每次会生成新的记录
- 统计数据实时更新
- 所有数据存储在本地 MongoDB

## ⚡ 性能优化

如果游戏运行缓慢：
1. 检查 MongoDB 索引是否创建
2. 减少 API 调用频率
3. 启用数据库缓存
4. 使用生产环境构建

## 🔒 隐私说明

收集的数据：
- ✅ 游戏内名字（非真实姓名）
- ✅ 游戏选择记录
- ✅ 完成时间

不收集：
- ❌ 真实个人信息
- ❌ 支付信息
- ❌ 账号密码

所有数据仅用于改善游戏体验。

---

**需要帮助？** 查看详细文档：[START_PAGE_API_INTEGRATION.md](./START_PAGE_API_INTEGRATION.md)


# Start Page API 集成说明

## 概述
本文档说明如何将 Start Page 与后端 MongoDB 数据库集成，实现用户信息收集功能。

## 架构设计

### 数据表设计

#### 1. `start_choice_records` 集合（新增）
存储用户在 Start Page 的选择记录

**字段说明**：
- `playerId`: String - 玩家唯一ID（由后端生成）
- `playerName`: String - 玩家输入的名字
- `identityChoice`: String - 身份选择（'named' 或 'anon'）
- `choices`: Array - 用户选择记录
  - `sceneId`: Number - 场景ID
  - `choiceText`: String - 选择文本
  - `score`: Number - 选择分数
  - `timestamp`: Date - 选择时间
- `finalScore`: Number - 最终分数
- `finalResult`: String - 最终结果（'day' 白昼 / 'night' 永夜）
- `endingId`: Number - 结局ID（100或200）
- `completedAt`: Date - 完成时间
- `playTime`: Number - 游戏时长（秒）
- `ipAddress`: String - IP地址
- `userAgent`: String - 浏览器信息

#### 2. `game_saves` 集合（关联）
使用相同的 `playerId` 关联存档信息

## 后端实现

### 文件结构
```
backend/
├── src/
│   ├── schemas/
│   │   └── startChoiceRecordSchema.js    # 新增：数据模型
│   ├── controllers/mongo/
│   │   └── startChoiceController.js      # 新增：业务逻辑
│   ├── routes/mongo/
│   │   └── startChoiceRoutes.js          # 新增：路由定义
│   └── app.js                            # 已更新：注册路由
└── package.json                          # 已更新：添加uuid依赖
```

### API 端点

#### 1. 创建玩家
```http
POST /api/mongo/start-choices/create-player
Content-Type: application/json

{
  "playerName": "张三",
  "identityChoice": "named"
}

响应：
{
  "success": true,
  "message": "玩家创建成功",
  "data": {
    "playerId": "start_uuid-here",
    "playerName": "张三",
    "recordId": "mongodb-id"
  }
}
```

#### 2. 记录用户选择
```http
POST /api/mongo/start-choices/player/{playerId}/choice
Content-Type: application/json

{
  "sceneId": 30,
  "choiceText": "微光的窄门",
  "score": 1
}

响应：
{
  "success": true,
  "message": "选择记录成功",
  "data": {
    "currentScore": 1,
    "choiceCount": 1
  }
}
```

#### 3. 完成游戏
```http
POST /api/mongo/start-choices/player/{playerId}/complete
Content-Type: application/json

{
  "endingId": 100,
  "playTime": 180
}

响应：
{
  "success": true,
  "message": "游戏完成",
  "data": {
    "finalScore": 2,
    "finalResult": "day",
    "endingId": 100,
    "playTime": 180
  }
}
```

#### 4. 获取统计数据
```http
GET /api/mongo/start-choices/statistics

响应：
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

#### 5. 获取场景选择统计
```http
GET /api/mongo/start-choices/scene/30/statistics

响应：
{
  "success": true,
  "data": {
    "sceneId": 30,
    "choices": [
      { "text": "微光的窄门", "count": 60 },
      { "text": "漆黑的洞口", "count": 40 }
    ]
  }
}
```

## 前端实现

### 文件结构
```
web-project/
├── src/
│   ├── api/
│   │   └── startChoiceApi.js       # 新增：API服务封装
│   └── views/
│       └── StartPage.vue           # 已更新：集成API调用
└── .env                            # 需创建：环境变量配置
```

### 环境变量配置

创建 `.env` 文件（在 `web-project` 目录）：
```bash
# API配置
VITE_API_BASE_URL=http://localhost:3000
```

### StartPage.vue 集成说明

#### 关键改动

1. **导入 API 服务**
```javascript
import { startChoiceApi } from '../api/startChoiceApi'
```

2. **扩展游戏状态**
```javascript
const gameState = reactive({
  name: '',
  score: 0,
  mode: 'gate',
  introFinished: false,
  playerId: '',    // 新增：后端生成的ID
  startTime: 0     // 新增：游戏开始时间
})
```

3. **身份选择时创建玩家**
```javascript
// 在 chooseIdentity 和 submitName 函数中
const response = await startChoiceApi.createPlayer(gameState.name, 'named')
gameState.playerId = response.playerId
```

4. **记录每次选择**
```javascript
// 在 selectChoice 函数中
await startChoiceApi.recordChoice(
  gameState.playerId,
  scene.id,
  choice.text,
  choice.score
)
```

5. **到达结局时完成游戏**
```javascript
// 在 renderScene 函数中检测结局
if (scene.type === 'center' && (scene.id === 100 || scene.id === 200)) {
  await handleGameComplete(scene.id)
}
```

## 安装和启动

### 1. 安装后端依赖
```bash
cd backend
npm install
```

这会自动安装新添加的 `uuid` 依赖。

### 2. 启动后端服务器
```bash
cd backend
npm start
# 或开发模式
npm run dev
```

确保：
- MongoDB 正在运行
- 端口 3000 可用

### 3. 启动前端开发服务器
```bash
cd web-project
npm run dev
```

### 4. 访问页面
打开浏览器访问：`http://localhost:5173/start`

## 数据流程

### 完整流程图
```
用户访问 /start
    ↓
用户输入名字/选择身份
    ↓
【API调用】POST /create-player
    ↓
返回 playerId
    ↓
用户进行选择
    ↓
每次选择时【API调用】POST /player/{id}/choice
    ↓
到达结局
    ↓
【API调用】POST /player/{id}/complete
    ↓
数据存储完成
```

### 数据示例

完整的数据记录示例：
```json
{
  "_id": "mongodb-id",
  "playerId": "start_uuid-here",
  "playerName": "张三",
  "identityChoice": "named",
  "choices": [
    {
      "sceneId": 30,
      "choiceText": "微光的窄门",
      "score": 1,
      "timestamp": "2024-01-01T12:00:00.000Z"
    },
    {
      "sceneId": 31,
      "choiceText": "时钟的滴答声",
      "score": 1,
      "timestamp": "2024-01-01T12:01:00.000Z"
    }
  ],
  "finalScore": 2,
  "finalResult": "day",
  "endingId": 100,
  "completedAt": "2024-01-01T12:02:00.000Z",
  "playTime": 120,
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:02:00.000Z"
}
```

## 测试

### 使用 curl 测试

1. **创建玩家**
```bash
curl -X POST http://localhost:3000/api/mongo/start-choices/create-player \
  -H "Content-Type: application/json" \
  -d '{"playerName":"测试玩家","identityChoice":"named"}'
```

2. **记录选择**（使用返回的 playerId）
```bash
curl -X POST http://localhost:3000/api/mongo/start-choices/player/start_xxx/choice \
  -H "Content-Type: application/json" \
  -d '{"sceneId":30,"choiceText":"微光的窄门","score":1}'
```

3. **完成游戏**
```bash
curl -X POST http://localhost:3000/api/mongo/start-choices/player/start_xxx/complete \
  -H "Content-Type: application/json" \
  -d '{"endingId":100,"playTime":120}'
```

4. **查看统计**
```bash
curl http://localhost:3000/api/mongo/start-choices/statistics
```

### 使用 Postman/Insomnia

导入以下集合：
- Base URL: `http://localhost:3000`
- Prefix: `/api/mongo/start-choices`

## 数据分析

### 查询 MongoDB

连接到 MongoDB：
```bash
mongosh mongodb://localhost:27017/novel_reading
```

查询所有记录：
```javascript
db.start_choice_records.find().pretty()
```

统计白昼vs永夜：
```javascript
db.start_choice_records.aggregate([
  {
    $group: {
      _id: "$finalResult",
      count: { $sum: 1 }
    }
  }
])
```

查看热门选择：
```javascript
db.start_choice_records.aggregate([
  { $unwind: "$choices" },
  {
    $group: {
      _id: {
        sceneId: "$choices.sceneId",
        text: "$choices.choiceText"
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
])
```

## 隐私和安全

### 收集的数据
- ✅ 用户输入的游戏内名字（非真实姓名）
- ✅ 游戏选择记录
- ✅ IP地址（用于统计）
- ✅ 浏览器信息（用于技术支持）

### 不收集的数据
- ❌ 真实姓名
- ❌ 邮箱地址
- ❌ 电话号码
- ❌ 支付信息

### 安全措施
1. 使用 UUID 生成唯一ID，不使用序列号
2. 不记录敏感个人信息
3. API 使用 rate limiting 防止滥用
4. 数据仅用于游戏体验优化和统计分析

## 故障排查

### 问题1：无法连接后端
**检查**：
- 后端服务器是否启动（端口3000）
- MongoDB 是否运行
- CORS 配置是否正确

### 问题2：创建玩家失败
**检查**：
- playerName 和 identityChoice 是否都提供
- MongoDB 连接是否正常
- 查看后端日志

### 问题3：记录不保存
**检查**：
- playerId 是否正确传递
- 浏览器控制台是否有错误
- 网络请求是否成功（开发者工具 Network 标签）

### 问题4：统计数据不准确
**检查**：
- 确认 completeGame API 是否被调用
- 检查 finalResult 字段是否正确设置
- 重新计算统计数据

## 扩展功能

### 未来可添加的功能

1. **用户认证**
   - 添加用户注册/登录
   - 关联多个游戏记录

2. **社交分享**
   - 分享游戏结果
   - 查看好友选择

3. **成就系统**
   - 特殊选择组合解锁成就
   - 成就展示页面

4. **数据可视化**
   - 管理后台显示统计图表
   - 实时选择热度图

5. **A/B测试**
   - 测试不同文案效果
   - 优化用户体验

## 总结

本系统实现了：
- ✅ 用户身份创建和记录
- ✅ 选择过程全程追踪
- ✅ 最终结果统计
- ✅ 数据库关联设计
- ✅ RESTful API 接口
- ✅ 前后端完整集成

所有数据仅用于改善游戏体验和统计分析，不涉及敏感个人信息。


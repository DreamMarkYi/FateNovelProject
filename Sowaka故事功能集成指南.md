# Sowaka故事功能集成指南

## 📋 功能概述

为SowakaPage.vue添加了MongoDB数据库集成功能，用于动态存储和读取故事内容，包括：
- 标题 (title)
- 副标题 (subtitle) 
- 左侧图片 (storyImageLeft)
- 右侧文本段落 (storyTextRight)
- 作者签名 (authorSignature)

## 🗂️ 新增文件

### 后端文件
1. `backend/src/schemas/sowakaStorySchema.js` - MongoDB数据模型
2. `backend/src/controllers/mongo/sowakaStoryController.js` - 业务逻辑控制器
3. `backend/src/routes/mongo/sowakaStoryRoutes.js` - API路由定义
4. `backend/src/scripts/initSowakaStory.js` - 数据库初始化脚本

### 前端文件
- 更新了 `web-project/src/api/mongoApi.js` - 添加了sowakaStoryApi
- 更新了 `web-project/src/views/SowakaPage.vue` - 集成数据库读取功能

### 测试文件
- `test-sowaka-story.js` - API功能测试脚本

## 🚀 快速启动

### 1. 启动后端服务器
```bash
cd backend
npm start
```

### 2. 初始化Sowaka故事数据
```bash
cd backend
node src/scripts/initSowakaStory.js
```

### 3. 启动前端服务器
```bash
cd web-project
npm run dev
```

### 4. 访问页面
打开浏览器访问: http://localhost:5173/sowaka

## 🔧 API端点

### 基础URL: `http://localhost:3000/api/mongo/sowaka-stories`

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/current` | 获取当前显示的故事 |
| GET | `/` | 获取所有故事 |
| GET | `/active` | 获取所有激活的故事 |
| GET | `/:id` | 根据ID获取故事 |
| POST | `/` | 创建新故事 |
| PUT | `/:id` | 更新故事 |
| DELETE | `/:id` | 删除故事 |
| PATCH | `/:id/toggle` | 切换激活状态 |

## 📊 数据结构

```javascript
{
  title: String,           // 标题，如："そわかの物語"
  subtitle: String,        // 副标题，如："STORY OF SOWAKA"
  storyImageLeft: String,  // 左侧图片URL
  storyTextRight: [String], // 右侧文本段落数组
  authorSignature: String, // 作者签名，如："— SOWAKA KYOTO"
  isActive: Boolean,       // 是否激活
  displayOrder: Number,    // 显示顺序
  metadata: {
    language: String,      // 语言，默认'ja'
    lastUpdated: Date      // 最后更新时间
  }
}
```

## 🧪 测试功能

### 运行API测试
```bash
node test-sowaka-story.js
```

### 手动测试API
```bash
# 获取当前故事
curl http://localhost:3000/api/mongo/sowaka-stories/current

# 创建新故事
curl -X POST http://localhost:3000/api/mongo/sowaka-stories \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试故事",
    "subtitle": "TEST STORY",
    "storyTextRight": ["这是测试段落1", "这是测试段落2"],
    "authorSignature": "— 测试作者"
  }'
```

## 🎨 前端集成说明

### 数据绑定
SowakaPage.vue中的故事部分现在使用Vue的响应式数据：

```vue
<template>
  <div class="story-header-large">
    <h2>{{ sowakaStory.title }}</h2>
    <p class="subtitle">{{ sowakaStory.subtitle }}</p>
  </div>
  
  <div class="story-layout">
    <div class="story-image-left">
      <img v-if="sowakaStory.storyImageLeft" 
           :src="sowakaStory.storyImageLeft" 
           :alt="sowakaStory.title" />
    </div>
    
    <div class="story-text-right">
      <p v-for="(paragraph, index) in sowakaStory.storyTextRight" 
         :key="index">
        {{ paragraph }}
      </p>
      <p class="author-signature">{{ sowakaStory.authorSignature }}</p>
    </div>
  </div>
</template>
```

### 数据加载
页面加载时自动从数据库获取数据：

```javascript
// 从MongoDB加载Sowaka故事数据
const sowakaStoryResponse = await sowakaStoryApi.getCurrentSowakaStory()
if (sowakaStoryResponse.data.success) {
  sowakaStory.value = sowakaStoryResponse.data.data
}
```

## 🔄 数据管理

### 添加新故事
```javascript
import { sowakaStoryApi } from '../api/mongoApi'

const newStory = {
  title: '新故事标题',
  subtitle: '新故事副标题',
  storyTextRight: ['段落1', '段落2', '段落3'],
  authorSignature: '— 作者名'
}

await sowakaStoryApi.createSowakaStory(newStory)
```

### 更新现有故事
```javascript
const storyId = 'your-story-id'
const updates = {
  title: '更新后的标题',
  storyTextRight: ['更新后的段落1', '更新后的段落2']
}

await sowakaStoryApi.updateSowakaStory(storyId, updates)
```

## 🛠️ 故障排除

### 常见问题

1. **API返回404错误**
   - 确保后端服务器正在运行
   - 检查MongoDB连接状态

2. **前端显示默认数据**
   - 检查数据库中是否有激活的故事记录
   - 查看浏览器控制台的错误信息

3. **数据库连接失败**
   - 确保MongoDB服务正在运行
   - 检查`backend/config.js`中的MongoDB配置

### 调试命令
```bash
# 检查MongoDB连接
cd backend
node -e "require('./src/config/mongodb').connectMongoDB()"

# 查看数据库中的故事记录
cd backend
node -e "
const mongoose = require('mongoose');
const config = require('./config');
const SowakaStory = require('./src/schemas/sowakaStorySchema');
mongoose.connect(config.mongodb.uri).then(async () => {
  const stories = await SowakaStory.find({});
  console.log('故事记录:', stories);
  process.exit(0);
});
"
```

## ✅ 验证清单

- [ ] 后端服务器启动成功
- [ ] MongoDB连接正常
- [ ] 初始化脚本执行成功
- [ ] API测试通过
- [ ] 前端页面正常显示数据库内容
- [ ] 可以通过API创建/更新/删除故事
- [ ] 前端实时反映数据库变化

## 🎉 完成！

现在SowakaPage.vue已经完全集成了MongoDB数据库功能，可以动态管理故事内容。管理员可以通过API接口轻松更新页面内容，无需修改前端代码。


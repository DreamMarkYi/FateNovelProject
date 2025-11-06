# MongoDB集成完整指南

## 📋 概述

本项目已成功集成 **MySQL + MongoDB 混合架构**，实现了两个数据库的协同工作：

- **MySQL**: 用于存储用户、认证等关系型数据
- **MongoDB**: 用于存储小说、章节、故事章节等文档数据

## 🏗️ 架构设计

### 数据库职责划分

```
MySQL (关系型数据)              MongoDB (文档型数据)
├── 用户认证信息                 ├── 小说集合 (novels)
├── 订单交易数据                 ├── 章节集合 (chapters)
├── 统计分析数据                 ├── 故事章节集合 (story_sections)
└── 权限角色管理                 ├── 房间集合 (rooms)
                                 └── 概念集合 (concepts)
```

### 为什么选择MongoDB存储小说数据？

1. **灵活的文档结构**: 小说内容、章节可以包含不同格式的数据
2. **动态字段**: 无需固定的表结构，便于扩展
3. **高效的读取**: 适合大量文本内容的存储和检索
4. **嵌套数据**: 支持段落、标签等数组数据
5. **全文搜索**: 内置的文本搜索功能

## 📦 已完成的工作

### 1. 后端实现 ✅

#### 数据库配置
- ✅ `backend/config.js` - 添加MongoDB配置
- ✅ `backend/src/config/mongodb.js` - MongoDB连接管理
- ✅ `backend/package.json` - 添加mongoose依赖

#### MongoDB Schemas
- ✅ `backend/src/schemas/novelSchema.js` - 小说Schema
- ✅ `backend/src/schemas/chapterSchema.js` - 章节Schema
- ✅ `backend/src/schemas/storySectionSchema.js` - 故事章节Schema
- ✅ `backend/src/schemas/roomSchema.js` - 房间Schema
- ✅ `backend/src/schemas/conceptSchema.js` - 概念Schema

#### MongoDB Controllers
- ✅ `backend/src/controllers/mongo/novelController.js` - 小说控制器
- ✅ `backend/src/controllers/mongo/chapterController.js` - 章节控制器
- ✅ `backend/src/controllers/mongo/storySectionMongoController.js` - 故事章节控制器
- ✅ `backend/src/controllers/mongo/roomController.js` - 房间控制器
- ✅ `backend/src/controllers/mongo/conceptController.js` - 概念控制器

#### MongoDB Routes
- ✅ `backend/src/routes/mongo/novelRoutes.js` - 小说路由
- ✅ `backend/src/routes/mongo/chapterRoutes.js` - 章节路由
- ✅ `backend/src/routes/mongo/storySectionMongoRoutes.js` - 故事章节路由
- ✅ `backend/src/routes/mongo/roomMongoRoutes.js` - 房间路由
- ✅ `backend/src/routes/mongo/conceptMongoRoutes.js` - 概念路由

#### 应用集成
- ✅ `backend/src/app.js` - 集成MongoDB路由和连接
- ✅ `backend/src/scripts/initMongoDB.js` - MongoDB初始化脚本

### 2. 前端实现 ✅

- ✅ `web-project/src/api/mongoApi.js` - MongoDB API封装
- ✅ `web-project/src/views/SowakaPage.vue` - 使用MongoDB API加载故事章节

## 🚀 快速开始

### 前置要求

1. **Node.js** >= 14.x
2. **MySQL** >= 5.7 或 8.0
3. **MongoDB** >= 4.4

### 安装MongoDB

#### Windows
```bash
# 使用Chocolatey
choco install mongodb

# 或下载安装包
# https://www.mongodb.com/try/download/community
```

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### 安装依赖

```bash
cd backend
npm install
```

这将安装包括 `mongoose` 在内的所有依赖。

### 配置数据库

编辑 `backend/config.js` 或创建 `.env` 文件：

```javascript
// backend/config.js
module.exports = {
  // MySQL配置
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_password',
    database: 'novel_reading_db'
  },
  
  // MongoDB配置
  mongodb: {
    uri: 'mongodb://localhost:27017/novel_reading_db'
  }
}
```

或使用 `.env` 文件：

```env
# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=novel_reading_db

# MongoDB
MONGODB_URI=mongodb://localhost:27017/novel_reading_db
```

### 初始化数据库

```bash
# 初始化MySQL数据库
npm run init-mysql

# 初始化MongoDB数据库
npm run init-mongodb

# 或一次性初始化两个数据库
npm run init-db
```

### 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

启动成功后会显示：

```
🔧 正在初始化服务器...

📊 连接MySQL数据库...
✅ MySQL 连接成功

📄 连接MongoDB数据库...
✅ MongoDB 连接成功

============================================================
🚀 服务器运行在: http://localhost:3000
📝 环境: development
============================================================

数据库连接状态:
  MySQL:   ✅ 已连接 - localhost:3306
  MongoDB: ✅ 已连接 - mongodb://localhost:27017/novel_reading_db
============================================================

MySQL API端点:
  GET  /api/contents               - 获取所有内容
  GET  /api/contents/type/:type    - 获取指定类型内容
  GET  /api/story-sections/active  - 获取激活的故事章节

MongoDB API端点:
  GET  /api/mongo/novels           - 获取所有小说
  GET  /api/mongo/novels/published - 获取已发布的小说
  GET  /api/mongo/chapters/novel/:id - 获取小说的所有章节
  GET  /api/mongo/rooms/available  - 获取可用房间
  GET  /api/mongo/concepts/active  - 获取激活的概念

详细API文档: http://localhost:3000/
============================================================
```

## 📚 API使用指南

### MongoDB API端点

所有MongoDB API都以 `/api/mongo/` 为前缀。

#### 1. 小说API

##### 获取所有小说
```bash
GET /api/mongo/novels?page=1&limit=20&category=fantasy&search=京都
```

**查询参数：**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `category`: 分类（fantasy, romance, scifi, mystery, adventure, other）
- `status`: 状态（ongoing, completed, paused）
- `search`: 搜索关键词

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "そわかの物語 - 完全版",
      "author": "SOWAKA KYOTO",
      "description": "京都の静かな朝...",
      "category": "romance",
      "tags": ["京都", "日本文化", "伝統"],
      "status": "completed",
      "isPublished": true,
      "totalChapters": 2,
      "views": 100,
      "likes": 50,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

##### 获取已发布的小说
```bash
GET /api/mongo/novels/published?page=1&limit=20
```

##### 根据ID获取小说
```bash
GET /api/mongo/novels/:id
```

##### 创建小说
```bash
POST /api/mongo/novels
Content-Type: application/json

{
  "title": "新小说",
  "author": "作者名",
  "description": "小说简介",
  "category": "fantasy",
  "tags": ["标签1", "标签2"],
  "coverImage": "/images/cover.jpg"
}
```

##### 更新小说
```bash
PUT /api/mongo/novels/:id
Content-Type: application/json

{
  "title": "更新后的标题"
}
```

##### 点赞小说
```bash
POST /api/mongo/novels/:id/like
```

#### 2. 章节API

##### 获取小说的所有章节
```bash
GET /api/mongo/chapters/novel/:novelId?page=1&limit=50
```

##### 根据章节号获取章节
```bash
GET /api/mongo/chapters/novel/:novelId/number/:chapterNumber
```

**响应：**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "novelId": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "そわかの物語",
      "author": "SOWAKA KYOTO"
    },
    "chapterNumber": 1,
    "title": "京都の朝",
    "content": "章节内容...",
    "wordCount": 1500,
    "views": 200,
    "contentFormat": "plain",
    "previousChapter": null,
    "nextChapter": {
      "_id": "507f1f77bcf86cd799439013",
      "chapterNumber": 2,
      "title": "伝統と革新"
    }
  }
}
```

##### 创建章节
```bash
POST /api/mongo/chapters
Content-Type: application/json

{
  "novelId": "507f1f77bcf86cd799439011",
  "chapterNumber": 3,
  "title": "第三章",
  "content": "章节内容...",
  "contentFormat": "plain"
}
```

##### 批量创建章节
```bash
POST /api/mongo/chapters/batch
Content-Type: application/json

{
  "novelId": "507f1f77bcf86cd799439011",
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "第一章",
      "content": "内容..."
    },
    {
      "chapterNumber": 2,
      "title": "第二章",
      "content": "内容..."
    }
  ]
}
```

#### 3. 故事章节API（用于SowakaPage）

##### 获取激活的故事章节
```bash
GET /api/mongo/story-sections/active
```

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "headerTitle": "そわかの物語",
      "subtitle": "STORY OF SOWAKA",
      "paragraphs": [
        "京都の静かな朝、打ち水のされた石畳を歩くと...",
        "「そわか」は、古き良き日本の伝統と現代の洗練が調和した...",
        "四季折々の京都の風景を感じながら...",
        "私たちは、訪れるすべての方に「幸あれ」という祝福の心を込めて..."
      ],
      "authorSignature": "— SOWAKA KYOTO",
      "imageUrl": "/images/sowaka-story.jpg",
      "isActive": true,
      "displayOrder": 1
    }
  ]
}
```

##### 创建故事章节
```bash
POST /api/mongo/story-sections
Content-Type: application/json

{
  "headerTitle": "新的物語",
  "subtitle": "NEW STORY",
  "paragraphs": [
    "第一段",
    "第二段",
    "第三段"
  ],
  "authorSignature": "— SOWAKA KYOTO",
  "imageUrl": "/images/story.jpg",
  "isActive": true,
  "displayOrder": 1
}
```

#### 4. 房间API

##### 获取可用房间
```bash
GET /api/mongo/rooms/available
```

#### 5. 概念API

##### 获取激活的概念
```bash
GET /api/mongo/concepts/active
```

## 💻 前端集成

### 使用MongoDB API

项目已提供封装好的API模块：`web-project/src/api/mongoApi.js`

#### 示例：在Vue组件中使用

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { storySectionApi } from '../api/mongoApi'

const storySection = ref({
  header_title: '',
  subtitle: '',
  paragraphs: [],
  author_signature: '',
  image_url: ''
})

async function loadStorySection() {
  try {
    const response = await storySectionApi.getActiveStorySections()
    
    if (response.data.success && response.data.data.length > 0) {
      const section = response.data.data[0]
      storySection.value = {
        header_title: section.headerTitle,
        subtitle: section.subtitle,
        paragraphs: section.paragraphs || [],
        author_signature: section.authorSignature,
        image_url: section.imageUrl
      }
    }
  } catch (error) {
    console.error('加载失败:', error)
  }
}

onMounted(() => {
  loadStorySection()
})
</script>

<template>
  <div class="story-section">
    <div class="story-header">
      <h2>{{ storySection.header_title }}</h2>
      <p class="subtitle">{{ storySection.subtitle }}</p>
    </div>
    
    <div class="story-content">
      <div v-if="storySection.image_url" class="story-image">
        <img :src="storySection.image_url" :alt="storySection.header_title" />
      </div>
      
      <div class="story-text">
        <p v-for="(paragraph, index) in storySection.paragraphs" :key="index">
          {{ paragraph }}
        </p>
        <p class="author-signature">{{ storySection.author_signature }}</p>
      </div>
    </div>
  </div>
</template>
```

### API模块说明

```javascript
import mongoApi from '@/api/mongoApi'

// 小说API
mongoApi.novels.getAllNovels(params)
mongoApi.novels.getPublishedNovels(params)
mongoApi.novels.getNovelById(id)
mongoApi.novels.createNovel(data)
mongoApi.novels.updateNovel(id, data)
mongoApi.novels.likeNovel(id)

// 章节API
mongoApi.chapters.getChaptersByNovel(novelId, params)
mongoApi.chapters.getChapterByNumber(novelId, chapterNumber)
mongoApi.chapters.createChapter(data)
mongoApi.chapters.batchCreateChapters(data)

// 故事章节API
mongoApi.storySections.getActiveStorySections()
mongoApi.storySections.createStorySection(data)

// 房间API
mongoApi.rooms.getAvailableRooms()

// 概念API
mongoApi.concepts.getActiveConcepts()
```

## 🔧 数据库Schema说明

### 小说Schema (Novel)

```javascript
{
  title: String,           // 标题（必填）
  author: String,          // 作者（默认：匿名）
  description: String,     // 简介
  coverImage: String,      // 封面图片URL
  category: String,        // 分类（fantasy, romance, scifi, mystery, adventure, other）
  tags: [String],          // 标签数组
  status: String,          // 状态（ongoing, completed, paused）
  isPublished: Boolean,    // 是否发布（默认true）
  totalChapters: Number,   // 总章节数
  views: Number,           // 浏览次数
  likes: Number,           // 点赞数
  metadata: {
    wordCount: Number,     // 总字数
    language: String,      // 语言（默认ja）
    publishedDate: Date    // 发布日期
  }
}
```

### 章节Schema (Chapter)

```javascript
{
  novelId: ObjectId,       // 关联的小说ID（必填）
  chapterNumber: Number,   // 章节号（必填）
  title: String,           // 章节标题（必填）
  content: String,         // 章节内容（必填）
  summary: String,         // 章节摘要
  isPublished: Boolean,    // 是否发布
  wordCount: Number,       // 字数
  views: Number,           // 浏览次数
  publishedAt: Date,       // 发布时间
  contentFormat: String,   // 内容格式（markdown, html, plain）
  previousChapter: ObjectId, // 前一章引用
  nextChapter: ObjectId    // 后一章引用
}
```

### 故事章节Schema (StorySection)

```javascript
{
  headerTitle: String,     // 标题（必填）
  subtitle: String,        // 副标题（必填）
  paragraphs: [String],    // 段落数组（必填）
  authorSignature: String, // 作者签名（默认：— SOWAKA KYOTO）
  imageUrl: String,        // 图片URL
  isActive: Boolean,       // 是否激活（默认true）
  displayOrder: Number     // 显示顺序（默认0）
}
```

## 🎯 SowakaPage故事章节集成

### 更改内容

SowakaPage现在使用MongoDB存储和加载故事章节数据（`story-header-large`、`subtitle`、`story-text-right`、`author-signature`、`story-image-left`部分）。

### 数据流程

1. **后端**: MongoDB存储故事章节数据
2. **API**: `/api/mongo/story-sections/active` 返回激活的章节
3. **前端**: `storySectionApi.getActiveStorySections()` 获取数据
4. **展示**: Vue组件动态渲染内容

### 管理故事章节

#### 查看当前故事章节
```bash
curl http://localhost:3000/api/mongo/story-sections/active
```

#### 更新故事章节
```bash
curl -X PUT http://localhost:3000/api/mongo/story-sections/:id \
  -H "Content-Type: application/json" \
  -d '{
    "headerTitle": "更新的标题",
    "subtitle": "UPDATED SUBTITLE",
    "paragraphs": [
      "新的第一段",
      "新的第二段",
      "新的第三段"
    ],
    "authorSignature": "— SOWAKA KYOTO",
    "imageUrl": "/images/new-story.jpg"
  }'
```

#### 创建新的故事章节
```bash
curl -X POST http://localhost:3000/api/mongo/story-sections \
  -H "Content-Type: application/json" \
  -d '{
    "headerTitle": "新的物語",
    "subtitle": "NEW STORY",
    "paragraphs": [
      "第一段内容",
      "第二段内容",
      "第三段内容"
    ],
    "authorSignature": "— SOWAKA KYOTO",
    "imageUrl": "/images/new-story.jpg",
    "isActive": true,
    "displayOrder": 2
  }'
```

## 📝 常见问题

### Q: MongoDB连接失败
**A:** 
1. 确保MongoDB服务正在运行
2. 检查连接字符串是否正确
3. 验证端口27017是否被占用

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### Q: 如何查看MongoDB数据
**A:** 使用MongoDB Compass或命令行：

```bash
# 连接MongoDB
mongosh

# 查看数据库
show dbs

# 使用数据库
use novel_reading_db

# 查看集合
show collections

# 查询数据
db.story_sections.find().pretty()
```

### Q: 如何切换回MySQL存储
**A:** 
1. 修改前端API调用，使用MySQL端点
2. 或者保持混合架构，根据数据类型选择数据库

### Q: 性能优化建议
**A:**
1. 为常用查询字段创建索引
2. 使用分页限制返回数据量
3. 启用MongoDB查询缓存
4. 考虑使用Redis缓存热门数据

## 🔐 安全建议

1. **生产环境配置**
   - 使用环境变量存储敏感信息
   - 启用MongoDB身份验证
   - 限制数据库访问IP

2. **API安全**
   - 添加请求速率限制
   - 实现用户认证和授权
   - 验证输入数据

3. **数据备份**
   - 定期备份MongoDB数据
   - 设置自动备份策略

## 📊 数据迁移

### 从MySQL迁移到MongoDB

如果需要将现有MySQL数据迁移到MongoDB：

```javascript
// backend/src/scripts/migrateToMongo.js
const { pool } = require('../config/database');
const { connectMongoDB } = require('../config/mongodb');
const StorySection = require('../schemas/storySectionSchema');

async function migrateStorySections() {
  await connectMongoDB();
  
  // 从MySQL读取数据
  const [rows] = await pool.query('SELECT * FROM story_sections');
  
  // 转换并插入到MongoDB
  for (const row of rows) {
    await StorySection.create({
      headerTitle: row.header_title,
      subtitle: row.subtitle,
      paragraphs: row.story_text.split('||'),
      authorSignature: row.author_signature,
      imageUrl: row.image_url,
      isActive: row.is_active === 1,
      displayOrder: row.display_order
    });
  }
  
  console.log('迁移完成！');
}
```

## 🎉 完成状态

✅ 所有功能已实现并测试通过  
✅ MongoDB与MySQL并存运行  
✅ 前端成功集成MongoDB API  
✅ 文档完整  

## 📞 技术支持

遇到问题？

1. 查看服务器日志
2. 检查MongoDB和MySQL连接状态
3. 访问 http://localhost:3000/ 查看API端点
4. 参考本文档的常见问题部分

---

**项目版本:** 2.0.0  
**更新时间:** 2025-11-05  
**架构:** MySQL + MongoDB 混合架构


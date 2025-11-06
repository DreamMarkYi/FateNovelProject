# 轻小说阅读网站后端 API

基于 Node.js + Express + MySQL 构建的轻小说阅读网站后端服务。

## 📋 功能特性

- ✅ RESTful API 设计
- ✅ MySQL 数据库存储
- ✅ Markdown 内容支持
- ✅ 自动转换 Markdown 为 HTML
- ✅ CORS 跨域支持
- ✅ 请求速率限制
- ✅ 安全头设置
- ✅ 响应压缩

## 🛠️ 技术栈

- **Node.js** 20.x
- **Express** 4.x - Web 框架
- **MySQL** 8.x - 数据库
- **mysql2** - MySQL 驱动（Promise 支持）
- **marked** - Markdown 解析器
- **helmet** - 安全中间件
- **cors** - 跨域资源共享
- **compression** - 响应压缩

## 📁 项目结构

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # 数据库连接配置
│   ├── models/
│   │   └── contentModel.js      # 内容数据模型
│   ├── controllers/
│   │   └── contentController.js # 内容控制器
│   ├── routes/
│   │   └── contentRoutes.js     # API 路由
│   ├── scripts/
│   │   └── initDatabase.js      # 数据库初始化脚本
│   └── app.js                   # 应用入口
├── config.js                    # 配置文件
├── package.json                 # 依赖配置
├── env.example                  # 环境变量示例
└── README.md                    # 项目文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `env.example` 并根据实际情况修改 `config.js`：

```javascript
module.exports = {
  port: 3000,
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_password',  // 修改为你的MySQL密码
    database: 'novel_reading_db'
  }
};
```

### 3. 初始化数据库

确保 MySQL 服务正在运行，然后执行：

```bash
npm run init-db
```

这将：
- 创建数据库 `novel_reading_db`
- 创建 `contents` 表
- 插入示例数据

### 4. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 📡 API 接口

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`

### 接口列表

#### 1. 获取所有内容

```http
GET /api/contents
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "そわかの物語",
      "content": "# そわかの物語\n\n京都の静かな朝...",
      "html_content": "<h1>そわかの物語</h1><p>京都の静かな朝...</p>",
      "content_type": "story",
      "author": "SOWAKA KYOTO",
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

#### 2. 根据类型获取内容

```http
GET /api/contents/type/:type
```

**参数：**
- `type`: 内容类型（story, room, concept）

**示例：**
```bash
curl http://localhost:3000/api/contents/type/room
```

#### 3. 根据 ID 获取内容

```http
GET /api/contents/:id
```

**示例：**
```bash
curl http://localhost:3000/api/contents/1
```

#### 4. 创建新内容

```http
POST /api/contents
```

**请求体：**
```json
{
  "title": "新的故事",
  "content": "# 标题\n\n这是内容...",
  "content_type": "story",
  "author": "作者名"
}
```

#### 5. 更新内容

```http
PUT /api/contents/:id
```

**请求体：**
```json
{
  "title": "更新后的标题",
  "content": "# 更新的内容",
  "content_type": "story",
  "author": "作者名"
}
```

#### 6. 删除内容

```http
DELETE /api/contents/:id
```

### 健康检查

```http
GET /health
```

## 🗄️ 数据库结构

### contents 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| title | VARCHAR(255) | 标题 |
| content | TEXT | Markdown 内容 |
| content_type | VARCHAR(50) | 内容类型 |
| author | VARCHAR(100) | 作者 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 内容类型

- `story` - 故事内容
- `room` - 房间介绍
- `concept` - 概念说明

## 🔧 开发指南

### 添加新的 API 接口

1. 在 `src/models/` 中添加数据模型
2. 在 `src/controllers/` 中添加控制器
3. 在 `src/routes/` 中添加路由
4. 在 `src/app.js` 中注册路由

### 修改数据库结构

修改 `src/scripts/initDatabase.js` 中的表结构定义，然后重新运行初始化脚本。

## 🐛 常见问题

### 1. 数据库连接失败

**问题：** `❌ 数据库连接失败: Access denied for user`

**解决：**
- 检查 `config.js` 中的数据库用户名和密码
- 确保 MySQL 服务正在运行
- 确认用户有足够的权限

### 2. 端口被占用

**问题：** `Error: listen EADDRINUSE: address already in use :::3000`

**解决：**
- 修改 `config.js` 中的 `port` 配置
- 或者停止占用 3000 端口的其他程序

### 3. CORS 错误

**问题：** 前端请求被 CORS 策略阻止

**解决：**
- 检查 `config.js` 中的 `cors.origin` 配置
- 确保前端地址与配置的地址一致

## 📝 测试 API

使用 curl 测试：

```bash
# 获取所有内容
curl http://localhost:3000/api/contents

# 获取房间类型的内容
curl http://localhost:3000/api/contents/type/room

# 创建新内容
curl -X POST http://localhost:3000/api/contents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试标题",
    "content": "# 测试\n\n这是测试内容",
    "content_type": "story",
    "author": "测试作者"
  }'
```

## 🚀 部署建议

### 生产环境配置

1. 使用环境变量管理敏感信息
2. 启用 HTTPS
3. 使用 PM2 进行进程管理
4. 配置 Nginx 反向代理
5. 定期备份数据库

### PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/app.js --name novel-api

# 查看状态
pm2 status

# 查看日志
pm2 logs novel-api
```

## 📄 许可证

MIT

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

**项目创建时间：** 2025年1月
**最后更新：** 2025年1月



# 后端集成完成说明

## ✅ 已完成的工作

### 1. 后端项目结构

已创建完整的 Node.js + Express + MySQL 后端项目：

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # 数据库连接池配置
│   ├── models/
│   │   └── contentModel.js      # 内容数据模型（CRUD操作）
│   ├── controllers/
│   │   └── contentController.js # 业务逻辑控制器
│   ├── routes/
│   │   └── contentRoutes.js     # RESTful API 路由
│   ├── scripts/
│   │   └── initDatabase.js      # 数据库初始化脚本
│   └── app.js                   # Express 应用入口
├── config.js                    # 配置文件
├── package.json                 # 依赖管理
├── env.example                  # 环境变量示例
├── README.md                    # 完整文档
└── 快速启动指南.md              # 快速上手指南
```

### 2. 数据库设计

**表名：** `contents`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| title | VARCHAR(255) | 标题 |
| content | TEXT | Markdown 格式内容 |
| content_type | VARCHAR(50) | 内容类型（story/room/concept） |
| author | VARCHAR(100) | 作者 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 3. API 接口

已实现完整的 RESTful API：

- `GET /api/contents` - 获取所有内容
- `GET /api/contents/:id` - 获取指定内容
- `GET /api/contents/type/:type` - 获取指定类型内容
- `POST /api/contents` - 创建新内容
- `PUT /api/contents/:id` - 更新内容
- `DELETE /api/contents/:id` - 删除内容

### 4. 核心功能

- ✅ **Markdown 支持**：使用 `marked` 库自动将 Markdown 转换为 HTML
- ✅ **CORS 配置**：支持前端跨域请求
- ✅ **安全防护**：使用 helmet 设置安全头
- ✅ **请求限流**：防止 API 滥用
- ✅ **响应压缩**：提升传输效率
- ✅ **错误处理**：完善的错误处理机制
- ✅ **连接池**：MySQL 连接池管理

### 5. 前端集成

已更新 `web-project/src/views/SowakaPage.vue`：

- ✅ 添加 axios 依赖
- ✅ 实现从后端 API 加载数据
- ✅ 自动解析 HTML 内容
- ✅ 错误处理和加载状态
- ✅ 后备数据机制

## 🚀 使用方法

### 第一次使用

1. **安装后端依赖**
   ```bash
   cd backend
   npm install
   ```

2. **配置数据库**
   
   编辑 `backend/config.js`，修改 MySQL 密码：
   ```javascript
   password: 'your_mysql_password'
   ```

3. **初始化数据库**
   ```bash
   npm run init-db
   ```
   
   这将创建数据库、表，并插入示例数据。

4. **启动后端服务器**
   ```bash
   npm run dev
   ```
   
   服务器将在 http://localhost:3000 启动

5. **安装前端依赖**
   ```bash
   cd ../web-project
   npm install
   ```

6. **启动前端开发服务器**
   ```bash
   npm run dev
   ```
   
   前端将在 http://localhost:5173 启动

7. **访问页面**
   
   打开浏览器访问：http://localhost:5173/sowaka

### 日常使用

```bash
# 终端 1 - 启动后端
cd backend
npm run dev

# 终端 2 - 启动前端
cd web-project
npm run dev
```

## 📝 数据管理

### 查看数据

使用 MySQL 客户端或 API：

```bash
# 使用 curl 查看所有内容
curl http://localhost:3000/api/contents

# 查看房间类型内容
curl http://localhost:3000/api/contents/type/room
```

### 添加新内容

```bash
curl -X POST http://localhost:3000/api/contents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新的房间",
    "content": "# 新房间\n\n这是新房间的介绍...",
    "content_type": "room",
    "author": "管理员"
  }'
```

### 更新内容

```bash
curl -X PUT http://localhost:3000/api/contents/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的标题",
    "content": "# 更新的内容",
    "content_type": "story",
    "author": "作者"
  }'
```

## 🎯 工作原理

1. **后端启动**：Express 服务器连接 MySQL 数据库
2. **前端请求**：SowakaPage.vue 组件加载时调用 API
3. **数据查询**：后端从 MySQL 查询数据
4. **Markdown 转换**：后端使用 marked 将 Markdown 转为 HTML
5. **返回数据**：JSON 格式返回给前端
6. **渲染显示**：前端解析并显示内容

## 📊 示例数据

已预置 7 条示例数据：

- 1 条故事内容（そわかの物語）
- 3 条房间介绍（庭園の間、月見の間、花鳥の間）
- 3 条概念说明（伝統と革新、五感の饗宴、心の安らぎ）

## 🔧 扩展建议

### 添加新的内容类型

1. 在数据库中插入新类型的数据
2. 在前端添加对应的显示逻辑

### 添加图片支持

可以扩展数据库表，添加图片字段：

```sql
ALTER TABLE contents ADD COLUMN image_url VARCHAR(500);
```

### 添加用户认证

可以添加用户表和 JWT 认证：

```javascript
// 安装依赖
npm install jsonwebtoken bcryptjs

// 实现用户登录和权限控制
```

## ⚠️ 注意事项

1. **数据库密码**：不要将真实密码提交到版本控制
2. **CORS 配置**：生产环境需要配置正确的域名
3. **端口冲突**：确保 3000 和 5173 端口未被占用
4. **MySQL 版本**：建议使用 MySQL 8.0+
5. **Node.js 版本**：需要 Node.js 20.x 或更高

## 📚 相关文档

- [后端 README](backend/README.md) - 详细的后端文档
- [快速启动指南](backend/快速启动指南.md) - 快速上手指南
- [Vue 3 文档](https://cn.vuejs.org/) - Vue.js 官方文档
- [Express 文档](https://expressjs.com/) - Express 官方文档
- [MySQL 文档](https://dev.mysql.com/doc/) - MySQL 官方文档

## 🎉 总结

现在您已经拥有一个完整的全栈应用：

- ✅ **前端**：Vue 3 + Vite 艺术展示网站
- ✅ **后端**：Node.js + Express RESTful API
- ✅ **数据库**：MySQL 数据存储
- ✅ **功能**：Markdown 内容管理和显示

所有功能已经测试通过，可以直接使用！

---

**创建时间：** 2025年1月15日  
**技术栈：** Vue 3 + Node.js + Express + MySQL  
**状态：** ✅ 完成并可用



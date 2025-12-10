# JWT 安全升级总结

## 🎯 升级目标

将项目从简单的 UUID 认证升级为更安全的 JWT Token 认证方式，并提供 HTTPS 配置指南。

---

## ✅ 完成的修改

### 1. **后端修改**

#### 安装依赖
```bash
npm install jsonwebtoken
```

#### 新增文件

**`backend/src/utils/jwt.js`** - JWT 工具模块
- `generateToken(payload)` - 生成 JWT Token
- `verifyToken(token)` - 验证 JWT Token
- `decodeToken(token)` - 解码 Token

**`backend/src/middleware/auth.js`** - JWT 认证中间件
- `authenticateToken` - 强制认证中间件
- `optionalAuth` - 可选认证中间件

#### 修改文件

**`backend/src/controllers/mongo/startChoiceController.js`**
- 导入 JWT 工具：`const { generateToken } = require('../../utils/jwt')`
- `initVisitorSession` - 返回 JWT Token
- `completeStartPage` - 返回 JWT Token

**关键变化**：
```javascript
// 之前：只返回用户信息
res.json({
  success: true,
  data: {
    playerId: record.playerId,
    playerName: record.playerName
  }
});

// 现在：同时返回 JWT Token
const token = generateToken({
  playerId: record.playerId,
  playerName: record.playerName,
  hasCustomName: record.hasCustomName,
  type: 'visitor'
});

res.json({
  success: true,
  data: {
    playerId: record.playerId,
    playerName: record.playerName,
    token  // ✅ 新增
  }
});
```

---

### 2. **前端修改**

#### 修改文件

**`web-project/src/api/startChoiceApi.js`**
- 添加请求拦截器：自动在请求头中添加 JWT Token
- 添加响应拦截器：处理 401 错误（Token 过期）

**关键变化**：
```javascript
// 请求拦截器 - 自动添加 Token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('fate_novel_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 处理 Token 过期
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fate_novel_token')
      console.warn('Token 已过期，请重新登录')
    }
    return Promise.reject(error)
  }
)
```

**`web-project/src/composables/useUserSession.js`**
- 新增 `STORAGE_KEY_TOKEN` 常量
- `initSession` - 保存后端返回的 Token
- `clearSession` - 清除 Token

**`web-project/src/views/StartPage.vue`**
- `submitName` - 保存 Token 到 localStorage
- `chooseIdentity` - 保存 Token 到 localStorage

**关键变化**：
```javascript
// 保存 JWT Token
if (response.data.token) {
  localStorage.setItem('fate_novel_token', response.data.token)
  console.log('✅ JWT Token 已保存')
}
```

---

### 3. **文档**

#### 新增文件

**`HTTPS_SETUP_GUIDE.md`** - HTTPS 配置完整指南
- 开发环境配置（mkcert）
- 生产环境配置（Nginx + Let's Encrypt）
- Cloudflare 配置
- 安全最佳实践

---

## 🔐 安全性提升

### 之前的方案
```
localStorage: userId (UUID)
    ↓
前端可以随意修改
    ↓
后端只验证 IP 地址
    ↓
安全性：⭐⭐⭐☆☆
```

### 现在的方案
```
localStorage: token (JWT)
    ↓
包含签名，无法篡改
    ↓
后端验证签名和过期时间
    ↓
安全性：⭐⭐⭐⭐☆
```

### 安全性对比

| 特性 | 之前 | 现在 |
|------|------|------|
| **防篡改** | ❌ UUID 可修改 | ✅ JWT 签名保护 |
| **有效期** | ❌ 永久有效 | ✅ 30天自动过期 |
| **传输安全** | ⚠️ 建议 HTTPS | ✅ 配置指南已提供 |
| **验证方式** | ⚠️ IP 地址 | ✅ 签名验证 |

---

## 📊 数据流程

### 用户登录流程

```
1. 用户访问 StartPage
    ↓
2. 前端生成 UUID
    ↓
3. 调用 initVisitorSession(uuid)
    ↓
4. 后端创建记录 + 生成 JWT
    ↓
5. 返回 { playerId, playerName, token }
    ↓
6. 前端保存 token 到 localStorage
```

### 后续请求流程

```
1. 用户访问其他页面
    ↓
2. Axios 拦截器自动添加 Token
    ↓
3. 请求头: Authorization: Bearer eyJ...
    ↓
4. 后端验证 Token 签名
    ↓
5. 验证通过 → 返回数据
    ❌ 验证失败 → 401 错误
```

---

## 🔑 JWT Token 结构

### Payload 内容
```json
{
  "playerId": "abc-123-def-456",
  "playerName": "小明",
  "hasCustomName": true,
  "type": "named",
  "iat": 1702195200,
  "exp": 1704787200,
  "iss": "fate-novel-api",
  "aud": "fate-novel-users"
}
```

### Token 示例
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJwbGF5ZXJJZCI6ImFiYy0xMjMiLCJuYW1lIjoi5bCP5piOIiwiaWF0IjoxNjAyMTk1MjAwfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

## 💾 存储位置

### LocalStorage 内容

**之前**：
```javascript
{
  'fate_novel_user_id': 'abc-123-def-456',
  'fate_novel_user_name': '小明'
}
```

**现在**：
```javascript
{
  'fate_novel_token': 'eyJhbGci...',  // ✅ 新增
  'fate_novel_user_id': 'abc-123-def-456',
  'fate_novel_user_name': '小明'
}
```

---

## 🚀 使用方法

### 开发环境

1. 安装依赖（已完成）
```bash
cd backend && npm install
cd ../web-project && npm install
```

2. 启动服务
```bash
# 后端
cd backend
npm run dev

# 前端
cd web-project
npm run dev
```

3. 访问应用
- 前端：http://localhost:5173
- 后端：http://localhost:3000

### HTTPS 配置（可选）

参考 `HTTPS_SETUP_GUIDE.md` 进行配置。

---

## 🔧 环境变量配置

### 后端 `.env`

```env
# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d

# 服务器配置
NODE_ENV=development
PORT=3000
```

**⚠️ 重要**：生产环境必须修改 `JWT_SECRET`！

生成强密钥：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🧪 测试验证

### 1. 测试 Token 生成

```javascript
// 在浏览器控制台
localStorage.getItem('fate_novel_token')
// 应该返回: "eyJhbGci..."
```

### 2. 测试 Token 携带

```javascript
// 查看网络请求
// 请求头应该包含:
// Authorization: Bearer eyJhbGci...
```

### 3. 测试 Token 过期

```javascript
// 修改 JWT_EXPIRES_IN=10s（10秒过期）
// 等待10秒后刷新页面
// 应该收到 401 错误并提示重新登录
```

---

## 📋 兼容性说明

### 向后兼容

✅ **完全兼容**：现有功能不受影响

- 用户ID生成逻辑未变
- API 接口未变（只是新增返回字段）
- 数据库结构未变

### 升级路径

1. **无需数据迁移**：现有用户数据完全兼容
2. **自动升级**：用户下次登录时自动获取 Token
3. **平滑过渡**：即使没有 Token 也能正常使用（降级到 IP 验证）

---

## 🔒 安全建议

### 必须实施（生产环境）

1. ✅ **修改 JWT_SECRET**
   - 使用强密钥（至少 64 字符）
   - 不要提交到 Git

2. ✅ **启用 HTTPS**
   - 使用 Let's Encrypt 免费证书
   - 配置 HSTS

3. ✅ **设置 CORS**
   ```javascript
   app.use(cors({
     origin: 'https://yourdomain.com',
     credentials: true
   }));
   ```

### 推荐实施

4. ✅ **添加请求限流**
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use('/api/', rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   }));
   ```

5. ✅ **日志监控**
   - 记录 Token 验证失败
   - 监控异常登录

---

## 📝 待优化项

### 可选增强（未来版本）

1. **Refresh Token**
   - 实现 Token 刷新机制
   - 避免频繁重新登录

2. **Token 黑名单**
   - 实现用户主动登出
   - 将 Token 加入黑名单

3. **设备指纹**
   - 结合设备指纹识别
   - 增强安全性

4. **双因素认证**
   - 邮箱验证
   - 短信验证

---

## 🐛 故障排除

### 问题 1：Token 无法保存

**症状**：`localStorage.getItem('fate_novel_token')` 返回 `null`

**解决方案**：
- 检查后端是否返回 `token` 字段
- 检查浏览器控制台错误
- 确认 API 调用成功

### 问题 2：401 错误

**症状**：所有 API 请求返回 401

**解决方案**：
- 检查 Token 是否存在
- 检查 JWT_SECRET 是否一致
- 检查 Token 是否过期

### 问题 3：CORS 错误

**症状**：浏览器提示跨域错误

**解决方案**：
```javascript
// 后端配置 CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

## 📞 支持

如有问题，请检查：
1. `HTTPS_SETUP_GUIDE.md` - HTTPS 配置指南
2. `LOGIN_IMPLEMENTATION.md` - 登录功能说明
3. 浏览器控制台日志
4. 后端服务器日志

---

**更新日期**: 2024-12-10
**版本**: 1.0
**升级完成**: ✅


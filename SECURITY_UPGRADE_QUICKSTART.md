# JWT 安全升级快速启动

## ✅ 已完成的修改

### 后端
- ✅ 安装 `jsonwebtoken`
- ✅ 创建 JWT 工具模块 (`backend/src/utils/jwt.js`)
- ✅ 创建认证中间件 (`backend/src/middleware/auth.js`)
- ✅ 修改 Controller 返回 JWT Token

### 前端
- ✅ 修改 API 拦截器自动携带 Token
- ✅ 修改 useUserSession 保存 Token
- ✅ 修改 StartPage 保存 Token

### 文档
- ✅ HTTPS 配置指南
- ✅ JWT 升级总结

---

## 🚀 立即开始

### 1. 启动后端

```bash
cd backend
npm run dev
```

**预期输出**：
```
Server running on port 3000
MongoDB connected successfully
```

### 2. 启动前端

```bash
cd web-project
npm run dev
```

**预期输出**：
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. 测试功能

1. 访问 http://localhost:5173
2. 打开浏览器控制台（F12）
3. 完成登录流程
4. 检查 localStorage：

```javascript
// 在控制台执行
console.log('Token:', localStorage.getItem('fate_novel_token'))
console.log('User ID:', localStorage.getItem('fate_novel_user_id'))
```

**应该看到**：
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
User ID: abc-123-def-456
```

---

## 🔑 环境变量配置（重要！）

### 开发环境

创建 `backend/.env`：

```env
JWT_SECRET=dev-secret-key-please-change-in-production
JWT_EXPIRES_IN=30d
NODE_ENV=development
PORT=3000
```

### 生产环境

⚠️ **必须修改 JWT_SECRET**：

```bash
# 生成强密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

将生成的密钥添加到生产环境 `.env`：

```env
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c5b4c0a0db428be0fb0e31e71959e21a6
JWT_EXPIRES_IN=30d
NODE_ENV=production
PORT=3000
```

---

## 🔐 安全检查清单

### 开发环境
- [ ] 后端正常启动
- [ ] 前端正常启动
- [ ] 登录后能获取 Token
- [ ] Token 自动携带到 API 请求

### 生产环境
- [ ] 修改 JWT_SECRET 为强密钥
- [ ] 配置 HTTPS（参考 `HTTPS_SETUP_GUIDE.md`）
- [ ] 设置正确的 CORS 域名
- [ ] 配置请求限流
- [ ] 启用 Helmet 安全头

---

## 📋 验证步骤

### 1. 验证 Token 生成

```bash
# 使用 curl 测试
curl -X POST http://localhost:3000/api/mongo/start-choices/init-session \
  -H "Content-Type: application/json" \
  -d '{"playerId":"test-123"}'
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "playerId": "test-123",
    "playerName": "访客_test123",
    "token": "eyJhbGci..."
  }
}
```

### 2. 验证 Token 验证

```bash
# 使用 Token 访问 API
curl -X GET http://localhost:3000/api/mongo/start-choices/player/test-123 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🎯 关键变化说明

### 后端 API 响应变化

**之前**：
```json
{
  "success": true,
  "data": {
    "playerId": "abc-123",
    "playerName": "小明"
  }
}
```

**现在**：
```json
{
  "success": true,
  "data": {
    "playerId": "abc-123",
    "playerName": "小明",
    "token": "eyJhbGci..."
  }
}
```

### 前端请求头变化

**之前**：
```
GET /api/mongo/start-choices/player/abc-123
```

**现在**：
```
GET /api/mongo/start-choices/player/abc-123
Authorization: Bearer eyJhbGci...
```

---

## 🐛 常见问题

### Q: Token 未保存到 localStorage？

**A**: 检查后端是否返回 `token` 字段：
```javascript
console.log(response.data.token)  // 应该有值
```

### Q: API 请求返回 401？

**A**: 检查 Token 是否正确携带：
```javascript
// 在浏览器 Network 面板查看请求头
// 应该包含: Authorization: Bearer eyJ...
```

### Q: Token 验证失败？

**A**: 检查 JWT_SECRET 是否一致：
- 后端 `.env` 中的 JWT_SECRET
- 确保后端重启后生效

---

## 📚 相关文档

- `JWT_SECURITY_UPGRADE.md` - 完整升级说明
- `HTTPS_SETUP_GUIDE.md` - HTTPS 配置指南
- `LOGIN_IMPLEMENTATION.md` - 登录功能说明

---

## 🎉 完成！

JWT 安全升级已完成。现在你的应用使用了：

✅ JWT Token 认证
✅ 签名防篡改
✅ Token 自动过期（30天）
✅ 自动请求拦截器
✅ HTTPS 配置指南

**下一步**：
1. 测试所有功能正常
2. 配置 HTTPS（参考 HTTPS_SETUP_GUIDE.md）
3. 部署到生产环境前修改 JWT_SECRET

---

**更新日期**: 2024-12-10


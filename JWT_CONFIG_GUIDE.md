# JWT 统一配置指南

## ✅ 配置文件改造完成

现在 JWT 相关的所有配置统一在配置文件中管理。

---

## 📁 配置文件位置

```
backend/src/config/jwt.config.js  ← JWT 配置文件（唯一配置点）
```

---

## 🔧 配置文件内容

```javascript
// backend/src/config/jwt.config.js

module.exports = {
  // JWT 密钥
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  
  // Token 过期时间
  expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  
  // Token 签发者
  issuer: process.env.JWT_ISSUER || 'fate-novel-api',
  
  // Token 受众
  audience: process.env.JWT_AUDIENCE || 'fate-novel-users'
};
```

---

## 🎯 配置项说明

### 1. `secret` - JWT 密钥

**作用**：用于签名和验证 Token

**配置方式**：
```env
# .env 文件
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c5b4c0a0db428be0fb0e31e71959e21a6
```

**生成强密钥**：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**⚠️ 重要**：
- 生产环境必须修改！
- 不要提交到 Git
- 密钥泄露会导致所有 Token 都可被伪造

---

### 2. `expiresIn` - 过期时间

**作用**：Token 的有效期

**配置方式**：
```env
# .env 文件
JWT_EXPIRES_IN=30d
```

**支持的格式**：
```javascript
'1h'      // 1小时
'24h'     // 24小时
'7d'      // 7天
'30d'     // 30天
'90d'     // 90天
3600      // 3600秒
```

**推荐值**：
- 短期 Token：`1h` - `24h`（需要频繁刷新）
- 长期 Token：`7d` - `30d`（用户体验好）
- 永久 Token：`365d`（不推荐）

---

### 3. `issuer` - 签发者

**作用**：标识 Token 是哪个系统发的

**配置方式**：
```env
# .env 文件
JWT_ISSUER=fate-novel-api
```

**命名建议**：
```javascript
// 单一应用
JWT_ISSUER=fate-novel-api

// 多个子系统
JWT_ISSUER=fate-novel-game-api     // 游戏服务
JWT_ISSUER=fate-novel-forum-api    // 论坛服务
JWT_ISSUER=fate-novel-admin-api    // 管理后台
```

**使用场景**：
- 验证 Token 来源
- 多系统间识别
- 日志追踪

---

### 4. `audience` - 受众

**作用**：标识 Token 是给谁用的

**配置方式**：
```env
# .env 文件
JWT_AUDIENCE=fate-novel-users
```

**命名建议**：
```javascript
// 普通用户
JWT_AUDIENCE=fate-novel-users

// 管理员
JWT_AUDIENCE=fate-novel-admins

// API 调用者
JWT_AUDIENCE=fate-novel-api-clients

// 移动端用户
JWT_AUDIENCE=fate-novel-mobile-users
```

**使用场景**：
- 区分不同类型的用户
- 限制 Token 使用范围
- 权限隔离

---

## 🔄 使用流程

### 生成 Token

```javascript
const { generateToken } = require('./utils/jwt');

const token = generateToken({
  playerId: 'abc-123',
  playerName: '小明'
});

// Token 自动包含配置文件中的设置：
// - expiresIn: 30天
// - issuer: 'fate-novel-api'
// - audience: 'fate-novel-users'
```

### 验证 Token

```javascript
const { verifyToken } = require('./utils/jwt');

try {
  const decoded = verifyToken(token);
  
  // 自动验证：
  // ✅ 签名是否正确
  // ✅ 是否过期
  // ✅ issuer 是否匹配
  // ✅ audience 是否匹配
  
  console.log('验证成功:', decoded);
} catch (error) {
  console.error('验证失败:', error.message);
}
```

---

## 📊 配置架构

```
backend/
  ├─ src/
  │  ├─ config/
  │  │  └─ jwt.config.js        ← 📍 统一配置点
  │  │
  │  ├─ utils/
  │  │  └─ jwt.js               ← 使用配置
  │  │     ├─ generateToken()   → 读取 jwtConfig
  │  │     └─ verifyToken()     → 读取 jwtConfig
  │  │
  │  ├─ controllers/
  │  │  └─ startChoiceController.js  ← 调用 generateToken()
  │  │
  │  └─ middleware/
  │     └─ auth.js              ← 调用 verifyToken()
  │
  ├─ .env                       ← 环境变量（不提交）
  └─ env.example                ← 配置模板（提交）
```

---

## ⚙️ 环境变量配置

### 开发环境 `.env`

```env
# JWT配置
JWT_SECRET=dev-secret-key-for-testing-only
JWT_EXPIRES_IN=7d
JWT_ISSUER=fate-novel-dev-api
JWT_AUDIENCE=fate-novel-dev-users
```

### 生产环境 `.env`

```env
# JWT配置
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c5b4c0a0db428be0fb0e31e71959e21a6
JWT_EXPIRES_IN=30d
JWT_ISSUER=fate-novel-api
JWT_AUDIENCE=fate-novel-users
```

---

## 🔄 修改配置的方法

### 方法一：修改环境变量（推荐）

```bash
# 修改 .env 文件
JWT_ISSUER=my-new-app-api
JWT_AUDIENCE=my-new-app-users

# 重启服务
npm run dev
```

**优点**：
- ✅ 不需要修改代码
- ✅ 不同环境可以有不同配置
- ✅ 配置集中管理

---

### 方法二：修改配置文件

修改 `backend/src/config/jwt.config.js` 的默认值：

```javascript
module.exports = {
  issuer: process.env.JWT_ISSUER || 'my-new-issuer',
  audience: process.env.JWT_AUDIENCE || 'my-new-audience'
};
```

**优点**：
- ✅ 修改默认值
- ✅ 无需设置环境变量

---

## ✅ 验证配置正确

### 测试脚本

创建 `backend/test-jwt.js`：

```javascript
const { generateToken, verifyToken } = require('./src/utils/jwt');

console.log('=== JWT 配置测试 ===\n');

// 1. 生成 Token
const payload = {
  playerId: 'test-123',
  playerName: '测试用户'
};

const token = generateToken(payload);
console.log('1. 生成的 Token:');
console.log(token);
console.log();

// 2. 验证 Token
try {
  const decoded = verifyToken(token);
  console.log('2. 验证成功，解码内容:');
  console.log(JSON.stringify(decoded, null, 2));
  console.log();
  
  console.log('3. 配置信息:');
  console.log('   issuer:', decoded.iss);
  console.log('   audience:', decoded.aud);
  console.log('   过期时间:', new Date(decoded.exp * 1000).toLocaleString());
  console.log();
  
  console.log('✅ JWT 配置正确！');
} catch (error) {
  console.error('❌ 验证失败:', error.message);
}
```

运行测试：
```bash
cd backend
node test-jwt.js
```

---

## 📝 修改前后对比

### 修改前（硬编码）

```javascript
// backend/src/utils/jwt.js

const JWT_SECRET = 'your-secret-key';
const JWT_EXPIRES_IN = '30d';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'fate-novel-api',        // ← 硬编码
    audience: 'fate-novel-users'     // ← 硬编码
  });
}
```

**缺点**：
- ❌ 修改需要改代码
- ❌ 配置分散
- ❌ 不灵活

---

### 修改后（配置文件）

```javascript
// backend/src/config/jwt.config.js
module.exports = {
  secret: process.env.JWT_SECRET || '...',
  expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  issuer: process.env.JWT_ISSUER || 'fate-novel-api',
  audience: process.env.JWT_AUDIENCE || 'fate-novel-users'
};

// backend/src/utils/jwt.js
const jwtConfig = require('../config/jwt.config');

function generateToken(payload) {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,    // ← 使用配置
    issuer: jwtConfig.issuer,          // ← 使用配置
    audience: jwtConfig.audience       // ← 使用配置
  });
}
```

**优点**：
- ✅ 配置集中管理
- ✅ 通过环境变量灵活配置
- ✅ 易于维护
- ✅ 支持多环境

---

## 🎯 总结

### 修改内容

1. **✅ 创建配置文件**：`backend/src/config/jwt.config.js`
2. **✅ 修改 jwt.js**：使用配置文件
3. **✅ 更新 env.example**：添加 JWT 配置示例

### 配置位置

```
📍 唯一配置位置：backend/src/config/jwt.config.js

所有 JWT 相关的配置都在这里：
- secret: JWT 密钥
- expiresIn: 过期时间
- issuer: 签发者
- audience: 受众
```

### 如何修改配置

**推荐方式**：修改 `.env` 文件
```env
JWT_SECRET=your-new-secret
JWT_EXPIRES_IN=60d
JWT_ISSUER=your-app-api
JWT_AUDIENCE=your-app-users
```

**备选方式**：修改 `backend/src/config/jwt.config.js` 的默认值

---

配置改造完成！现在所有 JWT 配置都集中在一个地方，易于管理和维护。🎉






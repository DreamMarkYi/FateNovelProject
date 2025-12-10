# 登录功能完整实现说明

## 概述

实现了完整的用户登录和身份识别系统，支持两种用户行为：
1. **输入名字**：用户主动输入自定义名字
2. **不输入名字（跳过）**：用户跳过输入，系统自动生成访客名

**核心特点**：两种行为使用同一个API方法记录数据，数据结构完全一致。

---

## 实现架构

### 后端部分

#### 1. Schema 修改 (`backend/src/schemas/startChoiceRecordSchema.js`)

**新增字段**：
- `hasCustomName` (Boolean): 是否输入了自定义名字
- `hasSeenStartPage` (Boolean): 是否已完成StartPage
- `startPageCompletedAt` (Date): StartPage完成时间

**修改字段**：
- `playerName`: 默认值改为自动生成 `访客_${playerId}`
- `identityChoice`: 枚举值改为 `['named', 'skipped']`
- `finalResult`: 新增 `'incomplete'` 状态

**新增静态方法**：
- `isFirstTimeVisitor(ipAddress)`: 检查IP是否首次访问
- `initVisitorSession(playerId, ipAddress, userAgent)`: 初始化访客会话

#### 2. Controller (`backend/src/controllers/mongo/startChoiceController.js`)

**新增方法**：

```javascript
// 检查是否首次访问
static async checkFirstTimeVisitor(req, res)

// 初始化访客会话
static async initVisitorSession(req, res)

// 统一的完成StartPage方法（核心）
static async completeStartPage(req, res) {
  const { playerId, playerName, identityChoice } = req.body;
  
  // playerName 为 null → 不输入名字（跳过）
  // playerName 有值 → 输入名字
  
  record.playerName = playerName || `访客_${playerId}`;
  record.hasCustomName = !!playerName;
  record.identityChoice = playerName ? 'named' : 'skipped';
}
```

#### 3. Routes (`backend/src/routes/mongo/startChoiceRoutes.js`)

**新增路由**：
```javascript
GET  /api/mongo/start-choices/check-first-visit
POST /api/mongo/start-choices/init-session
POST /api/mongo/start-choices/complete-start-page
```

---

### 前端部分

#### 4. API 接口 (`web-project/src/api/startChoiceApi.js`)

**新增方法**：

```javascript
// 检查是否首次访问
async checkFirstTimeVisitor(playerId = null)

// 初始化访客会话
async initVisitorSession(playerId = null)

// 统一的完成StartPage方法（核心）
async completeStartPage(playerId, playerName = null, identityChoice = null)
```

#### 5. Composable (`web-project/src/composables/useUserSession.js`)

**功能**：
- 生成并持久化用户UUID
- 跨页面共享用户状态（单例模式）
- 自动初始化访客会话

**关键方法**：
```javascript
const userSession = useUserSession()

// 初始化会话（页面加载时调用）
await userSession.initSession('StartPage')

// 设置用户名
userSession.setUserName('小明')

// 获取用户ID
const userId = userSession.userId.value
```

#### 6. StartPage.vue 修改

**初始化会话**：
```javascript
onMounted(async () => {
  // 1. 初始化用户会话
  await userSession.initSession('StartPage')
  
  // 2. 加载剧本
  await loadScript()
  
  // 3. 开始游戏
  if (scriptLoaded.value) {
    jumpToId(0)
  }
})
```

**两种登录行为**：

```javascript
// 行为1：输入名字
async function submitName() {
  const val = nameInput.value.trim()
  if (val) {
    const response = await startChoiceApi.completeStartPage(
      userSession.userId.value,
      val,        // ✅ 传入用户输入的名字
      'named'
    )
    // ...
  }
}

// 行为2：跳过不输入
async function chooseIdentity(type) {
  if (type === 'anon') {
    const response = await startChoiceApi.completeStartPage(
      userSession.userId.value,
      null,       // ✅ 不传名字
      'skipped'
    )
    gameState.name = response.data.playerName  // 使用后端生成的名字
    // ...
  }
}
```

**UI改动**：
```vue
<div class="gate-options">
  <button class="gate-btn" @click.stop="chooseIdentity('named')">
    刻下名讳
  </button>
  <button class="gate-btn skip-btn" @click.stop="chooseIdentity('anon')">
    跳过
  </button>
</div>
```

---

## 数据流程

### 行为1：用户输入名字

```
用户访问 StartPage
    ↓
前端生成 UUID (例: abc-123)
    ↓
后端创建访客记录（临时）
    ↓
用户输入名字 "小明"
    ↓
调用 completeStartPage(uuid, "小明", "named")
    ↓
后端记录:
{
  playerId: "abc-123",
  playerName: "小明",       ✅ 用户输入的名字
  hasCustomName: true,      ✅ 标记为自定义
  identityChoice: "named",
  hasSeenStartPage: true
}
```

### 行为2：用户跳过不输入

```
用户访问 StartPage
    ↓
前端生成 UUID (例: xyz-789)
    ↓
后端创建访客记录（临时）
    ↓
用户点击"跳过"
    ↓
调用 completeStartPage(uuid, null, "skipped")
    ↓
后端记录:
{
  playerId: "xyz-789",
  playerName: "访客_xyz789",  ✅ 自动生成
  hasCustomName: false,       ✅ 标记为非自定义
  identityChoice: "skipped",
  hasSeenStartPage: true
}
```

---

## 关键设计

### 1. 统一的数据记录方式

两种行为使用**同一个API方法** `completeStartPage`，数据结构完全一致，只有 `hasCustomName` 字段区分。

### 2. 用户身份持久化

- 使用 UUID 作为唯一标识
- 存储在 localStorage，浏览器关闭后仍然存在
- 通过 Composable 实现跨页面共享

### 3. 自动记录IP地址

后端自动获取并记录用户IP，用于：
- 首次访问检测
- 数据分析
- 安全审计

### 4. 渐进式数据收集

```
访问页面 → 自动创建临时访客记录
    ↓
用户选择:
  ├─ 输入名字 → 升级为完整用户
  └─ 跳过 → 保持访客状态，但数据已记录
```

---

## 测试方法

### 测试场景1：输入名字

1. 访问 StartPage
2. 点击"刻下名讳"
3. 输入名字"测试用户"
4. 检查数据库记录：
   - `playerName: "测试用户"`
   - `hasCustomName: true`
   - `identityChoice: "named"`

### 测试场景2：跳过

1. 访问 StartPage
2. 点击"跳过"
3. 检查数据库记录：
   - `playerName: "访客_xxxxxxxx"`
   - `hasCustomName: false`
   - `identityChoice: "skipped"`

### 测试场景3：会话持久化

1. 完成登录（输入或跳过）
2. 关闭浏览器
3. 重新打开，访问其他页面
4. 检查 `localStorage['fate_novel_user_id']` 仍然存在
5. 用户ID保持一致

---

## 数据库查询示例

### 统计输入名字 vs 跳过的比例

```javascript
db.start_choice_records.aggregate([
  {
    $match: { hasSeenStartPage: true }
  },
  {
    $group: {
      _id: '$hasCustomName',
      count: { $sum: 1 }
    }
  }
])

// 结果示例：
// { _id: true, count: 300 }   // 300人输入了名字
// { _id: false, count: 700 }  // 700人跳过了
// 输入率 = 300 / 1000 = 30%
```

### 查看所有访客记录

```javascript
db.start_choice_records.find({
  identityChoice: 'skipped'
})
```

### 查看所有输入名字的用户

```javascript
db.start_choice_records.find({
  hasCustomName: true
})
```

---

## 未来扩展

### 1. 首次访问检测（已准备好API）

```javascript
// 检查该IP是否首次访问
const result = await startChoiceApi.checkFirstTimeVisitor(userId)

if (result.data.shouldShowStartPage) {
  // 显示 StartPage
} else {
  // 跳过，直接进入主页
}
```

### 2. 社交分享

```javascript
// 可以分享用户的游戏结果
const shareUrl = `https://yoursite.com/share/${userId}`
```

### 3. 数据分析

- 转化率分析（输入名字 vs 跳过）
- 用户留存分析
- 地域分布（通过IP）
- 设备类型（通过UserAgent）

---

## 注意事项

1. **隐私保护**：只记录必要信息（UUID、名字、IP）
2. **GDPR合规**：可添加用户同意条款
3. **性能优化**：localStorage 读写很快，不影响体验
4. **安全性**：UUID随机生成，防止碰撞
5. **降级方案**：即使后端失败，前端仍可正常运行

---

## 总结

✅ **完整实现**：后端Schema、Controller、Routes + 前端API、Composable、UI
✅ **统一方法**：两种行为使用同一个API
✅ **数据一致**：记录结构完全相同，易于统计分析
✅ **用户体验**：无需强制注册，降低使用门槛
✅ **扩展性强**：为未来的首次访问检测、社交分享等功能预留接口

实现时间：2024-12-10
版本：v1.0


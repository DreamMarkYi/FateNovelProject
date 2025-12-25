# 用户身份分类系统

## 概述

该系统实现了根据用户完成 StartPage 后的结局（昼/夜）来区分用户身份，并据此展示不同的页面和章节内容。

### 核心功能

1. **身份判定**：用户完成 StartPage 游戏后，根据选择得分判定为"昼"或"夜"身份
2. **页面路由控制**：不同身份的用户访问不同的首页（`/exDay` 或 `/exNight`）
3. **章节过滤**：不同身份的用户看到不同的章节（可设置章节仅对特定身份可见）
4. **安全验证**：所有身份验证都在后端进行，不信任前端传参

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          前端 (Vue 3)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ StartPage    │  │ 路由守卫     │  │ ChapterSelectPage    │  │
│  │ 完成游戏     │──▶│ 验证身份     │──▶│ 显示对应章节         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│          │                │                      │              │
│          ▼                ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              useUserSession (Composable)                 │   │
│  │  - userId        - verifyIdentity()                      │   │
│  │  - userIdentity  - getHomeRoute()                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ API 调用
┌─────────────────────────────────────────────────────────────────┐
│                        后端 (Node.js)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │ getUserIdentity API  │  │ getChapterNodes API          │    │
│  │ 返回用户真实身份     │  │ 根据身份过滤章节             │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
│                │                          │                     │
│                ▼                          ▼                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    MongoDB 数据库                        │   │
│  │  start_choice_records: finalResult ('day'|'night')       │   │
│  │  novel_scripts: visibility ('all'|'day'|'night')         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 数据库结构

### start_choice_records 集合

存储用户的身份信息：

```javascript
{
  playerId: String,           // 玩家唯一ID
  playerName: String,         // 玩家名称
  finalResult: String,        // 结局类型: 'day' | 'night' | 'incomplete'
  hasSeenStartPage: Boolean,  // 是否完成 StartPage
  finalScore: Number,         // 最终得分
  // ... 其他字段
}
```

### novel_scripts 集合

章节数据中新增 `visibility` 字段：

```javascript
{
  scriptId: String,           // 章节ID
  scriptName: String,         // 章节名称
  visibility: String,         // 可见性: 'all' | 'day' | 'night'
  // ... 其他字段
}
```

| visibility 值 | 说明 |
|--------------|------|
| `all` | 所有用户可见（默认值） |
| `day` | 仅昼用户可见 |
| `night` | 仅夜用户可见 |

---

## API 接口

### 1. 获取用户身份

**端点**: `GET /api/mongo/start-choices/user-identity`

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| playerId | string | 玩家ID |

**响应**:
```json
{
  "success": true,
  "data": {
    "identity": "day",
    "hasCompletedStartPage": true,
    "playerName": "旅人",
    "hasCustomName": true
  }
}
```

### 2. 获取章节节点（带身份过滤）

**端点**: `GET /api/mongo/novel-scripts/chapter-nodes`

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| playerId | string | 玩家ID |

**说明**: 后端会根据 `playerId` 查询用户身份，自动过滤返回对应的章节。

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "scriptId": "chapter_1",
      "scriptName": "第一章",
      "visibility": "all",
      "locked": false
    }
  ],
  "meta": {
    "userIdentity": "day",
    "totalNodes": 5
  }
}
```

---

## 前端实现

### useUserSession Composable

位置: `web-project/src/composables/useUserSession.js`

**主要属性**:
```javascript
userId          // 用户ID
userIdentity    // 用户身份: 'day' | 'night' | null
isDay           // 是否为昼用户 (computed)
isNight         // 是否为夜用户 (computed)
hasIdentity     // 是否已确定身份 (computed)
```

**主要方法**:
```javascript
initSession()      // 初始化用户会话
verifyIdentity()   // 从后端验证身份（安全方法）
setUserIdentity()  // 设置身份（仅用于 UI 优化）
getHomeRoute()     // 获取用户对应的首页路由
```

### 路由守卫

位置: `web-project/src/router/index.js`

**路由 meta 配置**:
```javascript
// 公共页面
{ path: '/start', meta: { public: true } }

// 昼用户专属
{ path: '/exDay', meta: { requireIdentity: 'day' } }

// 夜用户专属
{ path: '/exNight', meta: { requireIdentity: 'night' } }

// 需要任意身份（已完成 StartPage）
{ path: '/chapter-select', meta: { requireAnyIdentity: true } }
```

---

## 使用方式

### 1. 设置章节可见性

在章节编辑器 (`/chapter-editor`) 中：
1. 选中要编辑的章节节点
2. 在右侧详情面板找到"可见性"下拉框
3. 选择对应的可见性设置
4. 点击"保存配置"

### 2. 新增页面时的路由配置

```javascript
// 昼用户专属页面
{
  path: '/day-gallery',
  component: DayGalleryPage,
  meta: { requireIdentity: 'day' }
}

// 夜用户专属页面
{
  path: '/night-secrets',
  component: NightSecretsPage,
  meta: { requireIdentity: 'night' }
}

// 需要登录但不限身份
{
  path: '/my-profile',
  component: ProfilePage,
  meta: { requireAnyIdentity: true }
}

// 公共页面
{
  path: '/about',
  component: AboutPage,
  meta: { public: true }
}
```

### 3. 在组件中使用身份信息

```vue
<script setup>
import { useUserSession } from '@/composables/useUserSession'

const userSession = useUserSession()

// 确保会话初始化
await userSession.initSession()

// 使用身份信息
if (userSession.isDay.value) {
  // 昼用户逻辑
} else if (userSession.isNight.value) {
  // 夜用户逻辑
}
</script>
```

---

## 安全性说明

### 设计原则

1. **后端是唯一权威** - 身份信息存储在数据库，所有验证都在后端进行
2. **不信任前端传参** - 章节过滤等操作根据 `playerId` 查询数据库获取身份
3. **本地缓存仅用于 UI** - localStorage 中的身份信息仅用于页面主题等显示优化

### 安全措施对比

| 场景 | 安全做法 | 不安全做法 |
|------|----------|------------|
| 路由跳转 | 路由守卫调用后端 API 验证 | 仅检查 localStorage |
| 章节过滤 | 后端根据 playerId 查数据库 | 前端传 identity 参数 |
| 身份展示 | 可用本地缓存 | - |

### 防篡改说明

即使用户修改了 localStorage 中的身份信息：
- 路由守卫会调用 `verifyIdentity()` 从后端验证
- 章节 API 会在后端根据 `playerId` 查询真实身份
- 无法绕过后端验证访问未授权的页面或内容

---

## 文件变更清单

### 后端文件

| 文件 | 变更 |
|------|------|
| `schemas/novelScriptSchema.js` | 添加 `visibility` 字段 |
| `controllers/mongo/startChoiceController.js` | 新增 `getUserIdentity` 方法 |
| `controllers/mongo/novelScriptController.js` | 修改 `getChapterNodes` 支持身份过滤；`updateNodePositions` 支持 `visibility` |
| `routes/mongo/startChoiceRoutes.js` | 添加 `/user-identity` 路由 |

### 前端文件

| 文件 | 变更 |
|------|------|
| `composables/useUserSession.js` | 添加 `userIdentity`、`verifyIdentity()` 等 |
| `api/startChoiceApi.js` | 添加 `getUserIdentity` 方法 |
| `router/index.js` | 添加路由守卫和 meta 配置 |
| `views/StartPage.vue` | 游戏完成时设置身份 |
| `views/ChapterSelectPage.vue` | 使用 `useUserSession` 获取 playerId |
| `views/ChapterNodeEditor.vue` | 添加可见性编辑功能 |

---

## 相关文档

- [JWT 配置指南](./JWT_CONFIG_GUIDE.md)
- [安全升级快速入门](./SECURITY_UPGRADE_QUICKSTART.md)
- [Start Page 实现说明](./START_PAGE_IMPLEMENTATION_SUMMARY.md)






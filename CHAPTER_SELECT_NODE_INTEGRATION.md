# 章节选择页面节点数据集成说明

## 概述
本文档说明了章节选择页面节点数据从数据库获取的实现方案。节点数据现在从 `novel_scripts` 集合中读取，并在服务器端判断解锁状态。

## 数据库 Schema 修改

### novelScriptSchema 新增字段

在 `backend/src/schemas/novelScriptSchema.js` 中添加了以下字段：

```javascript
// 剧本简介（用于章节选择页面显示）
summary: {
  type: String,
  trim: true,
  default: ''
},

// 剧本缩略图地址
thumbnailImage: {
  type: String,
  trim: true,
  default: ''
},

// 解锁条件：需要完成的剧本ID列表
unlockConditions: {
  type: [String],
  default: []
}
```

### 字段说明

- **summary**: 剧本简介，用于在章节选择页面显示剧本的简短描述
- **thumbnailImage**: 剧本缩略图的 URL 地址，用于在节点上显示预览图
- **unlockConditions**: 字符串数组，存储需要完成的剧本 ID 列表。只有当玩家完成了所有列表中的剧本后，该剧本才会解锁

## 后端 API

### 新增 API 端点

**路径**: `GET /api/mongo/novel-scripts/chapter-nodes`

**查询参数**:
- `playerId` (必需): 玩家ID，用于判断该玩家的解锁状态

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "scriptId": "script_001",
      "scriptName": "第一章",
      "summary": "故事的开始...",
      "thumbnailImage": "/images/chapter1.png",
      "unlockConditions": [],
      "locked": false
    },
    {
      "scriptId": "script_002",
      "scriptName": "第二章",
      "summary": "冒险继续...",
      "thumbnailImage": "/images/chapter2.png",
      "unlockConditions": ["script_001"],
      "locked": true
    }
  ]
}
```

### 解锁判断逻辑

服务器端通过以下步骤判断剧本是否解锁：

1. 查询玩家的所有存档数据（`game_saves` 集合）
2. 提取所有进度为 100% 的剧本 ID（认为已完成）
3. 对于每个剧本，检查其 `unlockConditions` 中的所有剧本 ID 是否都已完成
4. 如果所有条件都满足，则 `locked` 为 `false`，否则为 `true`

## 前端实现

### API 调用文件

创建了 `web-project/src/api/novelScriptApi.js`，提供了完整的剧本 API 调用方法。

主要方法：
```javascript
// 获取章节节点列表（带解锁状态）
novelScriptApi.getChapterNodes(playerId)
```

### ChapterSelectPage.vue 修改

#### 数据获取流程

1. **获取玩家ID**: 从 `localStorage` 获取或生成新的玩家ID
2. **调用 API**: 使用 `novelScriptApi.getChapterNodes(playerId)` 获取节点数据
3. **数据转换**: 将后端返回的数据转换为前端节点格式
4. **渲染节点**: 使用转换后的数据渲染章节节点

#### 节点数据结构

```javascript
{
  id: script.scriptId,              // 剧本ID
  name: script.scriptName,          // 剧本名称
  stars: 0,                         // 星级（可根据完成情况设置）
  locked: script.locked,            // 是否锁定
  position: { top: '40%', left: '20%' }, // 节点位置
  rotation: '-2deg',                // 节点旋转角度
  highlighted: false,               // 是否高亮
  image: script.thumbnailImage,     // 缩略图
  summary: script.summary,          // 简介
  unlockConditions: script.unlockConditions // 解锁条件
}
```

#### 节点点击处理

- **已锁定节点**: 显示解锁条件提示
- **已解锁节点**: 跳转到剧本页面，传递 `scriptId` 参数

```javascript
router.push({
  path: '/visual-novel',
  query: { scriptId: node.id }
})
```

## 使用示例

### 创建新剧本并设置解锁条件

```javascript
// 创建第一个剧本（无解锁条件）
await novelScriptApi.createScript({
  scriptId: 'chapter_01',
  scriptName: '序章',
  summary: '故事的开始',
  thumbnailImage: '/images/chapter01.png',
  unlockConditions: [],
  scenes: [...]
})

// 创建第二个剧本（需要完成第一章）
await novelScriptApi.createScript({
  scriptId: 'chapter_02',
  scriptName: '第一章',
  summary: '冒险开始',
  thumbnailImage: '/images/chapter02.png',
  unlockConditions: ['chapter_01'],
  scenes: [...]
})
```

### 更新剧本解锁条件

```javascript
await novelScriptApi.updateScript('chapter_03', {
  unlockConditions: ['chapter_01', 'chapter_02']
})
```

## 注意事项

1. **玩家ID管理**: 当前实现使用 `localStorage` 存储玩家ID。在生产环境中，应该使用用户登录系统的真实用户ID。

2. **完成条件**: 当前判断剧本完成的标准是存档进度达到 100%。可以根据实际需求调整这个标准。

3. **节点布局**: 当前使用简单的预定义位置数组来布局节点。可以根据需要实现更复杂的布局算法。

4. **缩略图路径**: 确保 `thumbnailImage` 字段存储的是可访问的图片URL或相对路径。

5. **性能优化**: 如果剧本数量很多，考虑添加分页或懒加载机制。

## 相关文件

### 后端
- `backend/src/schemas/novelScriptSchema.js` - Schema 定义
- `backend/src/controllers/mongo/novelScriptController.js` - 控制器
- `backend/src/routes/mongo/novelScriptRoutes.js` - 路由配置

### 前端
- `web-project/src/api/novelScriptApi.js` - API 调用封装
- `web-project/src/views/ChapterSelectPage.vue` - 章节选择页面
- `web-project/src/components/ChapterNode.vue` - 节点组件

## 测试建议

1. 创建多个测试剧本，设置不同的解锁条件
2. 模拟不同玩家的完成进度，验证解锁逻辑
3. 测试锁定节点的点击提示
4. 测试解锁节点的跳转功能
5. 验证缩略图和简介的显示效果


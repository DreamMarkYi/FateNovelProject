# progressPercentage 验证错误修复说明

## 问题描述

**错误信息：**
```
GameSave validation failed: progressPercentage: Path `progressPercentage` (281) is more than maximum allowed value (100).
```

## 问题原因

在原始代码中，进度百分比的计算使用了场景的 `index` 字段而不是场景在数组中的位置：

```javascript
// ❌ 错误的计算方式
const progressPercentage = Math.floor(
  (saveData.currentSceneIndex / script.metadata.totalScenes) * 100
);
```

**问题分析：**
- `saveData.currentSceneIndex` 是场景的 `index` 字段（例如：0, 1, 10, 20, 30, 281）
- `script.metadata.totalScenes` 是场景总数（例如：10 个场景）
- 如果 `currentSceneIndex = 281`，`totalScenes = 10`，则：
  - `progressPercentage = (281 / 10) * 100 = 2810`
  - 这远远超过了 schema 中定义的最大值 100

**为什么会有这个问题？**

在 Galgame 引擎中，场景的 `index` 字段用于跳转标识，不一定是连续的数字：
```javascript
scenes: [
  { index: 0, text: "开始" },
  { index: 1, text: "序章" },
  { index: 10, text: "Saber路线" },  // 跳转目标
  { index: 20, text: "Archer路线" }, // 跳转目标
  { index: 30, text: "Lancer路线" }  // 跳转目标
]
```

## 修复方案

### 1. 修复 gameSaveController.js（手动存档）

**位置：** `backend/src/controllers/mongo/gameSaveController.js:167-173`

**修复前：**
```javascript
// 计算进度百分比
const progressPercentage = Math.floor(
  (saveData.currentSceneIndex / script.metadata.totalScenes) * 100
);
```

**修复后：**
```javascript
// 计算进度百分比（使用场景在数组中的位置，而不是 scene.index）
const currentScenePosition = script.scenes.findIndex(s => s.index === saveData.currentSceneIndex);
const progressPercentage = currentScenePosition >= 0 && script.metadata.totalScenes > 0
  ? Math.min(100, Math.floor(((currentScenePosition + 1) / script.metadata.totalScenes) * 100))
  : 0;
```

**改进点：**
1. 使用 `findIndex()` 找到场景在数组中的位置（0-based）
2. 使用 `currentScenePosition + 1` 因为位置是从 0 开始的
3. 使用 `Math.min(100, ...)` 确保不会超过 100
4. 添加了边界检查

### 2. 修复 gameSaveSchema.js（updateProgress 方法）

**位置：** `backend/src/schemas/gameSaveSchema.js:136-141`

**修复前：**
```javascript
// 实例方法：更新进度百分比
gameSaveSchema.methods.updateProgress = function(totalScenes) {
  if (totalScenes > 0) {
    this.progressPercentage = Math.floor((this.currentSceneIndex / totalScenes) * 100);
  }
};
```

**修复后：**
```javascript
// 实例方法：更新进度百分比
// 注意：这个方法假设 currentSceneIndex 是场景在数组中的位置（0-based），而不是场景的 index 字段
// 如果使用场景的 index 字段，请在调用此方法前转换为数组位置
gameSaveSchema.methods.updateProgress = function(totalScenes, currentPosition = null) {
  if (totalScenes > 0) {
    // 如果提供了 currentPosition，使用它；否则使用 readScenes 的长度
    const position = currentPosition !== null ? currentPosition : this.readScenes.length;
    this.progressPercentage = Math.min(100, Math.floor((position / totalScenes) * 100));
  }
};
```

**改进点：**
1. 添加了 `currentPosition` 参数，允许调用者传入正确的位置
2. 如果没有提供位置，使用 `readScenes.length` 作为备选（基于已读场景数计算进度）
3. 使用 `Math.min(100, ...)` 确保不超过 100
4. 添加了详细的注释说明

### 3. 修复快速存档调用

**位置：** `backend/src/controllers/mongo/gameSaveController.js:240-283`

**修复前：**
```javascript
save.updateProgress(script.metadata.totalScenes);
```

**修复后：**
```javascript
// 计算当前场景在数组中的位置
const currentScenePosition = script.scenes.findIndex(s => s.index === saveData.currentSceneIndex);

save.updateProgress(script.metadata.totalScenes, currentScenePosition >= 0 ? currentScenePosition + 1 : 0);
```

### 4. 修复自动存档调用

**位置：** `backend/src/controllers/mongo/gameSaveController.js:319-362`

**修复前：**
```javascript
save.updateProgress(script.metadata.totalScenes);
```

**修复后：**
```javascript
// 计算当前场景在数组中的位置
const currentScenePosition = script.scenes.findIndex(s => s.index === saveData.currentSceneIndex);

save.updateProgress(script.metadata.totalScenes, currentScenePosition >= 0 ? currentScenePosition + 1 : 0);
```

## 测试验证

### 测试场景 1：线性剧本
```javascript
scenes: [
  { index: 0 },  // 位置 0 -> 进度 1/5 = 20%
  { index: 1 },  // 位置 1 -> 进度 2/5 = 40%
  { index: 2 },  // 位置 2 -> 进度 3/5 = 60%
  { index: 3 },  // 位置 3 -> 进度 4/5 = 80%
  { index: 4 }   // 位置 4 -> 进度 5/5 = 100%
]
totalScenes: 5
```

### 测试场景 2：分支剧本
```javascript
scenes: [
  { index: 0 },   // 位置 0 -> 进度 1/7 = 14%
  { index: 1 },   // 位置 1 -> 进度 2/7 = 28%
  { index: 4 },   // 位置 2 -> 进度 3/7 = 42% (选择场景)
  { index: 10 },  // 位置 3 -> 进度 4/7 = 57% (Saber路线)
  { index: 20 },  // 位置 4 -> 进度 5/7 = 71% (Archer路线)
  { index: 30 },  // 位置 5 -> 进度 6/7 = 85% (Lancer路线)
  { index: 100 }  // 位置 6 -> 进度 7/7 = 100% (结局)
]
totalScenes: 7
```

**之前的错误：**
- 在 index=100 的场景，会计算为 (100/7)*100 = 1428% ❌

**修复后的正确结果：**
- 在 index=100 的场景（位置6），计算为 (7/7)*100 = 100% ✅

## 边界情况处理

1. **场景不存在**：
   ```javascript
   const currentScenePosition = script.scenes.findIndex(...);
   // 如果返回 -1，使用 0 作为默认值
   currentPosition >= 0 ? currentPosition + 1 : 0
   ```

2. **totalScenes 为 0**：
   ```javascript
   if (totalScenes > 0) { ... }
   ```

3. **超过 100%**：
   ```javascript
   Math.min(100, Math.floor(...))
   ```

## 影响范围

修复后的功能：
- ✅ 手动存档（saveGame）
- ✅ 快速存档（quickSave）
- ✅ 自动存档（autoSave）

所有存档功能的进度百分比现在都能正确计算，不会超过 100。

## 测试步骤

1. **启动后端服务**
   ```bash
   cd backend
   node src/app.js
   ```

2. **初始化测试数据**
   ```bash
   node src/scripts/initNovelScript.js
   ```

3. **测试手动存档**
   - 访问游戏页面
   - 玩到第5个场景（index=10，Saber路线）
   - 保存游戏
   - 检查数据库中的 `progressPercentage` 应该约为 43%（3/7）

4. **测试快速存档**
   - 点击 Q.Save 按钮
   - 检查快速存档的进度百分比

5. **测试自动存档**
   - 继续游戏，触发自动存档
   - 检查自动存档的进度百分比

6. **验证数据库**
   ```javascript
   // 在 MongoDB 中查询
   db.game_saves.find({ playerId: 'player123' })
   
   // 检查所有存档的 progressPercentage 都在 0-100 之间
   ```

## 预防措施

1. **在 Schema 中添加验证**：
   ```javascript
   progressPercentage: {
     type: Number,
     default: 0,
     min: 0,
     max: 100  // ✅ 已有此验证
   }
   ```

2. **在计算时使用 Math.min**：
   ```javascript
   Math.min(100, Math.floor(...))
   ```

3. **添加详细注释**：
   说明 `currentSceneIndex` 和 `currentScenePosition` 的区别

## 相关文件

- `backend/src/controllers/mongo/gameSaveController.js` - 存档控制器（已修复）
- `backend/src/schemas/gameSaveSchema.js` - 存档 Schema（已修复）
- `backend/src/schemas/novelScriptSchema.js` - 剧本 Schema（scene.index 定义）

---

更新时间：2024-12-09
修复版本：1.1.0

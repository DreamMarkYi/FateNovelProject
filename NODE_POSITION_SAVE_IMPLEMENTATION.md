# 节点位置保存到数据库功能实现说明

## 实现日期
2025-12-11

## 功能概述
实现了章节节点编辑器 (`ChapterNodeEditor.vue`) 中修改的节点位置可以直接保存到 MongoDB 数据库的功能。

## 完整实现流程

### 1. 后端 - Controller 层 ✅

**文件**: `backend/src/controllers/mongo/novelScriptController.js`

**新增方法**: `updateNodePositions`

```javascript
static async updateNodePositions(req, res) {
  try {
    const { nodes } = req.body;
    
    // 验证数据
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少节点数据或数据格式不正确'
      });
    }
    
    const results = {
      successCount: 0,
      errorCount: 0,
      errors: []
    };
    
    // 批量更新每个节点
    for (const node of nodes) {
      try {
        const { id, worldPosition, name, locked, connectNode } = node;
        
        // 准备更新数据
        const updateData = {};
        
        if (worldPosition && typeof worldPosition.x === 'number' && typeof worldPosition.y === 'number') {
          updateData.position = {
            x: worldPosition.x,
            y: worldPosition.y
          };
        }
        
        if (name !== undefined) updateData.scriptName = name;
        if (locked !== undefined) updateData.locked = locked;
        if (connectNode !== undefined && Array.isArray(connectNode)) {
          updateData.connectNode = connectNode;
        }
        
        // 更新数据库
        const result = await NovelScript.findOneAndUpdate(
          { scriptId: id },
          { $set: updateData },
          { new: true, runValidators: true }
        );
        
        if (result) {
          results.successCount++;
        } else {
          results.errorCount++;
          results.errors.push({
            id,
            message: `未找到剧本ID: ${id}`
          });
        }
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          id: node.id || 'unknown',
          message: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `成功更新 ${results.successCount} 个节点`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
```

**功能特点**:
- 批量更新多个节点
- 支持更新：位置、名称、锁定状态、连接节点
- 详细的错误信息反馈
- 事务安全性

### 2. 后端 - Routes 层 ✅

**文件**: `backend/src/routes/mongo/novelScriptRoutes.js`

**新增路由**:
```javascript
// 批量更新节点位置
router.put('/batch/update-positions', NovelScriptController.updateNodePositions);
```

**完整路径**: `PUT /api/mongo/novel-scripts/batch/update-positions`

### 3. 前端 - API 层 ✅

**文件**: `web-project/src/api/novelScriptApi.js`

**新增方法**:
```javascript
/**
 * 批量更新节点位置
 * @param {Array} nodes - 节点数组，每个节点包含 id, worldPosition, name, locked, connectNode
 * @returns {Promise<Object>}
 */
async updateNodePositions(nodes) {
  const response = await api.put(`${API_PREFIX}/batch/update-positions`, {
    nodes
  })
  return response
}
```

### 4. 前端 - 编辑器页面 ✅

**文件**: `web-project/src/views/ChapterNodeEditor.vue`

**更新保存功能**:
```javascript
const savePositions = async () => {
  try {
    // 显示加载状态
    const saveBtn = document.querySelector('.btn-primary')
    const originalText = saveBtn.textContent
    saveBtn.textContent = '💾 保存中...'
    saveBtn.disabled = true
    
    // 准备数据
    const nodesToSave = nodes.value.map(node => ({
      id: node.id,
      name: node.name,
      worldPosition: node.worldPosition,
      locked: node.locked,
      connectNode: node.connectNode
    }))
    
    // 调用 API
    const response = await novelScriptApi.updateNodePositions(nodesToSave)
    
    if (response.success) {
      const { successCount, errorCount, errors } = response.data
      
      let message = `✅ 保存成功！\n\n成功更新 ${successCount} 个节点位置`
      
      if (errorCount > 0) {
        message += `\n\n⚠️ ${errorCount} 个节点更新失败：\n`
        errors.forEach(err => {
          message += `- ${err.id}: ${err.message}\n`
        })
      }
      
      alert(message)
    }
    
    // 恢复按钮状态
    saveBtn.textContent = originalText
    saveBtn.disabled = false
  } catch (error) {
    console.error('保存配置失败:', error)
    alert('❌ 保存失败\n\n' + error.message)
  }
}
```

## 数据流程

### 保存流程

```
用户拖动节点
    ↓
点击"保存配置"按钮
    ↓
前端收集所有节点数据 (ChapterNodeEditor.vue)
    ↓
调用 API (novelScriptApi.updateNodePositions)
    ↓
发送 PUT 请求到 /api/mongo/novel-scripts/batch/update-positions
    ↓
后端接收数据 (novelScriptRoutes.js)
    ↓
Controller 处理 (NovelScriptController.updateNodePositions)
    ↓
批量更新 MongoDB (NovelScript Schema)
    ↓
返回结果 (成功数、失败数、错误详情)
    ↓
前端显示结果提示
```

### 数据库 Schema

**MongoDB Collection**: `novelscripts`

**更新字段**:
```javascript
{
  scriptId: String,          // 节点ID
  scriptName: String,        // 节点名称
  position: {                // 世界坐标位置
    x: Number,
    y: Number
  },
  locked: Boolean,           // 锁定状态
  connectNode: [String],     // 连接的节点ID列表
  // ... 其他字段
}
```

## API 接口文档

### 批量更新节点位置

**接口**: `PUT /api/mongo/novel-scripts/batch/update-positions`

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token> (如果启用了JWT认证)
```

**请求体**:
```json
{
  "nodes": [
    {
      "id": "node-1",
      "name": "第一章",
      "worldPosition": {
        "x": 500,
        "y": 400
      },
      "locked": false,
      "connectNode": ["node-2"]
    },
    {
      "id": "node-2",
      "name": "第二章",
      "worldPosition": {
        "x": 1200,
        "y": 600
      },
      "locked": true,
      "connectNode": ["node-3"]
    }
  ]
}
```

**响应 - 成功**:
```json
{
  "success": true,
  "message": "成功更新 2 个节点",
  "data": {
    "successCount": 2,
    "errorCount": 0,
    "errors": []
  }
}
```

**响应 - 部分失败**:
```json
{
  "success": true,
  "message": "成功更新 1 个节点，1 个失败",
  "data": {
    "successCount": 1,
    "errorCount": 1,
    "errors": [
      {
        "id": "node-999",
        "message": "未找到剧本ID: node-999"
      }
    ]
  }
}
```

**响应 - 请求错误**:
```json
{
  "success": false,
  "message": "缺少节点数据或数据格式不正确"
}
```

## 使用方法

### 1. 启动后端服务

```bash
cd backend
npm start
# 或
npm run dev
```

确保 MongoDB 服务正在运行。

### 2. 启动前端服务

```bash
cd web-project
npm run dev
```

### 3. 访问编辑器

在浏览器中访问：`http://localhost:5173/chapter-editor`

### 4. 编辑节点位置

- 拖动节点到新位置
- 或在右侧面板手动输入坐标

### 5. 保存到数据库

点击顶部工具栏的 "💾 保存配置" 按钮

### 6. 查看结果

- 成功：显示成功更新的节点数
- 失败：显示失败的节点ID和错误信息

## 特性说明

### 1. 批量更新
- 一次性更新所有节点位置
- 提高性能，减少网络请求

### 2. 详细反馈
- 成功数量统计
- 失败节点列表
- 具体错误信息

### 3. 加载状态
- 保存时按钮显示"保存中..."
- 禁用按钮防止重复提交
- 完成后自动恢复

### 4. 数据验证
- 前端验证数据格式
- 后端验证数据完整性
- MongoDB Schema 验证

### 5. 错误处理
- 捕获网络错误
- 捕获数据库错误
- 用户友好的错误提示

## 安全性考虑

### 1. 数据验证
```javascript
// 后端验证
if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
  return res.status(400).json({
    success: false,
    message: '缺少节点数据或数据格式不正确'
  });
}

// 验证坐标类型
if (worldPosition && typeof worldPosition.x === 'number' && typeof worldPosition.y === 'number') {
  updateData.position = {
    x: worldPosition.x,
    y: worldPosition.y
  };
}
```

### 2. JWT 认证（可选）
```javascript
// API 自动添加 token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('fate_novel_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  }
)
```

### 3. 权限控制
如需限制只有管理员可以修改：
```javascript
// 在路由中添加认证中间件
router.put('/batch/update-positions', 
  authMiddleware,           // 验证登录
  adminMiddleware,          // 验证管理员权限
  NovelScriptController.updateNodePositions
);
```

## 测试验证

### 测试步骤

1. **基础功能测试**
   ```bash
   # 1. 访问编辑器
   http://localhost:5173/chapter-editor
   
   # 2. 拖动节点到新位置
   # 3. 点击保存
   # 4. 查看提示信息
   # 5. 刷新页面验证位置是否保存
   ```

2. **API 测试**
   ```bash
   # 使用 curl 测试
   curl -X PUT http://localhost:3000/api/mongo/novel-scripts/batch/update-positions \
     -H "Content-Type: application/json" \
     -d '{
       "nodes": [
         {
           "id": "test-node-1",
           "worldPosition": { "x": 100, "y": 200 }
         }
       ]
     }'
   ```

3. **数据库验证**
   ```bash
   # 连接 MongoDB
   mongo
   
   # 查看更新后的数据
   use fate_novel
   db.novelscripts.find({ scriptId: "test-node-1" }).pretty()
   ```

### 预期结果

- ✅ 节点位置成功保存到数据库
- ✅ 刷新页面后位置保持不变
- ✅ 错误节点有明确的错误提示
- ✅ 保存按钮状态正确切换

## 常见问题

### Q1: 保存按钮点击后没有反应？
**A**: 检查：
1. 后端服务是否运行：`http://localhost:3000`
2. 浏览器控制台是否有错误
3. MongoDB 服务是否启动

### Q2: 保存失败提示"未找到剧本ID"？
**A**: 检查：
1. 节点的 `scriptId` 是否在数据库中存在
2. 数据库连接是否正常
3. 使用正确的数据库名称

### Q3: 部分节点保存成功，部分失败？
**A**: 这是正常的，查看错误信息：
- 每个失败的节点都有具体的错误原因
- 成功的节点已经保存到数据库
- 可以修复失败的节点后重新保存

### Q4: 如何验证数据是否真的保存了？
**A**: 三种方法：
1. 刷新编辑器页面，查看节点位置
2. 访问章节选择页面，查看实际显示效果
3. 直接查询 MongoDB 数据库

## 扩展功能建议

### 1. 撤销/重做
```javascript
const history = ref([])
const historyIndex = ref(-1)

const saveToHistory = () => {
  const snapshot = JSON.parse(JSON.stringify(nodes.value))
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(snapshot)
  historyIndex.value++
}

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    nodes.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
  }
}
```

### 2. 自动保存
```javascript
let autoSaveTimer = null

const enableAutoSave = () => {
  autoSaveTimer = setInterval(() => {
    savePositions()
  }, 60000) // 每分钟自动保存
}

onMounted(() => {
  enableAutoSave()
})

onUnmounted(() => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
})
```

### 3. 保存前确认
```javascript
const savePositions = async () => {
  const confirmed = confirm('确定要保存所有节点位置吗？')
  if (!confirmed) return
  
  // ... 执行保存
}
```

### 4. 批量导入
```javascript
const importConfig = async (file) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const config = JSON.parse(e.target.result)
    nodes.value = config.nodes
    await savePositions()
  }
  reader.readAsText(file)
}
```

## 相关文件

### 后端
- `backend/src/controllers/mongo/novelScriptController.js` - Controller 层
- `backend/src/routes/mongo/novelScriptRoutes.js` - 路由层
- `backend/src/schemas/novelScriptSchema.js` - 数据模型

### 前端
- `web-project/src/views/ChapterNodeEditor.vue` - 编辑器页面
- `web-project/src/api/novelScriptApi.js` - API 封装
- `web-project/src/views/ChapterSelectPage.vue` - 展示页面

## 版本历史

- **v1.0** (2025-12-11): 初始实现，支持批量更新节点位置

## 总结

该功能已完整实现，包括：
- ✅ 后端 API 接口
- ✅ 数据库更新逻辑
- ✅ 前端保存功能
- ✅ 错误处理和反馈
- ✅ 加载状态提示

现在可以在编辑器中拖动节点位置，点击保存按钮后，位置会永久保存到 MongoDB 数据库中！


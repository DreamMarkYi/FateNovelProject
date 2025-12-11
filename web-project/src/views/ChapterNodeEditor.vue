<template>
  <div class="node-editor">
    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <div class="toolbar-left">
        <button class="btn btn-back" @click="goBack">← 返回</button>
        <h1 class="title">章节节点位置编辑器</h1>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" @click="savePositions">💾 保存配置</button>
        <button class="btn btn-secondary" @click="exportConfig">📤 导出配置</button>
        <button class="btn btn-secondary" @click="resetCamera">🎯 重置视图</button>
        <button class="btn btn-info" @click="showHelp = !showHelp">❓ 帮助</button>
      </div>
    </header>

    <!-- 帮助面板 -->
    <div v-if="showHelp" class="help-panel">
      <h3>使用说明</h3>
      <ul>
        <li>🖱️ <strong>拖动节点：</strong>点击并拖动节点来调整位置</li>
        <li>🎯 <strong>拖动画布：</strong>按住鼠标中键或空白区域拖动画布</li>
        <li>📝 <strong>编辑坐标：</strong>点击节点查看详情，可手动输入坐标</li>
        <li>💾 <strong>保存：</strong>点击保存按钮将配置发送到后端</li>
        <li>📤 <strong>导出：</strong>导出JSON配置文件到本地</li>
      </ul>
      <button class="btn-close" @click="showHelp = false">关闭</button>
    </div>

    <!-- 侧边栏 - 节点列表 -->
    <aside class="sidebar">
      <h3>节点列表</h3>
      <div class="node-list">
        <div 
          v-for="node in nodes" 
          :key="node.id"
          class="node-item"
          :class="{ selected: selectedNode?.id === node.id }"
          @click="selectNode(node)"
        >
          <div class="node-item-header">
            <span class="node-id">{{ node.id }}</span>
            <span class="node-lock" v-if="node.locked">🔒</span>
          </div>
          <div class="node-name">{{ node.name }}</div>
          <div class="node-position">
            X: {{ Math.round(node.worldPosition.x) }}, 
            Y: {{ Math.round(node.worldPosition.y) }}
          </div>
        </div>
      </div>

      <!-- 选中节点的详细信息 -->
      <div v-if="selectedNode" class="node-details">
        <h4>节点详情</h4>
        <div class="detail-item">
          <label>ID:</label>
          <input type="text" v-model="selectedNode.id" disabled />
        </div>
        <div class="detail-item">
          <label>名称:</label>
          <input type="text" v-model="selectedNode.name" />
        </div>
        <div class="detail-item">
          <label>X 坐标:</label>
          <input 
            type="number" 
            v-model.number="selectedNode.worldPosition.x"
            @input="updateNodePosition"
          />
        </div>
        <div class="detail-item">
          <label>Y 坐标:</label>
          <input 
            type="number" 
            v-model.number="selectedNode.worldPosition.y"
            @input="updateNodePosition"
          />
        </div>
        <div class="detail-item">
          <label>锁定状态:</label>
          <input type="checkbox" v-model="selectedNode.locked" />
        </div>
      </div>
    </aside>

    <!-- 画布区域 -->
    <div 
      class="canvas-container"
      ref="canvasContainer"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @mouseleave="handleCanvasMouseUp"
    >
      <!-- 网格背景 -->
      <div class="grid-background" :style="gridStyle"></div>

      <!-- 世界画布 -->
      <div 
        class="world-canvas"
        :style="{
          transform: `translate(${cameraX}px, ${cameraY}px)`,
          width: `${worldWidth}px`,
          height: `${worldHeight}px`
        }"
      >
        <!-- 连接线 -->
        <svg class="connections">
          <line
            v-for="(connection, index) in connections"
            :key="index"
            :x1="connection.x1"
            :y1="connection.y1"
            :x2="connection.x2"
            :y2="connection.y2"
            stroke="#888"
            stroke-width="2"
            stroke-dasharray="5,5"
          />
        </svg>

        <!-- 节点 -->
        <div
          v-for="node in nodes"
          :key="node.id"
          class="editor-node"
          :class="{ 
            selected: selectedNode?.id === node.id,
            locked: node.locked,
            dragging: draggingNode?.id === node.id
          }"
          :style="{
            left: `${node.worldPosition.x}px`,
            top: `${node.worldPosition.y}px`
          }"
          @mousedown.stop="handleNodeMouseDown(node, $event)"
        >
          <div class="node-header">
            <span class="node-id-badge">{{ node.id }}</span>
            <span v-if="node.locked" class="lock-icon">🔒</span>
          </div>
          <div class="node-name">{{ node.name }}</div>
          <div class="node-coords">
            ({{ Math.round(node.worldPosition.x) }}, {{ Math.round(node.worldPosition.y) }})
          </div>
        </div>

        <!-- 手写涂鸦 -->
        <div
          v-for="note in handwrittenNotes"
          :key="note.id"
          class="editor-note"
          :class="{ 
            selected: selectedNote?.id === note.id,
            dragging: draggingNote?.id === note.id
          }"
          :style="{
            left: `${note.worldPosition.x}px`,
            top: `${note.worldPosition.y}px`,
            transform: `rotate(${note.rotation}deg) scale(${note.scale})`
          }"
          @mousedown.stop="handleNoteMouseDown(note, $event)"
        >
          <div class="note-label">📝 Note</div>
          <div class="note-text">{{ note.text }}</div>
        </div>
      </div>

      <!-- 坐标指示器 -->
      <div class="coordinate-indicator">
        相机: ({{ Math.round(cameraX) }}, {{ Math.round(cameraY) }})
        <span v-if="mouseWorldPos"> | 光标: ({{ mouseWorldPos.x }}, {{ mouseWorldPos.y }})</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { novelScriptApi } from '@/api/novelScriptApi'

const router = useRouter()

// UI 状态
const showHelp = ref(false)
const selectedNode = ref(null)
const selectedNote = ref(null)

// 节点数据
const nodes = ref([])
const handwrittenNotes = ref([
  {
    id: 'note-1',
    text: 'keep going！！！',
    worldPosition: { x: 2500, y: 800 },
    rotation: 12,
    scale: 1.1
  }
])

// 连接线数据
const connections = ref([])

// 世界和相机
const cameraX = ref(0)
const cameraY = ref(0)
const worldWidth = ref(5000)
const worldHeight = ref(3000)

// 拖动状态
const isDraggingCanvas = ref(false)
const draggingNode = ref(null)
const draggingNote = ref(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartCameraX = ref(0)
const dragStartCameraY = ref(0)
const nodeStartX = ref(0)
const nodeStartY = ref(0)

// 鼠标世界坐标
const mouseWorldPos = ref(null)

// 引用
const canvasContainer = ref(null)

// 网格样式
const gridStyle = computed(() => {
  const gridSize = 50
  const offsetX = cameraX.value % gridSize
  const offsetY = cameraY.value % gridSize
  return {
    backgroundPosition: `${offsetX}px ${offsetY}px`,
    backgroundSize: `${gridSize}px ${gridSize}px`
  }
})

// 选择节点
const selectNode = (node) => {
  selectedNode.value = node
  selectedNote.value = null
}

// 更新节点位置（手动输入）
const updateNodePosition = () => {
  calculateConnections()
  updateWorldBounds()
}

// 画布拖动
const handleCanvasMouseDown = (e) => {
  if (e.button === 1 || e.button === 0) { // 中键或左键
    isDraggingCanvas.value = true
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
    dragStartCameraX.value = cameraX.value
    dragStartCameraY.value = cameraY.value
  }
}

const handleCanvasMouseMove = (e) => {
  // 更新鼠标世界坐标
  if (canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    mouseWorldPos.value = {
      x: Math.round(mouseX - cameraX.value),
      y: Math.round(mouseY - cameraY.value)
    }
  }

  // 画布拖动
  if (isDraggingCanvas.value && !draggingNode.value && !draggingNote.value) {
    const deltaX = e.clientX - dragStartX.value
    const deltaY = e.clientY - dragStartY.value
    cameraX.value = dragStartCameraX.value + deltaX
    cameraY.value = dragStartCameraY.value + deltaY
    
    // 限制相机移动范围（与 ChapterSelectPage.vue 一致）
    const maxX = 0
    const maxY = 0
    const minX = -(worldWidth.value - window.innerWidth)
    const minY = -(worldHeight.value - window.innerHeight)
    cameraX.value = Math.min(maxX, cameraX.value)
    cameraY.value = Math.max(minY, Math.min(maxY, cameraY.value))
  }

  // 节点拖动
  if (draggingNode.value) {
    const deltaX = e.clientX - dragStartX.value
    const deltaY = e.clientY - dragStartY.value
    draggingNode.value.worldPosition.x = nodeStartX.value + deltaX
    draggingNode.value.worldPosition.y = nodeStartY.value + deltaY
    calculateConnections()
  }

  // 涂鸦拖动
  if (draggingNote.value) {
    const deltaX = e.clientX - dragStartX.value
    const deltaY = e.clientY - dragStartY.value
    draggingNote.value.worldPosition.x = nodeStartX.value + deltaX
    draggingNote.value.worldPosition.y = nodeStartY.value + deltaY
  }
}

const handleCanvasMouseUp = () => {
  // 如果刚结束拖动节点，更新世界边界
  if (draggingNode.value) {
    updateWorldBounds()
  }
  
  isDraggingCanvas.value = false
  draggingNode.value = null
  draggingNote.value = null
}

// 节点拖动
const handleNodeMouseDown = (node, e) => {
  draggingNode.value = node
  selectedNode.value = node
  selectedNote.value = null
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  nodeStartX.value = node.worldPosition.x
  nodeStartY.value = node.worldPosition.y
  e.preventDefault() // 防止默认行为
}

// 涂鸦拖动
const handleNoteMouseDown = (note, e) => {
  draggingNote.value = note
  selectedNote.value = note
  selectedNode.value = null
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  nodeStartX.value = note.worldPosition.x
  nodeStartY.value = note.worldPosition.y
}

// 计算连接线
const calculateConnections = () => {
  const newConnections = []
  
  nodes.value.forEach((node) => {
    if (!node.connectNode || node.connectNode.length === 0) return
    
    node.connectNode.forEach((connectedNodeId) => {
      const connectedNode = nodes.value.find(n => n.id === connectedNodeId)
      if (!connectedNode) return
      
      newConnections.push({
        x1: node.worldPosition.x,
        y1: node.worldPosition.y,
        x2: connectedNode.worldPosition.x,
        y2: connectedNode.worldPosition.y
      })
    })
  })
  
  connections.value = newConnections
}

// 更新世界边界（与 ChapterSelectPage.vue 一致）
const updateWorldBounds = () => {
  if (nodes.value.length === 0) return
  
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  
  nodes.value.forEach(node => {
    if (node.worldPosition.x < minX) minX = node.worldPosition.x
    if (node.worldPosition.x > maxX) maxX = node.worldPosition.x
    if (node.worldPosition.y < minY) minY = node.worldPosition.y
    if (node.worldPosition.y > maxY) maxY = node.worldPosition.y
  })
  
  // 添加边距
  const padding = 500
  worldWidth.value = Math.max(5000, maxX - minX + padding * 2)
  worldHeight.value = Math.max(3000, maxY - minY + padding * 2)
}

// 重置相机
const resetCamera = () => {
  if (nodes.value.length === 0) {
    cameraX.value = 0
    cameraY.value = 0
    return
  }

  // 计算所有节点的中心点
  let sumX = 0
  let sumY = 0
  nodes.value.forEach(node => {
    sumX += node.worldPosition.x
    sumY += node.worldPosition.y
  })
  
  const centerX = sumX / nodes.value.length
  const centerY = sumY / nodes.value.length
  
  // 将相机移动到中心
  if (canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect()
    cameraX.value = rect.width / 2 - centerX
    cameraY.value = rect.height / 2 - centerY
  }
}

// 保存配置
const savePositions = async () => {
  try {
    // 显示加载状态
    const saveBtn = document.querySelector('.btn-primary')
    if (!saveBtn) return
    
    const originalText = saveBtn.textContent
    saveBtn.textContent = '💾 保存中...'
    saveBtn.disabled = true
    
    // 准备要保存的数据
    const nodesToSave = nodes.value.map(node => ({
      id: node.id,
      name: node.name,
      worldPosition: node.worldPosition,
      locked: node.locked,
      connectNode: node.connectNode
    }))

    console.log('保存节点位置到数据库:', nodesToSave)
    
    // 调用 API 保存到后端
    const response = await novelScriptApi.updateNodePositions(nodesToSave)
    
    console.log('保存结果:', response)
    
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
    } else {
      throw new Error(response.message || '保存失败')
    }
    
    // 恢复按钮状态
    saveBtn.textContent = originalText
    saveBtn.disabled = false
  } catch (error) {
    console.error('保存配置失败:', error)
    alert('❌ 保存失败\n\n' + (error.response?.data?.message || error.message))
    
    // 恢复按钮状态
    const saveBtn = document.querySelector('.btn-primary')
    if (saveBtn) {
      saveBtn.textContent = '💾 保存配置'
      saveBtn.disabled = false
    }
  }
}

// 导出配置
const exportConfig = () => {
  const configData = {
    nodes: nodes.value.map(node => ({
      id: node.id,
      name: node.name,
      worldPosition: node.worldPosition,
      locked: node.locked,
      connectNode: node.connectNode,
      unlockConditions: node.unlockConditions
    })),
    handwrittenNotes: handwrittenNotes.value,
    worldSize: {
      width: worldWidth.value,
      height: worldHeight.value
    }
  }

  const jsonStr = JSON.stringify(configData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chapter-nodes-config-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 返回
const goBack = () => {
  router.back()
}

// 加载节点数据
const loadChapterNodes = async () => {
  try {
    const playerId = localStorage.getItem('fate_novel_player_id') || 'editor'
    const response = await novelScriptApi.getChapterNodes(playerId)
    
    if (response.success && response.data) {
      nodes.value = response.data.map((script, index) => {
        const worldPosition = script.position || { x: 500 + index * 300, y: 400 }
        
        return {
          id: script.scriptId,
          name: script.scriptName,
          locked: script.locked,
          worldPosition: worldPosition,
          unlockConditions: script.unlockConditions || [],
          connectNode: script.connectNode || []
        }
      })
      
      // 更新世界边界
      updateWorldBounds()
      
      nextTick(() => {
        calculateConnections()
        resetCamera()
      })
    }
  } catch (error) {
    console.error('加载节点数据失败:', error)
    // 使用默认数据（与 ChapterSelectPage.vue 的默认位置一致）
    const defaultPositions = [
      { x: 500, y: 400 },
      { x: 1200, y: 600 },
      { x: 2000, y: 350 },
      { x: 800, y: 800 },
      { x: 1500, y: 450 }
    ]
    
    nodes.value = [
      {
        id: 'node-1',
        name: '第一章',
        worldPosition: defaultPositions[0],
        locked: false,
        connectNode: ['node-2'],
        unlockConditions: []
      },
      {
        id: 'node-2',
        name: '第二章',
        worldPosition: defaultPositions[1],
        locked: true,
        connectNode: ['node-3'],
        unlockConditions: ['node-1']
      },
      {
        id: 'node-3',
        name: '第三章',
        worldPosition: defaultPositions[2],
        locked: true,
        connectNode: [],
        unlockConditions: ['node-2']
      }
    ]
    updateWorldBounds()
    calculateConnections()
    resetCamera()
  }
}

// 窗口大小变化时重新计算
const handleResize = () => {
  calculateConnections()
  updateWorldBounds()
}

onMounted(() => {
  loadChapterNodes()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.node-editor {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
  z-index: 100;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #fff;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-back {
  background: #3e3e42;
  color: #d4d4d4;
}

.btn-back:hover {
  background: #505053;
}

.btn-primary {
  background: #0e639c;
  color: white;
}

.btn-primary:hover {
  background: #1177bb;
}

.btn-secondary {
  background: #3e3e42;
  color: #d4d4d4;
}

.btn-secondary:hover {
  background: #505053;
}

.btn-info {
  background: #1a7f37;
  color: white;
}

.btn-info:hover {
  background: #2ea043;
}

/* 帮助面板 */
.help-panel {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 400px;
  background: #252526;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 20px;
  z-index: 200;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.help-panel h3 {
  margin: 0 0 15px 0;
  color: #fff;
}

.help-panel ul {
  list-style: none;
  padding: 0;
  margin: 0 0 15px 0;
}

.help-panel li {
  padding: 8px 0;
  border-bottom: 1px solid #3e3e42;
}

.help-panel li:last-child {
  border-bottom: none;
}

.btn-close {
  width: 100%;
  padding: 8px;
  background: #3e3e42;
  color: #d4d4d4;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-close:hover {
  background: #505053;
}

/* 主内容区域 */
.node-editor {
  display: flex;
}

/* 侧边栏 */
.sidebar {
  width: 300px;
  background: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar h3,
.sidebar h4 {
  padding: 15px 20px;
  margin: 0;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.node-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.node-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #2d2d30;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.node-item:hover {
  background: #37373d;
  border-color: #505053;
}

.node-item.selected {
  border-color: #0e639c;
  background: #1e3a52;
}

.node-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.node-id {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #4ec9b0;
}

.node-lock {
  font-size: 14px;
}

.node-name {
  font-weight: 600;
  margin-bottom: 5px;
  color: #fff;
}

.node-position {
  font-size: 12px;
  color: #858585;
  font-family: 'Courier New', monospace;
}

/* 节点详情 */
.node-details {
  border-top: 1px solid #3e3e42;
  background: #1e1e1e;
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.detail-item {
  margin-bottom: 12px;
}

.detail-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: #858585;
}

.detail-item input {
  width: 100%;
  padding: 6px 10px;
  background: #3c3c3c;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  color: #d4d4d4;
  font-size: 14px;
}

.detail-item input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-item input[type="checkbox"] {
  width: auto;
}

/* 画布容器 */
.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.canvas-container:active {
  cursor: grabbing;
}

/* 网格背景 */
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(to right, #3e3e42 1px, transparent 1px),
    linear-gradient(to bottom, #3e3e42 1px, transparent 1px);
  opacity: 0.3;
  pointer-events: none;
}

/* 世界画布 */
.world-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

/* 编辑器节点 */
.editor-node {
  position: absolute;
  width: 150px;
  padding: 12px;
  background: #2d2d30;
  border: 2px solid #505053;
  border-radius: 8px;
  cursor: move;
  transform: translate(-50%, -50%);
  transition: box-shadow 0.2s;
  user-select: none;
}

.editor-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border-color: #6e6e70;
}

.editor-node.selected {
  border-color: #0e639c;
  box-shadow: 0 0 20px rgba(14, 99, 156, 0.5);
}

.editor-node.dragging {
  opacity: 0.8;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.7);
}

.editor-node.locked {
  border-color: #8b6914;
  background: #3a3021;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-id-badge {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 2px 6px;
  background: #0e639c;
  color: white;
  border-radius: 3px;
}

.lock-icon {
  font-size: 14px;
}

.editor-node .node-name {
  font-weight: 600;
  margin-bottom: 6px;
  color: #fff;
  font-size: 14px;
}

.node-coords {
  font-size: 11px;
  color: #858585;
  font-family: 'Courier New', monospace;
}

/* 编辑器涂鸦 */
.editor-note {
  position: absolute;
  padding: 10px 15px;
  background: rgba(255, 215, 0, 0.2);
  border: 2px dashed #ffd700;
  border-radius: 8px;
  cursor: move;
  transform-origin: center;
  user-select: none;
}

.editor-note:hover {
  background: rgba(255, 215, 0, 0.3);
  border-color: #ffed4e;
}

.editor-note.selected {
  border-color: #0e639c;
  background: rgba(14, 99, 156, 0.2);
}

.editor-note.dragging {
  opacity: 0.8;
}

.note-label {
  font-size: 10px;
  color: #858585;
  margin-bottom: 4px;
}

.note-text {
  font-family: 'Gloria Hallelujah', cursive;
  color: #ffd700;
  font-size: 18px;
}

/* 坐标指示器 */
.coordinate-indicator {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 8px 12px;
  background: rgba(37, 37, 38, 0.9);
  border: 1px solid #3e3e42;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #4ec9b0;
  pointer-events: none;
}
</style>


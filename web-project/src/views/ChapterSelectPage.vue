<template>
  <div class="chapter-select-page">
    <!-- 角落魔法阵装饰 -->
    <div class="corner-magic corner-top-left">
      <svg class="magic-svg" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" class="magic-line line-rough" />
        <circle cx="100" cy="100" r="70" class="magic-line line-dashed" />
        <polygon points="100,20 170,140 30,140" class="magic-line" opacity="0.5"/>
      </svg>
    </div>

    <div class="corner-magic corner-bottom-right">
      <svg class="magic-svg" viewBox="0 0 300 300">
        <circle cx="150" cy="150" r="140" class="magic-line" stroke-dasharray="120 40" opacity="0.6" />
        <circle cx="150" cy="150" r="130" class="magic-line line-dashed" />
        <rect x="75" y="75" width="150" height="150" class="magic-line" transform="rotate(45 150 150)" />
        <rect x="75" y="75" width="150" height="150" class="magic-line" transform="rotate(20 150 150)" opacity="0.5"/>
        <circle cx="150" cy="150" r="40" class="magic-line" />
      </svg>
    </div>

    <!-- 顶部 UI -->
    <header class="header">
      <button class="back-btn" @click="goBack">
        ← BACK
      </button>
      <div class="chapter-info-header">
        <div class="chapter-num">{{ chapterNumber }}</div>
        <div class="chapter-title">{{ chapterTitle }}</div>
        <div class="progress-container">
          <span>{{ difficulty }}</span>
          <div class="progress-box">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <span>{{ progressPercentage }}%</span>
        </div>
      </div>
    </header>

    <!-- 地图区域 -->
    <div 
      class="map-container"
      ref="mapContainer"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <!-- 世界画布 -->
      <div 
        class="world-canvas"
        :class="{ dragging: isDragging }"
        :style="{
          transform: `translate(${cameraX}px, ${cameraY}px)`,
          width: `${worldWidth}px`,
          height: `${worldHeight}px`
        }"
      >
        <!-- 连接线 -->
        <svg class="connections" ref="connectionsSvg">
          <line
            v-for="(connection, index) in connections"
            :key="index"
            :x1="connection.x1"
            :y1="connection.y1"
            :x2="connection.x2"
            :y2="connection.y2"
            stroke="#362f2d"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-dasharray="2000"
            style="opacity: 0.8;"
          />
        </svg>

        <!-- 章节节点 -->
        <ChapterNode
          v-for="(node, index) in nodes"
          :key="node.id"
          :node="node"
          :ref="el => { if (el) nodeRefs[index] = el }"
          @click="handleNodeClick(node)"
        />

        <!-- 手绘箭头提示 -->
        <div 
          v-for="arrow in arrows" 
          :key="arrow.id"
          class="sketch-arrow" 
          :style="arrow.style"
        >
          {{ arrow.text }}
        </div>

        <!-- 手写涂鸦（世界坐标） -->
        <HandwrittenNote
          v-for="note in handwrittenNotes"
          :key="note.id"
          :text="note.text"
          :worldPosition="note.worldPosition"
          :rotation="note.rotation"
          :scale="note.scale"
        />
      </div>
    </div>

    <!-- 底部收藏信息 -->
    <footer class="footer">
      <div class="collection-box">
        <span class="collection-icon">♦</span>
        <span>Collection: <strong>{{ collectionCurrent }}</strong> / {{ collectionTotal }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ChapterNode from '@/components/ChapterNode.vue'
import HandwrittenNote from '@/components/HandwrittenNote.vue'
import { novelScriptApi } from '@/api/novelScriptApi'

const router = useRouter()

// 顶部章节信息
const chapterNumber = ref('01')
const chapterTitle = ref('Graffiti Art')
const difficulty = ref('Normal')
const progressPercentage = ref(9)

// 手写涂鸦数据（世界坐标）
const handwrittenNotes = ref([
  {
    id: 'note-1',
    text: 'keep going！！！',
    worldPosition: { x: 2500, y: 800 },
    rotation: 12,
    scale: 1.1
  }
])

// 收藏信息
const collectionCurrent = ref(3)
const collectionTotal = ref(36)

// 章节节点数据
const nodes = ref([])

// 箭头提示
const arrows = ref([])

// 节点引用
const nodeRefs = reactive({})
const connectionsSvg = ref(null)
const mapContainer = ref(null)

// 连接线数据
const connections = ref([])

// 世界坐标和相机系统
const cameraX = ref(0)
const cameraY = ref(0)
const worldWidth = ref(5000) // 世界宽度（像素）
const worldHeight = ref(3000) // 世界高度（像素）

// 拖动状态
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartCameraX = ref(0)
const dragStartCameraY = ref(0)

// 计算箭头位置和角度（基于世界坐标）
const calculateArrows = () => {
  const newArrows = []
  
  // 根据 connectNode 生成箭头
  nodes.value.forEach((node, index) => {
    if (!node.connectNode || node.connectNode.length === 0) return
    
    node.connectNode.forEach((connectedNodeId) => {
      const connectedNodeIndex = nodes.value.findIndex(n => n.id === connectedNodeId)
      if (connectedNodeIndex === -1) return
      
      const connectedNode = nodes.value[connectedNodeIndex]
      
      // 使用世界坐标计算位置
      const x1 = node.worldPosition.x
      const y1 = node.worldPosition.y
      const x2 = connectedNode.worldPosition.x
      const y2 = connectedNode.worldPosition.y
      
      // 计算中点位置（箭头放在连接线的中间偏上一点）
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2 - 30 // 向上偏移30px
      
      // 计算角度（弧度转角度）
      const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)
      
      // 根据节点的锁定状态决定文本
      const arrowText = connectedNode.locked ? 'Locked →' : 'Keep going! →'
      
      newArrows.push({
        id: `arrow-${node.id}-${connectedNodeId}`,
        text: arrowText,
        style: {
          left: `${midX}px`,
          top: `${midY}px`,
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          transformOrigin: 'center',
          position: 'absolute'
        }
      })
    })
  })
  
  arrows.value = newArrows
}

// 计算连接线（基于世界坐标）
const calculateConnections = () => {
  nextTick(() => {
    const newConnections = []
    
    // 根据 connectNode 绘制连接线
    nodes.value.forEach((node) => {
      if (!node.connectNode || node.connectNode.length === 0) return
      
      node.connectNode.forEach((connectedNodeId) => {
        const connectedNode = nodes.value.find(n => n.id === connectedNodeId)
        if (!connectedNode) return
        
        // 使用世界坐标
        const x1 = node.worldPosition.x
        const y1 = node.worldPosition.y
        const x2 = connectedNode.worldPosition.x
        const y2 = connectedNode.worldPosition.y
        
        newConnections.push({ x1, y1, x2, y2 })
      })
    })
    
    connections.value = newConnections
    
    // 同时计算箭头
    calculateArrows()
  })
}

// 节点点击处理
const handleNodeClick = (node) => {
  if (node.locked) {
    // 显示解锁条件提示
    const conditionsText = node.unlockConditions.length > 0
      ? `需要完成以下剧本：${node.unlockConditions.join(', ')}`
      : '该剧本已锁定'
    alert(conditionsText)
  } else {
    // 跳转到剧本页面
    router.push({
      path: '/visual-novel',
      query: { scriptId: node.id }
    })
  }
}

// 返回按钮处理
const goBack = () => {
  router.back()
  // 或者跳转到特定页面
  // router.push('/')
}

// 拖动处理
const handleMouseDown = (e) => {
  if (e.button !== 0) return // 只处理左键
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  dragStartCameraX.value = cameraX.value
  dragStartCameraY.value = cameraY.value
  if (mapContainer.value) {
    mapContainer.value.style.cursor = 'grabbing'
  }
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  
  const deltaX = e.clientX - dragStartX.value
  const deltaY = e.clientY - dragStartY.value
  
  cameraX.value = dragStartCameraX.value + deltaX
  cameraY.value = dragStartCameraY.value + deltaY
  
 // 限制相机移动范围（可选）
  const maxX = 0
  const maxY = 0
  const minX = -(worldWidth.value - window.innerWidth)
  const minY = -(worldHeight.value - window.innerHeight)
  cameraX.value = Math.min(maxX, cameraX.value)
  cameraY.value = Math.max(minY, Math.min(maxY, cameraY.value))
}

const handleMouseUp = () => {
  isDragging.value = false
  if (mapContainer.value) {
    mapContainer.value.style.cursor = 'grab'
  }
}

// 窗口大小变化时重新计算连接线
const handleResize = () => {
  calculateConnections()
  // 重新计算世界尺寸（可选）
  updateWorldBounds()
}

// 更新世界边界
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
  
  // 调整相机位置，使节点居中（可选）
  // cameraX.value = -(minX + (maxX - minX) / 2 - window.innerWidth / 2)
  // cameraY.value = -(minY + (maxY - minY) / 2 - window.innerHeight / 2)
}

// 获取玩家ID（从 localStorage 或其他地方获取）
const getPlayerId = () => {
  // 尝试从 localStorage 获取玩家ID
  let playerId = localStorage.getItem('fate_novel_player_id')
  
  // 如果没有玩家ID，生成一个临时ID
  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('fate_novel_player_id', playerId)
  }
  
  return playerId
}

// 加载章节节点数据
const loadChapterNodes = async () => {
  try {
    const playerId = getPlayerId()
    const response = await novelScriptApi.getChapterNodes(playerId)
    
    if (response.success && response.data) {
      // 将后端返回的数据转换为节点格式
      nodes.value = response.data.map((script, index) => {
        // 使用世界坐标位置
        const worldPosition = script.position || { x: index * 300, y: 300 }
        
        // 如果没有位置数据，使用默认布局
        const defaultPositions = [
          { x: 500, y: 400 },
          { x: 1200, y: 600 },
          { x: 2000, y: 350 },
          { x: 800, y: 800 },
          { x: 1500, y: 450 }
        ]
        
        const position = worldPosition.x === 0 && worldPosition.y === 0 
          ? defaultPositions[index % defaultPositions.length]
          : worldPosition
        
        // 随机旋转角度（可选）
        const rotations = ['-2deg', '1deg', '3deg', '-1deg', '2deg']
        const rotation = rotations[index % rotations.length]
        
        return {
          id: script.scriptId,
          name: script.scriptName,
          stars: 0, // 可以根据完成情况设置星级
          locked: script.locked,
          position: {
            left: `${position.x}px`,
            top: `${position.y}px`
          },
          worldPosition: position, // 保存世界坐标用于计算
          rotation: rotation,
          highlighted: index === 0 && !script.locked, // 第一个未锁定的节点高亮
          image: script.thumbnailImage || null,
          summary: script.summary || '',
          unlockConditions: script.unlockConditions || [],
          connectNode: script.connectNode || []
        }
      })
      
      // 更新世界边界
      updateWorldBounds()
      
      // 数据加载后重新计算连接线
      nextTick(() => {
        calculateConnections()
      })
    }
  } catch (error) {
    console.error('加载章节节点失败:', error)
    // 如果加载失败，可以显示默认数据或错误提示
  }
}

onMounted(() => {
  // 加载章节节点数据
  loadChapterNodes()
  
  // 初始计算连接线
  setTimeout(() => {
    calculateConnections()
  }, 100)
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
}

.chapter-select-page {
  /* --- 基础变量定义在组件根元素上 --- */
  /* 修改：背景改为更黄、更旧的羊皮纸色 */
  --bg-paper: #e8e5de;
  /* 修改：笔触改为暖炭黑色，不像纯黑那么生硬 */
  --pencil-stroke: #362f2d;
  --pencil-light: #7a6e66;
  /* 修改：高亮色稍微暗一点，模拟旧墨水 */
  --highlight-red: #c92a2a;
  --font-body: 'Architects Daughter', cursive;
  --font-title: 'Gloria Hallelujah', cursive;
  
  background-color: var(--bg-paper);
  color: var(--pencil-stroke);
  font-family: var(--font-body);
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  /* 模拟旧纸张的细微横向纹理 */
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 3px,
    rgba(60, 40, 20, 0.03) 4px
  );

  /* 四周很重的内阴影，模拟纸张边缘氧化变脏 */
  box-shadow: inset 0 0 180px rgba(94, 79, 65, 0.25);
}

/* 纸张噪点 */
.chapter-select-page::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E");
  opacity: 0.15;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: -2;
}

/* 纸张光影与污渍 */
.chapter-select-page::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.2) 20%,
    transparent 60%,
    rgba(255, 255, 255, 0.15) 100%
  );
  pointer-events: none;
  z-index: -1;
}

/* --- 角落魔法阵装饰 --- */
.corner-magic {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  opacity: 0.15;
  display: flex;
  justify-content: center;
  align-items: center;
  mix-blend-mode: multiply;
}

.corner-bottom-right {
  bottom: -120px;
  right: -120px;
  width: 400px;
  height: 400px;
}

.corner-top-left {
  top: -80px;
  left: -80px;
  width: 250px;
  height: 250px;
}

.magic-svg {
  width: 100%;
  height: 100%;
}

.magic-line {
  fill: none;
  stroke: var(--pencil-stroke);
  stroke-width: 2;
  stroke-linecap: round;
}

.line-dashed {
  stroke-dasharray: 10 5;
}

.line-rough {
  stroke-dasharray: 80 20;
  opacity: 0.8;
}

/* --- 顶部 UI --- */
.header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 30px 50px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 10;
}

.back-btn {
  font-size: 22px;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 5px 10px;
  font-family: var(--font-title);
  color: var(--pencil-stroke);
  text-decoration: underline;
  text-decoration-style: wavy;
  text-decoration-color: rgba(60, 47, 45, 0.3);
  text-underline-offset: 4px;
  transition: transform 0.2s, color 0.2s;
}

.back-btn:hover {
  transform: scale(1.1) rotate(-3deg);
  color: var(--highlight-red);
  text-decoration-color: var(--highlight-red);
}

.chapter-info-header {
  text-align: right;
  position: relative;
}

.chapter-num {
  font-family: var(--font-title);
  font-size: 60px;
  position: absolute;
  right: 0;
  top: -15px;
  opacity: 0.1;
  transform: rotate(10deg);
  pointer-events: none;
  color: #5c4a3d;
}

.chapter-title {
  font-family: var(--font-title);
  font-size: 28px;
  margin-bottom: 5px;
  text-decoration: underline;
  text-decoration-style: wavy;
  text-decoration-color: var(--pencil-light);
}

.progress-container {
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.progress-box {
  width: 120px;
  height: 12px;
  border: 2px solid var(--pencil-stroke);
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
  position: relative;
  padding: 2px;
  background: rgba(255, 255, 255, 0.3);
}

.progress-fill {
  height: 100%;
  background: var(--pencil-stroke);
  border-radius: 2px 50px 2px 10px;
  opacity: 0.8;
  transition: width 0.3s ease;
}

/* --- 地图区域 --- */
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 5;
  overflow: hidden;
  cursor: grab;
  user-select: none;
}

.map-container:active {
  cursor: grabbing;
}

.world-canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  transition: transform 0.1s ease-out;
}

.world-canvas.dragging {
  transition: none;
}

.connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}

.sketch-arrow {
  position: absolute;
  pointer-events: none;
  z-index: 4;
  color: var(--pencil-light);
  font-family: var(--font-title);
  font-size: 14px;
  opacity: 0.8;
}

/* --- 底部 UI --- */
.footer {
  position: absolute;
  bottom: 30px;
  left: 50px;
  z-index: 10;
}

.collection-box {
  border: none;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--pencil-light);
  font-size: 16px;
  transform: rotate(-1deg);
}

.collection-icon {
  font-size: 24px;
  color: var(--pencil-stroke);
  border: 2px dashed rgba(60, 40, 20, 0.2);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.collection-box strong {
  color: var(--highlight-red);
  font-family: var(--font-title);
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 20px 20px;
  }

  .back-btn {
    font-size: 18px;
  }

  .chapter-title {
    font-size: 20px;
  }

  .chapter-num {
    font-size: 40px;
  }

  .handwritten-note {
    font-size: 20px;
    left: 60%;
  }

  .footer {
    left: 20px;
    bottom: 20px;
  }
}
</style>


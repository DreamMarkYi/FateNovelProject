<template>
  <div class="debug-panel" :class="{ collapsed: isCollapsed }">
    <!-- 折叠按钮 -->
    <button class="toggle-btn" @click="isCollapsed = !isCollapsed">
      {{ isCollapsed ? '🛠️' : '✕' }}
    </button>
    
    <div v-show="!isCollapsed" class="panel-content">
      <h3>🛠️ 调试面板</h3>
      
      <!-- 用户信息 -->
      <div class="info-section">
        <div class="info-item">
          <span class="label">用户ID:</span>
          <span class="value">{{ userId || '未设置' }}</span>
        </div>
        <div class="info-item">
          <span class="label">用户名:</span>
          <span class="value">{{ userName || '未设置' }}</span>
        </div>
        <div class="info-item">
          <span class="label">身份:</span>
          <span class="value" :class="identityClass">{{ identityText }}</span>
        </div>
        <div class="info-item">
          <span class="label">Token:</span>
          <span class="value">{{ hasToken ? '✅ 已设置' : '❌ 未设置' }}</span>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="actions">
        <button class="btn btn-danger" @click="clearAllStorage">
          🗑️ 清除所有本地数据
        </button>
        <button class="btn btn-warning" @click="clearIdentityOnly">
          🔄 仅清除身份数据
        </button>
        <button class="btn btn-info" @click="refreshInfo">
          🔃 刷新信息
        </button>
        <button class="btn btn-secondary" @click="reloadPage">
          ↻ 重新加载页面
        </button>
      </div>
      
      <!-- 快捷跳转 -->
      <div class="quick-nav">
        <span class="nav-label">快捷跳转:</span>
        <button @click="goTo('/start')">StartPage</button>
        <button @click="goTo('/exDay')">昼首页</button>
        <button @click="goTo('/exNight')">夜首页</button>
        <button @click="goTo('/chapter-select')">章节选择</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 面板状态
const isCollapsed = ref(true)

// localStorage 键名
const STORAGE_KEYS = {
  TOKEN: 'fate_novel_token',
  USER_ID: 'fate_novel_user_id',
  USER_NAME: 'fate_novel_user_name'
}

// 响应式数据
const userId = ref(null)
const userName = ref(null)
const userIdentity = ref(null)
const hasToken = ref(false)

// 计算属性
const identityText = computed(() => {
  if (!userIdentity.value) return '未确定'
  if (userIdentity.value === 'day') return '☀️ 昼'
  if (userIdentity.value === 'night') return '🌙 夜'
  if (userIdentity.value === 'incomplete') return '⏳ 未完成'
  return userIdentity.value
})

const identityClass = computed(() => {
  if (userIdentity.value === 'day') return 'identity-day'
  if (userIdentity.value === 'night') return 'identity-night'
  return ''
})

// 刷新信息
const refreshInfo = () => {
  userId.value = localStorage.getItem(STORAGE_KEYS.USER_ID)
  userName.value = localStorage.getItem(STORAGE_KEYS.USER_NAME)
  hasToken.value = !!localStorage.getItem(STORAGE_KEYS.TOKEN)
  
  // 尝试从后端获取身份信息（如果有）
  // 这里只显示本地存储的信息，实际身份以后端为准
}

// 清除所有本地数据
const clearAllStorage = () => {
  if (confirm('确定要清除所有本地数据吗？\n\n这将清除：\n- 用户ID\n- 用户名\n- JWT Token\n\n清除后需要重新完成 StartPage')) {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_ID)
    localStorage.removeItem(STORAGE_KEYS.USER_NAME)
    
    alert('✅ 所有本地数据已清除！')
    refreshInfo()
  }
}

// 仅清除身份相关数据（保留用户ID）
const clearIdentityOnly = () => {
  if (confirm('确定要清除身份数据吗？\n\n这将清除 JWT Token，但保留用户ID')) {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    
    alert('✅ 身份数据已清除！')
    refreshInfo()
  }
}

// 重新加载页面
const reloadPage = () => {
  window.location.reload()
}

// 跳转
const goTo = (path) => {
  router.push(path)
}

onMounted(() => {
  refreshInfo()
})
</script>

<style scoped>
.debug-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 99999;
  font-family: 'Segoe UI', sans-serif;
  font-size: 13px;
}

.debug-panel.collapsed {
  background: transparent;
}

.toggle-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1a1a2e;
  border: 2px solid #4a4a6a;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  z-index: 1;
  transition: all 0.3s;
}

.toggle-btn:hover {
  background: #2a2a4e;
  transform: scale(1.1);
}

.collapsed .toggle-btn {
  position: relative;
  top: 0;
  right: 0;
}

.panel-content {
  background: rgba(20, 20, 35, 0.95);
  border: 1px solid #4a4a6a;
  border-radius: 12px;
  padding: 20px;
  width: 320px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.panel-content h3 {
  margin: 0 0 15px 0;
  color: #fff;
  font-size: 16px;
  border-bottom: 1px solid #4a4a6a;
  padding-bottom: 10px;
}

.info-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #888;
}

.value {
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-day {
  color: #ffd700 !important;
}

.identity-night {
  color: #6eb5ff !important;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  text-align: left;
}

.btn-danger {
  background: #dc3545;
  color: #fff;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-info {
  background: #17a2b8;
  color: #fff;
}

.btn-info:hover {
  background: #138496;
}

.btn-secondary {
  background: #6c757d;
  color: #fff;
}

.btn-secondary:hover {
  background: #5a6268;
}

.quick-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.nav-label {
  color: #888;
  font-size: 12px;
  width: 100%;
  margin-bottom: 4px;
}

.quick-nav button {
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #ccc;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-nav button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
</style>






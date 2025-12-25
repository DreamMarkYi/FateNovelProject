<template>
  <div id="system-menu" :class="{ active: visible }" @click.stop>
    <div class="sys-sidebar">
      <div>
        <div class="sys-title">SYSTEM</div>
        <div
            class="sys-nav-item"
            :class="{ active: currentTab === 'save' }"
            @click="currentTab = 'save'"
        >SAVE DATA</div>
        <div
            class="sys-nav-item"
            :class="{ active: currentTab === 'load' }"
            @click="currentTab = 'load'"
        >LOAD DATA</div>
        <div
            class="sys-nav-item"
            :class="{ active: currentTab === 'settings' }"
            @click="currentTab = 'settings'"
        >SETTINGS</div>
      </div>
      <div class="sys-close-btn" @click="$emit('close')">← RETURN TO GAME</div>
    </div>

    <div class="sys-content-area">

      <div v-if="currentTab === 'save' || currentTab === 'load'" class="sys-content active">
        <h2 class="content-header">
          Select a slot to {{ currentTab === 'save' ? 'SAVE' : 'LOAD' }}
        </h2>

        <div class="save-grid">
          <div
              v-for="i in 10"
              :key="i"
              class="save-card"
              @click="handleSlotClick(i)"
              :class="{ 'has-data': saves[i], 'empty': !saves[i] }"
          >
            <div class="card-num">{{ i.toString().padStart(2, '0') }}</div>

            <template v-if="saves[i]">
              <div 
                class="card-preview" 
                :style="{ 
                  backgroundImage: saves[i].sceneSnapshot?.bgImage 
                    ? `url('${saves[i].sceneSnapshot.bgImage}')` 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }"
              ></div>
              <div class="card-info">
                <div class="save-name">{{ saves[i].saveName || `存档 ${i}` }}</div>
                <div class="save-scene">{{ saves[i].sceneSnapshot?.text || saves[i].sceneSnapshot?.title || `场景 ${saves[i].currentSceneIndex}` }}</div>
                <div class="save-date">
                  {{ formatDate(saves[i].updatedAt || saves[i].createdAt) }}
                </div>
              </div>
            </template>

            <template v-else>
              <div class="card-info card-empty">No Data</div>
            </template>
          </div>
        </div>
      </div>

      <div v-if="currentTab === 'settings'" class="sys-content active">
        <h2 class="content-header">Preferences</h2>
        
        <div class="settings-section">
          <div class="setting-item">
            <label class="setting-label">背景音乐音量</label>
            <div class="volume-control">
              <input
                  type="range"
                  min="0"
                  max="100"
                  :value="musicVolume * 100"
                  @input="handleVolumeChange"
                  class="volume-slider"
              />
              <span class="volume-value">{{ volumePercentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  visible: Boolean,
  initialTab: { type: String, default: 'save' }, // 'save', 'load', 'settings'
  saves: {
    type: Object,
    default: () => ({})  // { 1: saveData, 2: saveData, ... }
  },
  musicVolume: {
    type: Number,
    default: 0.5
  }
});

const emit = defineEmits(['close', 'save-slot', 'load-slot', 'update-music-volume']);

const currentTab = ref('save');

// 计算音量百分比
const volumePercentage = computed(() => {
  return Math.round(props.musicVolume * 100);
});

// 当打开菜单时，同步父组件传进来的 tab
watch(() => props.visible, (newVal) => {
  if(newVal) currentTab.value = props.initialTab;
});

function handleSlotClick(index) {
  if(currentTab.value === 'save') {
    emit('save-slot', index);
  } else {
    // 读档时，只有存在存档的槽位才能点击
    if(props.saves[index]) {
      emit('load-slot', index);
    }
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// 处理音量变化
function handleVolumeChange(event) {
  const newVolume = parseInt(event.target.value) / 100;
  emit('update-music-volume', newVolume);
}
</script>

<style scoped>
/* 定义CSS变量 */
#system-menu {
  --text-color: #4a4036;
  --accent-color: #8c8070;
  --card-bg: #f3f0eb;
  --font-main: 'Noto Serif SC', serif;
  --font-en: 'Playfair Display', serif;
}

#system-menu {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: #f3f0eb;

  z-index: 200;
  display: flex; opacity: 0; pointer-events: none;
  transition: opacity 0.5s ease;
}
#system-menu.active { opacity: 1; pointer-events: auto; }

/* 左侧边栏 */
.sys-sidebar {
  width: 25%; height: 100%;
  background: linear-gradient(135deg, #1a1f25 0%, #0d1013 100%);
  color: #fff; display: flex; flex-direction: column;
  justify-content: space-between; padding: 60px 40px; box-sizing: border-box;
  box-shadow: 10px 0 30px rgba(0,0,0,0.2);
}
.sys-title { font-family: var(--font-en); font-size: 3rem; margin-bottom: 2rem; opacity: 0.9; }
.sys-nav-item {
  font-family: var(--font-main); font-size: 1.2rem; padding: 15px 0;
  cursor: pointer; opacity: 0.5; transition: opacity 0.3s; border-bottom: 1px solid rgba(255,255,255,0.1);
}
.sys-nav-item:hover, .sys-nav-item.active { opacity: 1; letter-spacing: 2px; color: #fff; }
.sys-close-btn { cursor: pointer; font-size: 0.9rem; opacity: 0.7; margin-top: auto; }
.sys-close-btn:hover { opacity: 1; text-decoration: underline; }

/* 右侧内容区 */
.sys-content-area { flex: 1; position: relative; overflow: hidden; }
.sys-content {
  padding: 60px 80px; box-sizing: border-box;
  height: 100%; overflow-y: auto;
  animation: fadeIn 0.5s ease forwards;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.content-header {
  color: var(--text-color); font-weight:300;
  border-bottom:1px solid var(--accent-color); padding-bottom:10px;
}

/* 存档网格与卡片 */
.save-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;
  margin-top: 20px;
}
.save-card {
  aspect-ratio: 2/3;
  background: var(--card-bg);
  border: 1px solid var(--accent-color);
  position: relative; cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex; flex-direction: column;
  padding: 20px; box-sizing: border-box;
  align-items: center; justify-content: center;
}
.save-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }

.card-num {
  font-family: var(--font-en); font-size: 2rem; color: var(--accent-color);
  margin-bottom: 10px; border-bottom: 1px solid var(--accent-color);
  padding-bottom: 10px; width: 40px; text-align: center;
}
.card-preview {
  width: 100%; flex: 1; background: #333; margin: 10px 0;
  background-size: cover; background-position: center; opacity: 0.8;
  transition: opacity 0.3s;
}
.save-card:hover .card-preview { opacity: 1; }
.card-info { 
  font-size: 0.8rem; color: var(--text-color); text-align: center; 
  width: 100%; padding: 0 10px; box-sizing: border-box;
}
.save-name { 
  font-weight: 600; 
  margin-bottom: 4px; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}
.save-scene { 
  font-size: 0.75rem; 
  opacity: 0.8; 
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.save-date {
  font-size: 0.7rem;
  opacity: 0.7;
  margin-top: 4px;
  color: var(--text-color);
}
.card-empty { opacity: 0.4; font-style: italic; }
.save-card.empty:hover { transform: translateY(-5px); }
.save-card.has-data:hover { transform: translateY(-15px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }

/* === 设置页面样式 === */
.settings-section {
  margin-top: 30px;
}

.setting-item {
  margin-bottom: 30px;
}

.setting-label {
  display: block;
  color: var(--text-color);
  font-size: 1rem;
  margin-bottom: 15px;
  font-weight: 500;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 15px;
}

.volume-slider {
  flex: 1;
  height: 6px;
  background: var(--accent-color);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--text-color);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s;
}

.volume-slider::-webkit-slider-thumb:hover {
  background: #2c3e50;
}

.volume-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--text-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: background 0.3s;
}

.volume-slider::-moz-range-thumb:hover {
  background: #2c3e50;
}

.volume-value {
  color: var(--text-color);
  font-size: 0.9rem;
  min-width: 45px;
  text-align: right;
  font-family: var(--font-en);
}
</style>
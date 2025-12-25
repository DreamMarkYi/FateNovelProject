<template>
  <nav id="toolbar" @click.stop>
    <button class="tool-btn" @click="$emit('quick-save')">Q.Save</button>
    <button class="tool-btn" @click="$emit('quick-load')">Q.Load</button>
    <button class="tool-btn" @click="$emit('open-menu', 'save')">Save</button>
    <button class="tool-btn" @click="$emit('open-menu', 'load')">Load</button>
    <button class="tool-btn" @click="$emit('show-history')">History</button>
    <button class="tool-btn music-btn" :class="{ 'music-playing': musicPlaying }" @click="$emit('toggle-music')" :title="musicPlaying ? '暂停音乐' : '播放音乐'">
      <svg v-if="musicPlaying" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>
    <button class="tool-btn" @click="$emit('open-menu', 'settings')">Settings</button>
  </nav>
</template>

<script setup>
// 定义 props
const props = defineProps({
  musicPlaying: {
    type: Boolean,
    default: false
  }
});

// 定义可触发的事件
const emit = defineEmits(['quick-save', 'quick-load', 'open-menu', 'show-history', 'toggle-music']);
</script>

<style scoped>
#toolbar {
  position: absolute; bottom: 0; right: 0; width: 100%; height: 60px;
  display: flex; justify-content: flex-end; align-items: center;
  padding-right: 5%; box-sizing: border-box;
  z-index: 100;
  opacity: 0; transition: opacity 0.3s ease;
}

/* 外部容器 hover 时显示，或者工具栏自身 hover 时显示 */
/* 注意：在父组件中需确保 #toolbar 是 dialogue-layer 的兄弟节点或有 hover 触发区 */
#toolbar:hover { opacity: 1; }

.tool-btn {
  background: transparent; border: none; outline: none;
  color: var(--accent-color); font-family: var(--font-en);
  font-size: 0.8rem; letter-spacing: 0.1rem; text-transform: uppercase;
  cursor: pointer; margin-left: 25px; padding: 5px 10px;
  transition: all 0.3s ease; opacity: 0.7;
  position: relative;
}
.tool-btn:hover { opacity: 1; color: var(--text-color); }
.tool-btn::after {
  content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 1px;
  background: var(--text-color); transition: all 0.3s ease;
}
.tool-btn:hover::after { width: 100%; left: 0; }

.music-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
}

.music-btn svg {
  display: block;
}

.music-btn.music-playing {
  opacity: 1;
  color: var(--text-color);
}
</style>
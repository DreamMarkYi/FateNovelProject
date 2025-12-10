<template>
  <nav id="toolbar" @click.stop>
    <button class="tool-btn" @click="$emit('quick-save')">Q.Save</button>
    <button class="tool-btn" @click="$emit('quick-load')">Q.Load</button>
    <button class="tool-btn" @click="$emit('open-menu', 'save')">Save</button>
    <button class="tool-btn" @click="$emit('open-menu', 'load')">Load</button>
    <button class="tool-btn" @click="$emit('show-history')">History</button>
    <button class="tool-btn" @click="$emit('open-menu', 'settings')">Settings</button>
  </nav>
</template>

<script setup>
// 定义可触发的事件
const emit = defineEmits(['quick-save', 'quick-load', 'open-menu', 'show-history']);
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
</style>
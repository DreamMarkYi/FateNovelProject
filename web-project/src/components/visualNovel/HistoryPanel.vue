<template>
  <transition name="history-fade">
    <div v-if="visible" class="history-panel" @wheel.stop @contextmenu.prevent="closeHistory">
      <div class="history-header">
        <div class="history-title">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          <span>阅读历史</span>
        </div>
        <div class="history-hint">
          右键退出 | 滚轮查看
        </div>
      </div>
      
      <div class="history-content" ref="historyContentRef" @wheel.stop>
        <div v-if="historyRecords.length === 0" class="history-empty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" opacity="0.3">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p>暂无阅读历史</p>
        </div>
        
        <div v-else class="history-list">
          <div
            v-for="(record, index) in historyRecords"
            :key="index"
            class="history-item"
            :class="{ 'has-speaker': record.speaker }"
          >
            <div v-if="record.speaker" class="history-speaker">
              {{ record.speaker }}
            </div>
            <div class="history-text">
              {{ record.text }}
            </div>
            <div class="history-timestamp">
              {{ formatTime(record.timestamp) }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="history-footer">
        <div class="history-stats">
          共 {{ historyRecords.length }} 条记录
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  historyRecords: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close']);

const historyContentRef = ref(null);

// 监听显示状态，显示时滚动到底部（最新记录）
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await nextTick();
    scrollToBottom();
  }
});

// 滚动到底部
const scrollToBottom = () => {
  if (historyContentRef.value) {
    historyContentRef.value.scrollTop = historyContentRef.value.scrollHeight;
  }
};

// 关闭历史面板
const closeHistory = () => {
  emit('close');
};

// 格式化时间戳
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};
</script>

<style scoped>
.history-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(
    to bottom,
    rgba(10, 15, 22, 0.97) 0%,
    rgba(15, 20, 28, 0.98) 50%,
    rgba(10, 15, 22, 0.97) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 历史面板头部 */
.history-header {
  padding: 30px 40px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.02) 0%,
    transparent 100%
  );
}

.history-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.history-title svg {
  opacity: 0.8;
}

.history-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.05em;
  margin-left: 32px;
}

/* 历史内容区域 */
.history-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 40px;
  scroll-behavior: smooth;
}

/* 自定义滚动条 */
.history-content::-webkit-scrollbar {
  width: 8px;
}

.history-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.history-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.history-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 空状态 */
.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.3);
  gap: 20px;
}

.history-empty p {
  font-size: 1.1rem;
  letter-spacing: 0.1em;
}

/* 历史记录列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

/* 历史记录项 */
.history-item {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.03) 0%,
    rgba(255, 255, 255, 0.01) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.history-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(127, 140, 141, 0.5),
    rgba(127, 140, 141, 0.2)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.history-item:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
}

.history-item:hover::before {
  opacity: 1;
}

/* 说话者名称 */
.history-speaker {
  font-size: 0.95rem;
  font-weight: 700;
  color: #7f8c8d;
  letter-spacing: 0.1em;
  margin-bottom: 10px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 历史文本内容 */
.history-text {
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 时间戳 */
.history-timestamp {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
  text-align: right;
}

/* 历史面板底部 */
.history-footer {
  padding: 15px 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 0.02) 0%,
    transparent 100%
  );
}

.history-stats {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  letter-spacing: 0.05em;
}

/* 过渡动画 */
.history-fade-enter-active,
.history-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.history-fade-enter-from,
.history-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-header {
    padding: 20px 20px 15px;
  }
  
  .history-title {
    font-size: 1.2rem;
  }
  
  .history-hint {
    font-size: 0.75rem;
    margin-left: 28px;
  }
  
  .history-content {
    padding: 15px 20px;
  }
  
  .history-item {
    padding: 16px 18px;
  }
  
  .history-text {
    font-size: 0.95rem;
  }
  
  .history-footer {
    padding: 12px 20px;
  }
}
</style>

































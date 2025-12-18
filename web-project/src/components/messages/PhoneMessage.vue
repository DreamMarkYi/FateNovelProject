<template>
  <div class="phone-message" :class="{ 'unread': !isRead, 'incoming': direction === 'received', 'outgoing': direction === 'sent' }">
    <div class="phone-call-header">
      <div class="phone-icon">📞</div>
      <div class="phone-status">
        <span class="call-direction">{{ direction === 'received' ? 'INCOMING' : 'OUTGOING' }}</span>
        <span class="call-duration">{{ dateDisplay }}</span>
      </div>
    </div>
    <div class="phone-contact">
      <span class="contact-label">FROM:</span>
      <span class="contact-name">{{ sender }}</span>
    </div>
    <div class="phone-content">
      <div class="call-note">{{ content }}</div>
    </div>
    <div class="phone-waveform">
      <div class="wave-bar" v-for="i in 5" :key="i" :style="{ height: getWaveHeight(i) + 'px', animationDelay: (i * 0.1) + 's' }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sender: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  dateDisplay: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    default: 'received',
    validator: (value) => ['sent', 'received'].includes(value)
  },
  isRead: {
    type: Boolean,
    default: false
  }
})

const getWaveHeight = (index) => {
  // 生成不同高度的波形条
  const heights = [8, 12, 6, 10, 8]
  return heights[index - 1] || 8
}
</script>

<style scoped>
.phone-message {
  --bg-color: #050505;
  --text-main: #d0d0d0;
  --text-dim: #555555;
  --text-msg: #888888;
  --sender-color: #bd93f9;
  --accent-warn: #ffcc00;
  
  background: rgba(30, 25, 20, 0.6);
  border: 2px solid rgba(200, 150, 100, 0.3);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  position: relative;
  opacity: 0.7;
  font-family: 'Share Tech Mono', monospace;
}

.phone-message.unread {
  opacity: 1;
  border-color: rgba(200, 150, 100, 0.6);
  box-shadow: 0 0 15px rgba(200, 150, 100, 0.3);
}

.phone-message.incoming {
  border-left: 4px solid rgba(100, 200, 100, 0.6);
}

.phone-message.outgoing {
  border-left: 4px solid rgba(200, 100, 100, 0.6);
}

.phone-message:hover {
  border-color: rgba(200, 150, 100, 0.5);
  background: rgba(30, 25, 20, 0.8);
}

.phone-call-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(200, 150, 100, 0.2);
}

.phone-icon {
  font-size: 20px;
  line-height: 1;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.phone-status {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.call-direction {
  color: var(--accent-warn, #ffcc00);
  font-weight: bold;
  font-size: 0.8rem;
  letter-spacing: 1px;
  font-family: 'Share Tech Mono', monospace;
}

.call-duration {
  color: var(--text-dim, #555555);
  font-size: 0.75rem;
}

.phone-contact {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.contact-label {
  color: var(--text-dim, #555555);
  font-size: 0.75rem;
  font-family: 'Share Tech Mono', monospace;
}

.contact-name {
  color: var(--sender-color, #bd93f9);
  font-weight: bold;
  font-size: 0.9rem;
}

.phone-content {
  margin-bottom: 10px;
}

.call-note {
  color: var(--text-msg, #888888);
  line-height: 1.6;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
  font-style: italic;
}

.phone-message.unread .call-note {
  color: var(--text-main, #d0d0d0);
}

.phone-waveform {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 15px;
  padding: 4px 0;
}

.wave-bar {
  width: 3px;
  background: rgba(200, 150, 100, 0.6);
  border-radius: 2px;
  animation: wave 1.5s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
  50% { transform: scaleY(1); opacity: 1; }
}

.phone-message.unread .wave-bar {
  background: rgba(200, 150, 100, 0.9);
  animation-duration: 1s;
}
</style>


<template>
  <div class="qq-message" :class="{ 'unread': !isRead, 'sent': direction === 'sent' }">
    <div class="qq-avatar">
      <div class="avatar-icon">{{ getAvatarIcon(sender) }}</div>
    </div>
    <div class="qq-content-wrapper">
      <div class="qq-header">
        <span class="qq-nickname">{{ sender }}</span>
        <span class="qq-time">{{ dateDisplay }}</span>
      </div>
      <div class="qq-bubble" :class="{ 'sent': direction === 'sent' }">
        <div class="qq-content">{{ content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
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

const getAvatarIcon = (sender) => {
  // 根据发送者名称生成头像图标
  if (!sender) return '?'
  const firstChar = sender.charAt(0).toUpperCase()
  return firstChar
}
</script>

<style scoped>
.qq-message {
  --bg-color: #050505;
  --text-main: #d0d0d0;
  --text-dim: #555555;
  --text-msg: #888888;
  --sender-color: #bd93f9;
  
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  padding: 8px;
  transition: all 0.3s ease;
  opacity: 0.7;
  align-items: flex-start;
  font-family: 'Share Tech Mono', monospace;
}

.qq-message.unread {
  opacity: 1;
}

.qq-message.sent {
  flex-direction: row-reverse;
}

.qq-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(100, 150, 200, 0.3), rgba(150, 100, 200, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(100, 150, 200, 0.4);
}

.qq-message.unread .qq-avatar {
  border-color: rgba(100, 150, 200, 0.7);
  box-shadow: 0 0 8px rgba(100, 150, 200, 0.3);
}

.avatar-icon {
  color: var(--text-main, #d0d0d0);
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

.qq-content-wrapper {
  flex: 1;
  min-width: 0;
}

.qq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding: 0 8px;
}

.qq-nickname {
  color: var(--sender-color, #bd93f9);
  font-size: 0.75rem;
  font-weight: bold;
}

.qq-time {
  color: var(--text-dim, #555555);
  font-size: 0.7rem;
}

.qq-bubble {
  background: rgba(40, 40, 50, 0.7);
  border-radius: 12px;
  padding: 10px 14px;
  position: relative;
  border: 1px solid rgba(100, 150, 200, 0.2);
  max-width: 85%;
}

.qq-bubble::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border: 6px solid transparent;
}

.qq-message:not(.sent) .qq-bubble::before {
  left: -12px;
  top: 12px;
  border-right-color: rgba(40, 40, 50, 0.7);
}

.qq-message.sent .qq-bubble::before {
  right: -12px;
  top: 12px;
  border-left-color: rgba(60, 80, 100, 0.7);
}

.qq-message.sent .qq-bubble {
  background: rgba(60, 80, 100, 0.7);
  border-color: rgba(100, 150, 200, 0.3);
  margin-left: auto;
}

.qq-message.unread .qq-bubble {
  border-color: rgba(100, 150, 200, 0.5);
  box-shadow: 0 2px 8px rgba(100, 150, 200, 0.2);
}

.qq-content {
  color: var(--text-msg, #888888);
  line-height: 1.6;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.qq-message.unread .qq-content {
  color: var(--text-main, #d0d0d0);
}

.qq-message:hover .qq-bubble {
  border-color: rgba(100, 150, 200, 0.4);
  background: rgba(40, 40, 50, 0.9);
}

.qq-message.sent:hover .qq-bubble {
  background: rgba(60, 80, 100, 0.9);
}
</style>


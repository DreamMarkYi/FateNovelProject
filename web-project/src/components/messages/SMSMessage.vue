<template>
  <div class="sms-message" :class="{ 'unread': !isRead }">
    <div class="sms-header">
      <div class="sms-icon">📱</div>
      <div class="sms-meta">
        <div class="sms-sender">{{ sender }}</div>
        <div class="sms-time">{{ dateDisplay }}</div>
      </div>
    </div>
    <div class="sms-content">
      {{ content }}
    </div>
    <div class="sms-footer">
      <span class="sms-type">SMS</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
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
  isRead: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.sms-message {
  --bg-color: #050505;
  --text-main: #d0d0d0;
  --text-dim: #555555;
  --text-msg: #888888;
  --sender-color: #bd93f9;
  --prompt-user: #40e0d0;
  
  background: rgba(20, 20, 30, 0.6);
  border: 1px solid rgba(100, 150, 200, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  position: relative;
  opacity: 0.7;
  font-family: 'Share Tech Mono', monospace;
}

.sms-message.unread {
  opacity: 1;
  border-color: rgba(100, 150, 200, 0.6);
  box-shadow: 0 0 10px rgba(100, 150, 200, 0.2);
}

.sms-message:hover {
  border-color: rgba(100, 150, 200, 0.5);
  background: rgba(20, 20, 30, 0.8);
}

.sms-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(100, 150, 200, 0.2);
}

.sms-icon {
  font-size: 18px;
  line-height: 1;
}

.sms-meta {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sms-sender {
  color: var(--sender-color, #bd93f9);
  font-weight: bold;
  font-size: 0.85rem;
}

.sms-time {
  color: var(--text-dim, #555555);
  font-size: 0.75rem;
}

.sms-content {
  color: var(--text-msg, #888888);
  line-height: 1.6;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 6px;
}

.sms-message.unread .sms-content {
  color: var(--text-main, #d0d0d0);
}

.sms-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.sms-type {
  color: var(--text-dim, #555555);
  font-size: 0.7rem;
  opacity: 0.5;
  font-family: 'Share Tech Mono', monospace;
}
</style>


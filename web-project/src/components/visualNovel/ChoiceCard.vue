<template>
  <div 
    class="choice-card"
    :style="{ 
      opacity: 1.0, 
      animation: `fadeIn 1s ease ${delay}s forwards` 
    }"
    @click="handleClick"
  >
    <div class="card-text">{{ text }}</div>
  </div>
</template>

<script setup>
const props = defineProps({
  text: {
    type: String,
    required: true
  },
  delay: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['select'])

function handleClick(e) {
  e.stopPropagation()
  emit('select')
}
</script>

<style scoped>
.choice-card {
  width: 240px;
  height: 340px;
  border: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  background: transparent;
  /* 分离hover效果的transition，避免与动画冲突 */
  transition: border-color 0.5s ease, background 0.5s ease;
  will-change: transform;
}

.choice-card:hover {
  /* 使用独立的transform，不会影响fadeIn动画完成后的状态 */
  transform: translateY(-5px) !important;
  border-color: #888;
  background: rgba(255, 255, 255, 0.05);
}

.card-text {
  writing-mode: vertical-rl;
  font-size: 1.2rem;
  letter-spacing: 0.5rem;
  pointer-events: none;
  /* 继承父元素字体 */
  font-family: inherit;
  color: inherit;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>


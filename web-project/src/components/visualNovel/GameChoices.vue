<template>
  <div id="choice-layer" :class="{ active: visible }">
    <button
        v-for="(item, index) in choices"
        :key="index"
        class="choice-btn"
        @click.stop="selectChoice(item)"
    >
      {{ item.text }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  choices: {
    type: Array,
    default: () => [] // 格式: [{text: '...', jump: 1}]
  }
});

const emit = defineEmits(['make-choice']);

function selectChoice(item) {
  emit('make-choice', item);
}
</script>

<style scoped>
/* === 核心修改版样式 === */
#choice-layer {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 50; opacity: 0; pointer-events: none; transition: opacity 0.5s ease;
}
#choice-layer.active { opacity: 1; pointer-events: auto; }

.choice-btn {
  position: relative;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%);
  border: none;
  color: var(--accent-color);
  font-family: var(--font-main);
  font-size: 1.4rem;
  letter-spacing: 0.2rem;
  padding: 25px 0;
  margin: 15px 0;
  width: 60%;
  max-width: 600px;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  text-align: center;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

/* 上下线条动画 */
.choice-btn::before, .choice-btn::after {
  content: ''; position: absolute; left: 50%; transform: translateX(-50%);
  width: 0%; height: 1px;
  background-color: var(--text-color);
  transition: width 0.5s ease, opacity 0.5s ease;
  opacity: 0;
}
.choice-btn::before { top: 0; }
.choice-btn::after { bottom: 0; }

/* Hover 效果 */
.choice-btn:hover {
  color: var(--text-color);
  letter-spacing: 0.6rem;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
}
.choice-btn:hover::before, .choice-btn:hover::after {
  width: 100%; opacity: 0.8;
}

/* 亮色模式适配 (需父级有 theme-light class) */
:global(.theme-light) .choice-btn {
  color: var(--accent-color);
  background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.02) 50%, transparent 100%);
}
:global(.theme-light) .choice-btn:hover {
  color: #000;
  background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 50%, transparent 100%);
}
:global(.theme-light) .choice-btn::before,
:global(.theme-light) .choice-btn::after {
  background-color: #000;
}
</style>
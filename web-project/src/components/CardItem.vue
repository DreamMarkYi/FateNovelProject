<template>
  <div
      class="card"
      :class="{ 'card-locked': !unlocked, 'active': isActive }"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      ref="cardRef"
      :style="backgroundStyle"
  >
    <div class="card-background"></div>

    <div class="card-gradient-layer"></div>

    <div class="particles-container">
      <div
          v-for="(style, index) in particles"
          :key="index"
          class="particle"
          :style="style"
      ></div>
    </div>

    <div class="card-content" :class="{ 'content-blur': !unlocked }">
      <div class="top-meta-group">
        <div class="card-season">{{ season }}</div>
        <div class="meta-line"></div> <div class="card-number">{{ number }}</div>
      </div>

      <div class="titles-container">
        <div class="card-label">{{ label }}</div>
        <div class="card-subtitle">
          <span
              v-for="(char, index) in subtitleChars"
              :key="index"
              :style="{ '--i': index }"
          >{{ char }}</span>
        </div>
        <div class="card-title">{{ title }}</div>
      </div>
    </div>

    <div v-if="!unlocked" class="card-lock-overlay">
      <div class="lock-text">未解锁</div>
    </div>

    <div class="card-command-layer"></div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted } from 'vue'

const props = defineProps({
  season: { type: String, required: true },
  number: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  label: { type: String, required: true },
  backgroundImage: { type: String, required: true },
  hoverGradient: { type: String, required: true },
  decorationType: { type: String, default: 'type1' },
  index: { type: Number, default: 0 },
  unlocked: { type: Boolean, default: true },
  commandImage: { type: String, default: '/storyImage/command1.png' },
  overlayColor: { type: String, default: 'rgba(100, 150, 200, 0.3)' },
  overlayDarkColor: { type: String, default: 'rgba(50, 80, 120, 0.3)' },
  overlayBackgroundImage: { type: String, default: '/storyImage/harukaBG.png' },
  isActive: { type: Boolean, default: false }
})

const emit = defineEmits(['click', 'hover', 'hover-end'])
const cardRef = ref(null)
const particles = ref([])

// 生成粒子数据 (保持不变)
const generateParticles = () => {
  const count = 50
  const newParticles = []
  for (let i = 0; i < count; i++) {
    const isLow = Math.random() < 0.7
    const riseHeight = isLow ? 20 + Math.random() * 30 : 50 + Math.random() * 70
    const duration = 5 + (riseHeight / 10) * (1 + Math.random())
    newParticles.push({
      '--delay': `-${Math.random() * 20}s`,
      '--duration': `${duration}s`,
      '--x-start': `${Math.random() * 100}%`,
      '--x-end': `${Math.random() * 100 + (Math.random() - 0.5) * 50}%`,
      '--y-end': `-${riseHeight}vh`,
      '--size': `${1 + Math.random() * 4}px`,
      '--opacity': 0.1 + Math.random() * 0.7
    })
  }
  particles.value = newParticles
}

onMounted(() => {
  generateParticles()
})

const subtitleChars = computed(() => props.subtitle.split(''))

const backgroundStyle = computed(() => {
  return {
    '--bg-image': `url(${props.backgroundImage})`,
    '--hover-gradient': props.hoverGradient,
    '--cmd-image': `url(${props.commandImage})`,
    '--overlay-color': props.overlayColor,
    '--overlay-dark-color': props.overlayDarkColor,
    '--overlay-bg-image': `url(${props.overlayBackgroundImage})`,
  }
})

// 点击处理
const handleClick = (e) => {
  if (!props.unlocked) return
  const card = e.currentTarget
  card.style.transform = 'skewY(-2deg) scale(0.98)'
  setTimeout(() => { card.style.transform = 'skewY(-2deg)' }, 200)
  emit('click', props.index)
}

// 悬浮处理
const handleMouseEnter = () => {
  if (!props.unlocked) return
  emit('hover', props.index)
}

const handleMouseLeave = () => {
  if (!props.unlocked) return
  emit('hover-end', props.index)
}

defineExpose({ cardRef })
</script>

<style scoped>
/* Google Fonts 建议 */
/* @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+JP:wght@300;600;900&display=swap'); */

/* ================== 卡片基础结构 ================== */
.card {
  flex: 0 0 auto;
  width: var(--card-width, 180px);
  min-width: 120px;
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  transform: skewY(-2deg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  /* 字体设置 */
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.card.active {
  width: var(--card-active-width, 320px);
  transform: skewY(-2deg) scale(1.01);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  z-index: 5;
}

.card:not(.active) {
  width: var(--card-width, 180px);
}

/* 未解锁状态 */
.card-locked {
  cursor: not-allowed;
  opacity: 0.85;
}

/* ================== 背景层 ================== */
.card-background {
  position: absolute;
  top: -5%;
  left: 0;
  width: 100%;
  height: 110%;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.card.active .card-background {
  transform: scale(1.05);
}

/* 覆盖层背景图片 */
.card-background::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: var(--overlay-bg-image);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.8;
  z-index: 2;
}

.card.active .card-background::before {
  z-index: 1;
  opacity: 0.2;
  mix-blend-mode: screen;
}

/* 人物图片层 */
.card-background::after {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: var(--bg-image);
  background-size: cover;
  background-repeat: no-repeat;
  opacity: 1;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.card.active .card-background::after {
  opacity: 1;
  z-index: 5;
}

/* 渐变色层 */
.card-gradient-layer {
  position: absolute;
  top: -5%; left: 0; width: 100%; height: 110%;
  background: var(--hover-gradient);
  mask-image: linear-gradient(to bottom, transparent 40%, black 60%);
  mask-size: 100% 300%;
  mask-position: 0 100%;
  mask-repeat: no-repeat;
  filter: drop-shadow(0 -5px 0px rgba(255, 255, 255, 0.6)) brightness(1.2);
  opacity: 1;
  z-index: 7;
  pointer-events: none;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), mask-position 0.8s cubic-bezier(0.4, 0, 0.2, 1), z-index 0s 0s;
}

.card.active .card-gradient-layer {
  z-index: -1;
  opacity: 1;
  transform: scale(1.05);
  mask-position: 0 0;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), mask-position 0.8s cubic-bezier(0.4, 0, 0.2, 1), z-index 0s 0.8s;
}

/* 右侧分割线 */
.card::before {
  content: '';
  position: absolute;
  top: 0; right: -1px;
  width: 1px; height: 100%;
  background: rgba(255,255,255,0.2);
  z-index: 10;
}

/* ================== 内容排版 (核心修改区域) ================== */

.card-content {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 10;
  transform: skewY(2deg); /* 反向倾斜 */
  transition: filter 0.6s ease;
  padding: 0; /* 清除默认padding，使用绝对定位 */
  pointer-events: none; /* 让文字不阻挡背景点击，如果需要文字点击可去掉 */
}

.content-blur {
  filter: blur(80px);
}

/* --- 1. 顶部信息组 (Season - Line - Number) --- */
.top-meta-group {
  position: absolute;
  top: 40px;
  left: 30px;
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 季节 (圆角矩形/椭圆) */
.card-season {
  /* position: relative; 已移除绝对定位，改用 flex */
  height: 28px;
  padding: 0 14px;
  border: 1px solid rgba(20, 20, 20, 0.6);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #1a1a1a;
  background: rgba(255,255,255,0.3); /* 增加一点背景提升可读性 */
  backdrop-filter: blur(2px);
  letter-spacing: 1px;
  text-transform: uppercase;
  font-family: 'Cinzel', serif;
  transition: all 0.5s ease;
}

.card.active .card-season {
  background: rgba(255,255,255,0.8);
  border-color: #000;
}

/* 装饰横线 */
.meta-line {
  width: 40px;
  height: 1px;
  background: rgba(0,0,0,0.4);
  transition: width 0.5s ease;
}

.card.active .meta-line {
  width: 60px;
  background: rgba(0,0,0,0.8);
}

/* 编号 */
.card-number {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
  font-weight: 600;
}

.card.active .card-number {
  color: rgba(0, 0, 0, 1);
  font-size: 16px;
}

/* --- 2. 标题组容器 (位于顶部信息下方) --- */
.titles-container {
  position: absolute;
  top: 90px;
  left: 35px;
  display: flex;
  flex-direction: row; /* 横向排列竖排的文字列 */
  align-items: flex-start;
  gap: 15px; /* 列之间的间距 */
}

/* 英文标签 (最左侧) */
.card-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 9px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.3);
  letter-spacing: 3px;
  text-transform: uppercase;
  font-family: sans-serif;
  transition: all 0.6s ease;
  border-right: 1px solid rgba(0,0,0,0.05); /* 右侧加一条极细的分割线 */
  padding-right: 8px;
  height: 120px; /* 控制线条高度 */
}

.card.active .card-label {
  color: rgba(0, 0, 0, 0.6);
  letter-spacing: 5px;
}

/* 副标题 (中间) */
.card-subtitle {
  writing-mode: vertical-rl;
  text-orientation: upright; /* 汉字直立 */
  font-size: 14px;
  font-weight: 500;
  color: rgba(20, 20, 20, 0.7);
  letter-spacing: 6px;
  transition: all 0.6s ease;
  padding-top: 10px; /* 稍微错落 */
  font-family: 'Noto Serif JP', serif;
}

.card.active .card-subtitle {
  color: #000;
  letter-spacing: 8px;
}

/* 主标题 (最右侧/靠内，最大) */
.card-title {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 28px;
  font-weight: 900;
  color: #1a1a1a;
  letter-spacing: 12px;
  margin: 0; /* 移除之前的负margin */
  padding: 0;
  transition: all 0.6s ease;
  text-shadow: 2px 2px 0px rgba(255,255,255,0.4);
  font-family: 'Noto Serif JP', serif;
}

.card.active .card-title {
  letter-spacing: 16px;
  transform: translateY(-5px); /* 激活时轻微上浮 */
}

/* 移除原有的 card-title 装饰线，保持左上角干净 */
.card-title::before,
.card-title::after {
  display: none;
}

/* ================== 其他装饰保持不变 ================== */

/* 未解锁遮罩层 */
.card-lock-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(30px);
  z-index: 20;
  transform: skewY(2deg);
  pointer-events: none;
}

.lock-text {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 18px; color: rgba(100, 100, 120, 0.8);
  letter-spacing: 4px;
}

/* 粒子特效 */
.particles-container {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  overflow: hidden; pointer-events: none; z-index: 8; opacity: 1;
  mask-image: linear-gradient(to bottom, transparent 40%, black 60%);
  mask-size: 100% 300%; mask-position: 0 100%; mask-repeat: no-repeat;
  filter: drop-shadow(0 -5px 15px rgba(255, 255, 255, 0.6)) brightness(1.2);
  transition: opacity 0.4s ease, mask-position 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.particle {
  position: absolute; bottom: -20px; left: var(--x-start);
  width: var(--size); height: var(--size);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 30%, transparent 70%);
  border-radius: 50%;
  animation: particle-rise var(--duration) linear var(--delay) infinite;
}

.card.active .particles-container { opacity: 1; mask-position: 0 0; }

@keyframes particle-rise {
  0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(var(--y-end)) translateX(calc(var(--x-end) - var(--x-start))) rotate(360deg); opacity: 0; }
}

/* 命令图片层 */
.card-command-layer {
  position: absolute; top: 550px; left: 0; width: 100%; height: 100%;
  background-image: var(--cmd-image); background-size: cover; background-repeat: no-repeat; background-position: center;
  z-index: 15; pointer-events: none;
  mask-image: linear-gradient(to bottom, transparent 40%, black 60%);
  mask-size: 100% 300%; mask-position: 0 100%; mask-repeat: no-repeat;
  transition: opacity 0.4s ease, mask-position 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.4)) brightness(1.1) contrast(1.1) saturate(1.1);
  mix-blend-mode: screen;
  animation: command-pulse 4s ease-in-out infinite;
}
.card.active .card-command-layer { mask-position: 0 0; }
@keyframes command-pulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.4; }
}

/* 响应式 */
@media (max-width: 1400px) {
  .top-meta-group { left: 20px; }
  .titles-container { left: 20px; }
  .card-title { font-size: 24px; }
}
</style>
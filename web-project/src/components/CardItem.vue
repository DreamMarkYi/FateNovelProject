<template>
  <div
    class="card"
    :class="{ 'card-locked': !unlocked, 'active': isActive }"
    @click="handleClick"
    ref="cardRef"
    :style="backgroundStyle"
  >
    <div class="card-background"></div>

    <!-- 渐变色层 - 未激活时在最顶层，激活后在最下层 -->
    <div class="card-gradient-layer"></div>

    <!-- 粒子特效层 -->
    <div class="particles-container">
      <div
        v-for="(style, index) in particles"
        :key="index"
        class="particle"
        :style="style"
      ></div>
    </div>

    <div class="card-content" :class="{ 'content-blur': !unlocked }">
      <div class="card-season">{{ season }}</div>
      <div class="card-number">{{ number }}</div>
      <div class="card-title">{{ title }}</div>
      <div class="card-subtitle">
        <span
          v-for="(char, index) in subtitleChars"
          :key="index"
          :style="{ '--i': index }"
        >{{ char }}</span>
      </div>
      <div class="card-label">{{ label }}</div>
    </div>

    <!-- 未解锁遮罩层 -->
    <div v-if="!unlocked" class="card-lock-overlay">
      <div class="lock-text">未解锁</div>
    </div>

    <!-- 命令图片层 - 未激活时显示在最上层 -->
    <div class="card-command-layer"></div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted } from 'vue'

const props = defineProps({
  season: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  backgroundImage: {
    type: String,
    required: true
  },
  hoverGradient: {
    type: String,
    required: true
  },
  decorationType: {
    type: String,
    default: 'type1', // type1 或 type2
    validator: (value) => ['type1', 'type2'].includes(value)
  },
  index: {
    type: Number,
    default: 0
  },
  unlocked: {
    type: Boolean,
    default: true
  },
  commandImage: {
    type: String,
    default: '/storyImage/command1.png'
  },
  overlayColor: {
    type: String,
    default: 'rgba(100, 150, 200, 0.3)' // 亮色（对应图片的白色部分）
  },
  overlayDarkColor: {
    type: String,
    default: 'rgba(50, 80, 120, 0.3)' // 暗色（对应图片的黑色部分）
  },
  overlayBackgroundImage: {
    type: String,
    default: '/storyImage/harukaBG.png' // 覆盖层背景图片
  },
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const cardRef = ref(null)
const decoRefs = ref([])
const particles = ref([])

// 生成粒子数据
const generateParticles = () => {
  const count = 50
  const newParticles = []

  for (let i = 0; i < count; i++) {
    // 决定粒子上升高度：70% 的粒子在 50% 以下，30% 的粒子可以更高
    const isLow = Math.random() < 0.7
    const riseHeight = isLow
      ? 20 + Math.random() * 30  // 20vh - 50vh
      : 50 + Math.random() * 70  // 50vh - 120vh

    // 速度（持续时间）：高度越高，时间越长，但增加随机性
    // 基础时间 10s，每 10vh 增加 1-2s
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

// 将副标题字符串拆分为字符数组
const subtitleChars = computed(() => {
  return props.subtitle.split('')
})

// 背景样式
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

// 装饰元素配置
const decorations = computed(() => {
  if (props.decorationType === 'type1') {
    return [
      { class: 'deco-corner deco-tl' },
      { class: 'deco-corner deco-br' },
      { class: 'deco-center' },
      { class: 'deco-line deco-line-1' },
      { class: 'deco-dash deco-dash-1' }
    ]
  } else {
    return [
      { class: 'deco-corner deco-tr' },
      { class: 'deco-corner deco-bl' },
      { class: 'deco-center' },
      { class: 'deco-line deco-line-2' },
      { class: 'deco-dash deco-dash-2' }
    ]
  }
})

// 点击处理
const handleClick = (e) => {
  // 未解锁时不允许点击
  if (!props.unlocked) {
    return
  }

  const card = e.currentTarget
  card.style.transform = 'skewY(-2deg) scale(0.98)'
  setTimeout(() => {
    card.style.transform = 'skewY(-2deg)'
  }, 200)
  emit('click', props.index)
}

// 暴露方法供父组件调用（用于视差效果）
defineExpose({
  cardRef,
  decoRefs
})
</script>

<style scoped>
/* 卡片 */
.card {
  flex: 1;
  min-width: 180px;
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  transform: skewY(-2deg); /* 倾斜卡片 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card.active {
  flex: 1.8;
  transform: skewY(-2deg) scale(1.01);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.card:not(.active) {
  flex: 0.9;
}

/* 未解锁状态 */
.card-locked {
  cursor: not-allowed;
  opacity: 0.85;
}

.card-locked.active {
  flex: 1;
  transform: skewY(-2deg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-locked.active .card-background {
  transform: none;
}

/* 背景层 */
.card-background {
  position: absolute;
  top: -5%;
  left: 0;
  width: 100%;
  height: 110%;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden; /* 确保背景层内容不溢出 */
}

.card.active .card-background {
  transform: scale(1.05);
}

/* 渐变色层 - 未悬停时在最顶层，悬停后在最下层 */
.card-gradient-layer {
  position: absolute;
  top: -5%;
  left: 0;
  width: 100%;
  height: 110%;
  background: var(--hover-gradient);

  /* 使用 mask 实现柔和边缘 */
  mask-image: linear-gradient(to bottom, transparent 40%, black 60%);
  mask-size: 100% 300%;
  mask-position: 0 100%; /* 初始状态：显示底部（黑色/可见部分） */
  mask-repeat: no-repeat;

  /* 光感效果：边缘发光 + 整体提亮 */
  filter: drop-shadow(0 -5px 0px rgba(255, 255, 255, 0.6)) brightness(1.2);

  opacity: 1;
  z-index: 7; /* 未悬停时在最顶层 */
  pointer-events: none; /* 不阻挡点击事件 */

  /*
     Appear (Active -> Inactive):
     - mask-position: 0 0 -> 0 100% (从下往上长出来)
     - z-index: 立即变回 7
  */
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1),
              mask-position 0.8s cubic-bezier(0.4, 0, 0.2, 1),
              z-index 0s 0s;
}

/* 激活时渐变色层先移到最底层再变化透明度 */
.card.active .card-gradient-layer {
  z-index: -1; /* 激活时在最底层 */
  opacity: 1;
  transform: scale(1.05);

  /* 激活状态：显示顶部（透明/隐藏部分） */
  mask-position: 0 0;

  /*
     Disappear (Inactive -> Active):
     - mask-position: 0 100% -> 0 0 (从上往下消失)
     - z-index: 延迟变化
  */
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1),
              mask-position 0.8s cubic-bezier(0.4, 0, 0.2, 1),
              z-index 0s 0.8s;
}

/* 覆盖层背景图片 - 未hover时在最上层，hover时在人物下方 */
.card-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: var(--overlay-bg-image);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.8;
  z-index: 2; /* 未hover时在最上层 */

}


/* 激活时覆盖层移到人物下方 */
.card.active .card-background::before {
  z-index: 1; /* 激活时在人物下方 */
  opacity: 0.2;
  mix-blend-mode: screen;
}


/* 人物图片层 - 在渐变色上层 */
.card-background::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: var(--bg-image);
  background-size: cover;
  background-repeat: no-repeat;
  opacity: 1;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;

}

/* 激活时人物图片更明显 */
.card.active .card-background::after {
  opacity: 1;
  z-index: 5;

}

/* 分割线 - 调整为适应新布局 */
.card::before {
  content: '';
  position: absolute;
  top: 0;
  right: -10px; /* 调整位置以适应间距 */
  width: 1px;
  height: 100%;
  background: linear-gradient(to bottom,
  transparent 0%,
  rgba(200, 200, 210, 0.1) 10%,
  rgba(200, 200, 210, 0.15) 50%,
  rgba(200, 200, 210, 0.1) 90%,
  transparent 100%);
  z-index: 10;
}


/* 内容容器 - 增加内边距 */
.card-content {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 改为左对齐 */
  justify-content: center;
  padding: 80px 40px 80px 50px; /* 增加左侧内边距 */
  z-index: 10;
  transform: skewY(2deg); /* 反向倾斜使内容保持垂直 */
  transition: filter 0.6s ease;
}

/* 未解锁时内容模糊 */
.content-blur {
  filter: blur(80px);
  user-select: none;
  pointer-events: none;
}

/* 卡片编号 - 调整位置 */
.card-number {
  position: absolute;
  top: 40px; /* 增加顶部距离 */
  right: 35px;
  font-size: 11px;
  color: rgba(100, 100, 120, 0.4);
  letter-spacing: 2px;
  font-weight: 200;
  font-family: 'Noto Sans JP', sans-serif;
  transition: all 0.6s ease;
}

.card.active .card-number {
  color: rgba(100, 100, 120, 0.6);
}

/* 季节标记 - 调整位置 */
.card-season {
  position: absolute;
  top: 40px; /* 增加顶部距离 */
  left: 50px; /* 更靠左 */
  width: auto;
  min-width: 60px;
  height: 30px;
  padding: 0 16px;
  border: 1px solid rgba(120, 120, 140, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: rgba(0, 0, 0, 1);
  font-weight: 300;
  transition: all 0.5s ease;
}

.card.active .card-season {
  border-color: rgba(120, 120, 140, 1);
  color: rgba(100, 100, 120, 1);
}

/* 主标题 */
.card-title {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 24px;
  font-weight: 300;
  color: rgba(20, 20, 20, 1);
  letter-spacing: 10px;
  margin-top: -1200px; /* 向上移动 */
  padding: 30px;
  margin-bottom: 40px; /* 增加间距 */
  position: absolute;
  transition: all 0.6s ease;
}

.card.active .card-title {
  letter-spacing: 14px;
  color: rgba(50, 50, 70, 1);
}

/* 标题装饰线 */
.card-title::before,
.card-title::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  transition: all 0.6s ease;
}

.card-title::before {
  top: -55px; /* 调整位置 */
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom,
  transparent,
  rgba(120, 120, 140, 0.25),
  rgba(120, 120, 140, 0.4));
}

.card-title::after {
  bottom: -55px;
  width: 1px;
  height: 40px;
  background: linear-gradient(to top,
  transparent,
  rgba(120, 120, 140, 0.25),
  rgba(120, 120, 140, 0.4));
}

.card.active .card-title::before {
  height: 45px;
  top: -60px;
  background: linear-gradient(to bottom,
  transparent,
  rgba(120, 120, 140, 0.35),
  rgba(120, 120, 140, 0.5));
}

.card.active .card-title::after {
  height: 45px;
  bottom: -60px;
  background: linear-gradient(to top,
  transparent,
  rgba(120, 120, 140, 0.35),
  rgba(120, 120, 140, 0.5));
}

/* 副标题 */
.card-subtitle {
  writing-mode: vertical-lr;
  text-orientation: upright;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px; /* 增加字符间距 */
  font-size: 14px;
  font-weight: 200;
  color: rgba(20, 20, 20, 0.9);
  letter-spacing: 6px;
  margin-top: -900px; /* 向上移动 */
  margin-bottom: 35px;
  transition: all 0.6s ease;
}

.card.active .card-subtitle {
  letter-spacing: 8px;
  color: rgba(80, 80, 100, 0.85);
}

.card-subtitle span {
  transition: all 0.4s ease;
  transition-delay: calc(var(--i) * 0.05s);
}

.card.active .card-subtitle span {
  transform: translateY(-2px);
}

/* 英文标签 */
.card-label {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 10px;
  font-weight: 200;
  color: rgba(100, 100, 120, 0.4);
  letter-spacing: 3px;
  text-transform: uppercase;
  transition: all 0.6s ease;
}

.card.active .card-label {
  letter-spacing: 5px;
  color: rgba(100, 100, 120, 0.65);
}

/* 装饰元素 */
.card-decoration {
  position: absolute;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 5;
}

/* 角落装饰 */
.deco-corner {
  width: 25px;
  height: 25px;
  border: 1px solid rgba(120, 120, 140, 0.15);
  transition: all 0.6s ease;
}

.deco-tl {
  top: 35px;
  left: 50px; /* 左侧装饰更靠左 */
  border-right: none;
  border-bottom: none;
}

.deco-tr {
  top: 35px;
  right: 35px;
  border-left: none;
  border-bottom: none;
}

.deco-bl {
  bottom: 35px;
  left: 50px; /* 左侧装饰更靠左 */
  border-right: none;
  border-top: none;
}

.deco-br {
  bottom: 35px;
  right: 35px;
  border-left: none;
  border-top: none;
}

.card.active .deco-corner {
  border-color: rgba(120, 120, 140, 0.3);
  transform: scale(1.2);
}

/* 中心装饰 */
.deco-center {
  top: 50%;
  left: 35%; /* 偏左显示 */
  transform: translate(-50%, -50%) rotate(45deg);
  width: 4px;
  height: 4px;
  background: rgba(120, 120, 140, 0.15);
  border-radius: 1px;
  transition: all 0.6s ease;
}

.card.active .deco-center {
  background: rgba(120, 120, 140, 0.3);
  transform: translate(-50%, -50%) rotate(45deg) scale(1.3);
}

/* 线条装饰 */
.deco-line {
  width: 50px;
  height: 1px;
  background: linear-gradient(to right,
  transparent,
  rgba(120, 120, 140, 0.15),
  transparent);
  transition: all 0.6s ease;
}

.deco-line-1 {
  top: 30%;
  right: 15%; /* 靠右的装饰 */
}

.deco-line-2 {
  bottom: 35%;
  left: 15%; /* 靠左的装饰 */
}

.card.active .deco-line {
  background: linear-gradient(to right,
  transparent,
  rgba(120, 120, 140, 0.35),
  transparent);
  width: 60px;
}

/* 虚线装饰 */
.deco-dash {
  width: 1px;
  height: 30px;
  background: linear-gradient(to bottom,
  rgba(120, 120, 140, 0.15) 0%,
  rgba(120, 120, 140, 0.15) 40%,
  transparent 40%,
  transparent 60%,
  rgba(120, 120, 140, 0.15) 60%,
  rgba(120, 120, 140, 0.15) 100%);
  transition: all 0.6s ease;
}

.deco-dash-1 {
  top: 40%;
  left: 20%; /* 靠左 */
}

.deco-dash-2 {
  bottom: 30%;
  right: 20%; /* 靠右 */
}

.card.active .deco-dash {
  background: linear-gradient(to bottom,
  rgba(120, 120, 140, 0.3) 0%,
  rgba(120, 120, 140, 0.3) 40%,
  transparent 40%,
  transparent 60%,
  rgba(120, 120, 140, 0.3) 60%,
  rgba(120, 120, 140, 0.3) 100%);
}

/* 未解锁遮罩层 */
.card-lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(30px);
  z-index: 20;
  transform: skewY(2deg);
  pointer-events: none;
}



.lock-text {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 18px;
  font-weight: 300;
  color: rgba(100, 100, 120, 0.8);
  letter-spacing: 4px;
  font-family: 'Noto Sans JP', sans-serif;
}

/* 粒子特效 */
.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 8; /* 在所有层之上，确保可见 */
  opacity: 1;

  /* Sync Mask with Gradient Layer */
  mask-image: linear-gradient(to bottom, transparent 40%, black 60%);
  mask-size: 100% 300%;
  mask-position: 0 100%;
  mask-repeat: no-repeat;

  /* Light Effect */
  filter: drop-shadow(0 -5px 15px rgba(255, 255, 255, 0.6)) brightness(1.2);

  transition: opacity 0.4s ease, mask-position 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.particle {
  position: absolute;
  bottom: -20px;
  left: var(--x-start);
  width: var(--size);
  height: var(--size);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 30%, transparent 70%);
  border-radius: 50%;
  animation: particle-rise var(--duration) linear var(--delay) infinite;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8),
              0 0 15px rgba(200, 220, 255, 0.4);
}

/* 激活状态下粒子更明显 */
.card.active .particles-container {
  opacity: 1;
  mask-position: 0 0;
}

.card.active .particle {
  background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(200, 220, 255, 0.8) 30%, rgba(150, 180, 255, 0.3) 50%, transparent 70%);
  box-shadow: 0 0 12px rgba(255, 255, 255, 1),
              0 0 20px rgba(200, 220, 255, 0.6),
              0 0 30px rgba(150, 180, 255, 0.3);
}

/* 粒子上升动画 */
@keyframes particle-rise {
  0% {
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(var(--y-end)) translateX(calc(var(--x-end) - var(--x-start))) rotate(360deg);
    opacity: 0;
  }
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .card-content {
    padding: 70px 30px;
  }
}

/* 命令图片层 */
.card-command-layer {
  position: absolute;
  top: 550px;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: var(--cmd-image);
  background-size:cover;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 15; /* 在内容之上，但在锁层之下 */
  pointer-events: none;

  /* Sync Mask with Gradient Layer */
  mask-image: linear-gradient(to bottom, transparent 40%, black 60%);
  mask-size: 100% 300%;
  mask-position: 0 100%;
  mask-repeat: no-repeat;

  transition: opacity 0.4s ease, mask-position 0.8s cubic-bezier(0.4, 0, 0.2, 1);

  /* Bloom 效果和质感增强 */
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.4)) brightness(1.1) contrast(1.1) saturate(1.1);
  /* 混合模式让亮部更亮 */
  mix-blend-mode: screen;

  /* 透明度呼吸动画 */
  animation: command-pulse 4s ease-in-out infinite;
}

.card.active .card-command-layer {
  mask-position: 0 0;
}

@keyframes command-pulse {
  0%, 100% {
    opacity: 0.2;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3)) brightness(1.05) contrast(1.1) saturate(1.1);
  }
  50% {
    opacity: 0.4;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.6)) brightness(1.15) contrast(1.1) saturate(1.1);
  }
}
</style>







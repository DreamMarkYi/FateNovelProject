<template>
  <div 
    class="card" 
    @click="handleClick"
    ref="cardRef"
  >
    <div class="card-background" :style="backgroundStyle"></div>

    <!-- 装饰元素 -->
    <div 
      v-for="(deco, index) in decorations" 
      :key="index"
      class="card-decoration"
      :class="deco.class"
      ref="decoRefs"
    ></div>

    <div class="card-content">
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
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

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
  }
})

const emit = defineEmits(['click'])

const cardRef = ref(null)
const decoRefs = ref([])

// 将副标题字符串拆分为字符数组
const subtitleChars = computed(() => {
  return props.subtitle.split('')
})

// 背景样式
const backgroundStyle = computed(() => {
  return {
    '--bg-image': `url(${props.backgroundImage})`,
    '--hover-gradient': props.hoverGradient
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

.card:hover {
  flex: 1.8;
  transform: skewY(-2deg) scale(1.01);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.card:not(:hover) {
  flex: 0.9;
}

/* 背景层 */
.card-background {
  position: absolute;
  top: -5%;
  left: 0;
  width: 100%;
  height: 110%;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover .card-background {
  transform: scale(1.05);
}

/* 背景渐变色层 - 在最底层 */
.card-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
    background: rgba(255, 255, 255, 0.85);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

/* hover时添加彩色渐变叠加到底层 */
.card:hover .card-background::before {
  background: var(--hover-gradient);
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

  opacity: 0.2;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

/* hover时人物图片更明显 */
.card:hover .card-background::after {
  opacity: 1;
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

/* 光泽效果 */
.card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(168deg,
  rgba(255, 255, 255, 0.6) 0%,
  rgba(255, 255, 255, 0.1) 50%,
  rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  z-index: 3;
}

.card:hover::after {
  opacity: 1;
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

.card:hover .card-number {
  color: rgba(100, 100, 120, 0.6);
}

/* 季节标记 - 调整位置 */
.card-season {
  position: absolute;
  top: 40px; /* 增加顶部距离 */
  left: 50px; /* 更靠左 */
  width: 32px;
  height: 32px;
  border: 1px solid rgba(120, 120, 140, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: rgba(100, 100, 120, 0.5);
  font-weight: 300;
  transition: all 0.5s ease;
}

.card:hover .card-season {
  border-color: rgba(120, 120, 140, 0.5);
  color: rgba(100, 100, 120, 0.8);
  transform: rotate(90deg);
}

/* 主标题 */
.card-title {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 24px;
  font-weight: 300;
  color: rgba(70, 70, 90, 1);
  letter-spacing: 10px;
  margin-top: -900px; /* 向上移动 */
  margin-bottom: 40px; /* 增加间距 */
  position: absolute;
  transition: all 0.6s ease;
}

.card:hover .card-title {
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

.card:hover .card-title::before {
  height: 45px;
  top: -60px;
  background: linear-gradient(to bottom,
  transparent,
  rgba(120, 120, 140, 0.35),
  rgba(120, 120, 140, 0.5));
}

.card:hover .card-title::after {
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
  color: rgba(100, 100, 120, 0.9);
  letter-spacing: 6px;
  margin-top: -700px; /* 向上移动 */
  margin-bottom: 35px;
  transition: all 0.6s ease;
}

.card:hover .card-subtitle {
  letter-spacing: 8px;
  color: rgba(80, 80, 100, 0.85);
}

.card-subtitle span {
  transition: all 0.4s ease;
  transition-delay: calc(var(--i) * 0.05s);
}

.card:hover .card-subtitle span {
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

.card:hover .card-label {
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

.card:hover .deco-corner {
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

.card:hover .deco-center {
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

.card:hover .deco-line {
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

.card:hover .deco-dash {
  background: linear-gradient(to bottom,
  rgba(120, 120, 140, 0.3) 0%,
  rgba(120, 120, 140, 0.3) 40%,
  transparent 40%,
  transparent 60%,
  rgba(120, 120, 140, 0.3) 60%,
  rgba(120, 120, 140, 0.3) 100%);
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .card-content {
    padding: 70px 30px;
  }
}
</style>


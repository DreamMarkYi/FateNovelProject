<template>
  <div class="minimal-card"
       ref="cardElement"
       @mouseenter="$emit('mouseenter')"
       @mouseleave="$emit('mouseleave')"
       @click="handleClick">
    <div class="card-glow"></div>

    <!-- 星光装饰 -->
    <div class="card-stars">
      <span class="star star-1"></span>
      <span class="star star-2"></span>
      <span class="star star-3"></span>
      <span class="star star-4"></span>
    </div>

    <!-- 垂直装饰线组 -->
    <div class="card-vertical-lines">
      <span class="v-line v-line-left"></span>
      <span class="v-line v-line-right"></span>
    </div>

    <!-- 卡片角落装饰 -->
    <div class="card-corners">
      <span class="corner corner-tl"></span>
      <span class="corner corner-tr"></span>
      <span class="corner corner-bl"></span>
      <span class="corner corner-br"></span>
    </div>

    <div class="card-content">
      <div class="card-number">{{ number }}</div>
      <h2 class="card-title">{{ title }}</h2>
      <p class="card-text">{{ text }}</p>
      <div class="card-subtitle">{{ subtitle }}</div>
    </div>

    <div class="card-season-tag">{{ season }}</div>

    <!-- 溶解效果遮罩层 -->
    <canvas ref="dissolveCanvas" class="dissolve-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  number: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  season: {
    type: String,
    required: true
  },
  route: {
    type: [String, Object],
    default: null
  }
});

const emit = defineEmits(['mouseenter', 'mouseleave', 'destroyed', 'click']);

const router = useRouter();

// 处理卡片点击事件
const handleClick = () => {
  // 触发点击事件
  emit('click');
  
  // 如果有路由配置，则进行跳转
  if (props.route) {
    if (typeof props.route === 'string') {
      // 如果是字符串，作为路径跳转
      router.push(props.route);
    } else if (typeof props.route === 'object') {
      // 如果是对象，作为路由对象跳转
      router.push(props.route);
    }
  }
};

const dissolveCanvas = ref(null);
const cardElement = ref(null);
let animationFrame = null;
let dissolveProgress = 0;
let isAnimating = false;
let noiseCache = null; // 缓存噪波数据
let lastFrameTime = 0; // 用于控制帧率

// 柏林噪波实现
class PerlinNoise {
  constructor() {
    this.permutation = [];
    this.p = [];
    
    // 初始化排列表
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    
    // Fisher-Yates 洗牌算法
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }
    
    // 复制排列表以避免溢出
    for (let i = 0; i < 512; i++) {
      this.p[i] = this.permutation[i % 256];
    }
  }
  
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  lerp(t, a, b) {
    return a + t * (b - a);
  }
  
  grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const a = this.p[X] + Y;
    const aa = this.p[a];
    const ab = this.p[a + 1];
    const b = this.p[X + 1] + Y;
    const ba = this.p[b];
    const bb = this.p[b + 1];
    
    return this.lerp(v,
      this.lerp(u, this.grad(this.p[aa], x, y), this.grad(this.p[ba], x - 1, y)),
      this.lerp(u, this.grad(this.p[ab], x, y - 1), this.grad(this.p[bb], x - 1, y - 1))
    );
  }
  
  // 多层噪波（分形布朗运动）
  octaveNoise(x, y, octaves = 4, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    return total / maxValue;
  }
}

const perlinNoise = new PerlinNoise();

// 预计算噪波数据（只计算一次）
function generateNoiseCache(width, height) {
  const cache = new Float32Array(width * height);
  const scale = 0.01;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      // 使用较少的 octaves 来提升性能
      const noiseValue = perlinNoise.octaveNoise(
        x * scale,
        y * scale,
        6, // 减少到 3 层，性能提升明显
        0.5
      );
      // 归一化到 0-1 并存储
      cache[index] = (noiseValue + 1) / 2;
    }
  }
  
  return cache;
}

// 渲染溶解效果（优化版）
function renderDissolve() {
  if (!dissolveCanvas.value) return;
  
  const canvas = dissolveCanvas.value;
  const ctx = canvas.getContext('2d', { 
    alpha: true,
    desynchronized: true // 启用低延迟渲染
  });
  const width = canvas.width;
  const height = canvas.height;
  
  // 如果没有缓存，先生成
  if (!noiseCache) {
    noiseCache = generateNoiseCache(width, height);
  }
  
  // 清空画布
  ctx.clearRect(0, 0, width, height);
  
  // 创建图像数据
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  // 计算溶解阈值
  const threshold = dissolveProgress;
  
  // 多层边缘效果
  const brightEdgeWidth = 0.02;
  const burnEdgeWidth = 0.03;
  const ashEdgeWidth = 0.04;
  
  // 预计算常用值
  const totalEdgeWidth = brightEdgeWidth + burnEdgeWidth + ashEdgeWidth;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const cacheIndex = y * width + x;
      
      // 从缓存读取噪波值
      const normalizedNoise = noiseCache[cacheIndex];
      
      let alpha = 0;
      let r = 0, g = 0, b = 0;
      
      const diff = threshold - normalizedNoise;
      
      if (diff <= 0) {
        // 完全透明（已溶解的部分）
        alpha = 0;
      } else if (diff < brightEdgeWidth) {
        // 第一层：最亮的燃烧边缘（橙黄色）
        const progress = diff / brightEdgeWidth;
        const intensity = Math.pow(Math.sin(progress * Math.PI), 0.5);
        
        r = 255;
        g = 200 + (intensity * 55) | 0; // 使用位运算代替 Math.floor
        b = 100 + (intensity * 50) | 0;
        alpha = ((0.9 + intensity * 0.1) * 255) | 0;
      } else if (diff < brightEdgeWidth + burnEdgeWidth) {
        // 第二层：燃烧边缘（橙红色）
        const progress = (diff - brightEdgeWidth) / burnEdgeWidth;
        const intensity = 1 - progress;
        
        r = 255;
        g = 80 + (intensity * 120) | 0;
        b = 20 + (intensity * 80) | 0;
        alpha = ((0.7 + intensity * 0.2) * 255) | 0;
      } else if (diff < totalEdgeWidth) {
        // 第三层：灰烬边缘（深灰到黑）
        const progress = (diff - brightEdgeWidth - burnEdgeWidth) / ashEdgeWidth;
        const intensity = 1 - progress;
        
        const baseGray = (15 + progress * 45) | 0;
        r = baseGray + (intensity * 40) | 0;
        g = baseGray + (intensity * 15) | 0;
        b = baseGray;
        alpha = ((0.5 + intensity * 0.3) * 255) | 0;
      } else {
        r = 245;
        g = 243;
        b = 240;
        alpha = 255;
      }
      
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = alpha;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// 动画循环（优化版，控制帧率）
function animate(currentTime) {
  if (!isAnimating) return;
  
  // 控制帧率为 30fps（每帧约 33ms），降低计算频率
  const targetFrameTime = 1000 / 30;
  const deltaTime = currentTime - lastFrameTime;
  
  if (deltaTime < targetFrameTime) {
    animationFrame = requestAnimationFrame(animate);
    return;
  }
  
  lastFrameTime = currentTime - (deltaTime % targetFrameTime);
  
  dissolveProgress += 0.012; // 稍微加快速度以补偿帧率降低
  
  // 更新卡片边框和阴影（降低更新频率）
  if (cardElement.value && Math.floor(dissolveProgress * 50) % 2 === 0) {
    // 计算消失进度 (0 到 1)
    const fadeProgress = Math.min(dissolveProgress / 1.0, 1);
    
    // 边框透明度
    const borderOpacity = Math.max(0, (1 - fadeProgress * 2) * 0.4);
    cardElement.value.style.borderColor = `rgba(200, 190, 180, ${borderOpacity})`;
    
    // 阴影强度
    const shadowOpacity1 = Math.max(0, (1 - fadeProgress * 2) * 0.08);
    const shadowOpacity2 = Math.max(0, (1 - fadeProgress * 2) * 0.05);
    const shadowOpacity3 = Math.max(0, (1 - fadeProgress * 2) * 0.9);
    const shadowOpacity4 = Math.max(0, (1 - fadeProgress * 2) * 0.02);
    
    cardElement.value.style.boxShadow = `
      0 15px 50px rgba(0, 0, 0, ${shadowOpacity1}),
      0 5px 15px rgba(0, 0, 0, ${shadowOpacity2}),
      inset 0 1px 0 rgba(255, 255, 255, ${shadowOpacity3}),
      inset 0 -1px 0 rgba(0, 0, 0, ${shadowOpacity4})
    `;
  }
  
  if (dissolveProgress >= 1.15) {
    // 动画完成，卡片完全消失
    isAnimating = false;
    if (dissolveCanvas.value) {
      dissolveCanvas.value.style.opacity = '0';
    }
    
    // 清理缓存
    noiseCache = null;
    
    // 触发销毁事件，通知父组件移除此组件
    emit('destroyed');
    return;
  }
  
  renderDissolve();
  animationFrame = requestAnimationFrame(animate);
}

// 初始化 canvas（优化版，降低分辨率）
function initCanvas() {
  if (!dissolveCanvas.value) return;
  
  const canvas = dissolveCanvas.value;
  const parent = canvas.parentElement;
  
  // 降低 canvas 分辨率以提升性能（使用 0.5 倍分辨率）
  // 通过 CSS 缩放回原始大小，视觉效果差异不大但性能提升显著
  const scale = 1;
  canvas.width = Math.floor(parent.offsetWidth * scale);
  canvas.height = Math.floor(parent.offsetHeight * scale);
  
  // 清除旧的噪波缓存
  noiseCache = null;
  
  // 初始渲染
  renderDissolve();
}

// 开始溶解动画
function startDissolve() {
  if (isAnimating) return;
  
  if (!dissolveCanvas.value) return;
  
  // 显示 canvas
  dissolveCanvas.value.style.opacity = '1';
  
  isAnimating = true;
  dissolveProgress = 0;
  lastFrameTime = performance.now();
  animationFrame = requestAnimationFrame(animate);
}

// 停止溶解动画并重置
function stopDissolve() {
  isAnimating = false;
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  dissolveProgress = 0;
  
  // 清理缓存
  noiseCache = null;
  
  if (dissolveCanvas.value) {
    dissolveCanvas.value.style.opacity = '0';
    const ctx = dissolveCanvas.value.getContext('2d');
    ctx.clearRect(0, 0, dissolveCanvas.value.width, dissolveCanvas.value.height);
  }
  
  // 重置边框和阴影到原始样式
  if (cardElement.value) {
    cardElement.value.style.borderColor = 'rgba(200, 190, 180, 0.4)';
    cardElement.value.style.boxShadow = `
      0 15px 50px rgba(0, 0, 0, 0.08),
      0 5px 15px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      inset 0 -1px 0 rgba(0, 0, 0, 0.02)
    `;
  }
}

// 重置卡片（恢复初始状态）
function resetCard() {
  stopDissolve();
}

onMounted(() => {
  initCanvas();
  
  // 响应窗口大小变化
  window.addEventListener('resize', initCanvas);
});

onBeforeUnmount(() => {
  stopDissolve();
  window.removeEventListener('resize', initCanvas);
});

// 暴露方法供外部调用
defineExpose({
  startDissolve,
  stopDissolve,
  resetCard
});
</script>

<style scoped>
/* 卡片样式 */
.minimal-card {
  width: 260px;
  height: 400px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f6f2 50%, #f0ebe5 100%);
  border: 1px solid rgba(200, 190, 180, 0.4);
  box-shadow:
    0 15px 50px rgba(0, 0, 0, 0.08),
    0 5px 15px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(0, 0, 0, 0.02);
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(30px) perspective(1000px) rotateX(0deg);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  transform-style: preserve-3d;
}

/* 溶解效果 Canvas */
.dissolve-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* 卡片表面光泽 */
.minimal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.02) 100%
  );
  pointer-events: none;
  z-index: 1;
}

.minimal-card:hover {
  transform: translateY(-20px) perspective(1000px) rotateX(2deg) scale(1.03);
  box-shadow: 
    0 35px 80px rgba(0, 0, 0, 0.15),
    0 15px 35px rgba(0, 0, 0, 0.1),
    0 5px 15px rgba(0, 0, 0, 0.08),
    inset 0 2px 0 rgba(255, 255, 255, 1),
    inset 0 -2px 0 rgba(0, 0, 0, 0.03);
  border-color: rgba(200, 190, 180, 0.6);
}

.minimal-card:active {
  transform: translateY(-15px) perspective(1000px) rotateX(1deg) scale(0.99);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.12),
    0 8px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(0, 0, 0, 0.02);
}

/* 卡片光晕效果 */
.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(
    circle at center,
    rgba(139, 125, 107, 0.15) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.minimal-card:hover .card-glow {
  opacity: 1;
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* 星光装饰 */
.card-stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.minimal-card:hover .card-stars {
  opacity: 1;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(139, 125, 107, 0.6);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(139, 125, 107, 0.8);
  animation: starTwinkle 3s ease-in-out infinite;
}

.star::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(139, 125, 107, 0.4),
    transparent
  );
}

.star::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1px;
  height: 8px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(139, 125, 107, 0.4),
    transparent
  );
}

.star-1 {
  top: 20%;
  left: 25%;
  animation-delay: 0s;
}

.star-2 {
  top: 35%;
  right: 20%;
  animation-delay: 1s;
}

.star-3 {
  bottom: 30%;
  left: 30%;
  animation-delay: 2s;
}

.star-4 {
  bottom: 20%;
  right: 25%;
  animation-delay: 1.5s;
}

@keyframes starTwinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

/* 垂直装饰线组 */
.card-vertical-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.v-line {
  position: absolute;
  width: 1px;
  top: 15%;
  bottom: 15%;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(139, 125, 107, 0.2) 20%,
    rgba(139, 125, 107, 0.2) 80%,
    transparent
  );
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-line-left {
  left: 30px;
}

.v-line-right {
  right: 30px;
}

.minimal-card:hover .v-line {
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(139, 125, 107, 0.4) 20%,
    rgba(139, 125, 107, 0.4) 80%,
    transparent
  );
}

.minimal-card:hover .v-line-left {
  left: 25px;
}

.minimal-card:hover .v-line-right {
  right: 25px;
}

/* 卡片内容 */
.card-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 30px;
  transform: translateZ(10px);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.minimal-card:hover .card-content {
  transform: translateZ(20px);
}

.card-title {
  font-size: 18px;
  letter-spacing: 12px;
  color: #8b7d6b;
  margin: 0 0 40px 0;
  font-family: 'Cinzel', serif;
  font-weight: 400;
  text-align: center;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.minimal-card:hover .card-title {
  letter-spacing: 16px;
  color: #6b5d4b;
  transform: translateY(-5px) translateZ(5px);
  text-shadow: 
    0 2px 4px rgba(255, 255, 255, 0.9),
    0 1px 8px rgba(139, 125, 107, 0.1);
}

.card-text {
  font-size: 20px;
  letter-spacing: 18px;
  color: #5a5047;
  margin: 0;
  writing-mode: horizontal-tb;
  font-family: 'Noto Serif JP', serif;
  font-weight: 300;
  text-align: center;
  line-height: 2;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.minimal-card:hover .card-text {
  letter-spacing: 22px;
  color: #3a3037;
  transform: translateY(5px) translateZ(5px);
  text-shadow: 
    0 2px 3px rgba(255, 255, 255, 0.8),
    0 1px 6px rgba(90, 80, 71, 0.1);
}

/* 卡片编号 */
.card-number {
  position: absolute;
  top: 25px;
  left: 50%;
  transform: translateX(-50%) translateZ(15px);
  font-size: 12px;
  font-family: 'Cinzel', serif;
  color: rgba(139, 125, 107, 0.3);
  letter-spacing: 3px;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
}

.minimal-card:hover .card-number {
  color: rgba(139, 125, 107, 0.6);
  letter-spacing: 5px;
  transform: translateX(-50%) translateZ(25px);
  text-shadow: 
    0 2px 2px rgba(255, 255, 255, 0.9),
    0 1px 4px rgba(139, 125, 107, 0.2);
}

/* 卡片副标题 */
.card-subtitle {
  margin-top: 30px;
  font-size: 11px;
  font-family: 'Cinzel', serif;
  color: rgba(139, 125, 107, 0.4);
  letter-spacing: 2px;
  text-align: center;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(8px);
}

.minimal-card:hover .card-subtitle {
  color: rgba(139, 125, 107, 0.6);
  letter-spacing: 3px;
  transform: translateZ(15px);
  text-shadow: 
    0 2px 2px rgba(255, 255, 255, 0.8),
    0 1px 4px rgba(139, 125, 107, 0.1);
}

/* 卡片角落装饰 */
.card-corners {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 3;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.corner::before,
.corner::after {
  content: '';
  position: absolute;
  background: rgba(139, 125, 107, 0.25);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.corner-tl {
  top: 15px;
  left: 15px;
}

.corner-tl::before {
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
}

.corner-tl::after {
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
}

.corner-tr {
  top: 15px;
  right: 15px;
}

.corner-tr::before {
  top: 0;
  right: 0;
  width: 100%;
  height: 1px;
}

.corner-tr::after {
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
}

.corner-bl {
  bottom: 15px;
  left: 15px;
}

.corner-bl::before {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
}

.corner-bl::after {
  bottom: 0;
  left: 0;
  width: 1px;
  height: 100%;
}

.corner-br {
  bottom: 15px;
  right: 15px;
}

.corner-br::before {
  bottom: 0;
  right: 0;
  width: 100%;
  height: 1px;
}

.corner-br::after {
  bottom: 0;
  right: 0;
  width: 1px;
  height: 100%;
}

.minimal-card:hover .corner {
  width: 25px;
  height: 25px;
}

.minimal-card:hover .corner::before,
.minimal-card:hover .corner::after {
  background: rgba(139, 125, 107, 0.5);
}

/* 卡片季节标签 */
.card-season-tag {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 16px;
  font-family: 'Noto Serif JP', serif;
  color: rgba(139, 125, 107, 0.4);
  font-weight: 300;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 4;
  transform: translateZ(12px);
}

.minimal-card:hover .card-season-tag {
  color: rgba(139, 125, 107, 0.7);
  transform: scale(1.1) translateZ(20px);
  text-shadow: 
    0 2px 3px rgba(255, 255, 255, 0.9),
    0 1px 5px rgba(139, 125, 107, 0.15);
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .minimal-card {
    width: 240px;
    height: 380px;
  }
}

@media (max-width: 1200px) {
  .minimal-card {
    width: 220px;
    height: 340px;
  }
}

@media (max-width: 768px) {
  .minimal-card {
    width: 180px;
    height: 300px;
  }

  .card-title {
    font-size: 14px;
    letter-spacing: 8px;
  }

  .card-text {
    font-size: 16px;
    letter-spacing: 12px;
  }
}
</style>




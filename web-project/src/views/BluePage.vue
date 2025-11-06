<template>
  <div class="blue-page">
    <!-- 热浪扭曲特效Canvas - 位于左侧 -->
    <canvas ref="heatWaveCanvas" id="heatWaveCanvas" :class="{ 'effect-loaded': heatWaveLoaded }"></canvas>

    <!-- 太阳光晕Canvas - 位于左侧 -->
    <canvas ref="lensFlareCanvas" id="lensFlareCanvas" :class="{ 'effect-loaded': lensFlareLoaded }"></canvas>

    <!-- 左侧模糊背景层 -->
    <div class="left-blur-bg" :class="{ 'bg-loaded': bgLeftLoaded }"></div>

    <!-- 渐变遮罩层 -->
    <div class="gradient-overlay"></div>

    <!-- 第二个背景图片（左侧） -->
    <div id="background2" :class="{ 'foreground-loaded': foreground2Loaded }">
      <img src="/backgroundRight4.png" alt="Background 2">
    </div>

    <!-- 右侧媒体区域组件 -->
    <RightMediaSection 
      :mouseX="mouseX" 
      :mouseY="mouseY" 
      :scrollY="scrollY" 
      @rightAreaClick="handleNavigateToSowaka" 
    />

    <!-- 主容器 -->
    <div class="container" :class="{ 'content-loaded': contentLoaded }">
      <div class="text-canvas-container">
        <canvas ref="textCanvas" id="textCanvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { PerlinNoise } from '../utils/perlinNoise'
import { useLensFlare } from '../composables/useLensFlare'
import { useHeatWave } from '../composables/useHeatWave'
import RightMediaSection from '../components/RightMediaSection.vue'

// 路由实例
const router = useRouter()

// Canvas引用
const textCanvas = ref(null)
const lensFlareCanvas = ref(null)
const heatWaveCanvas = ref(null)

// 加载状态
const bgLeftLoaded = ref(false)
const foreground2Loaded = ref(false)
const contentLoaded = ref(false)
const heatWaveLoaded = ref(false)
const lensFlareLoaded = ref(false)

// 文字内容和样式配置
const texts = [
  {
    text: 'SILENT HAZE',
    x: 0,
    y: 50,
    size: 16,
    weight: '300',
    spacing: 5,
    noiseScale: 0.05
  },
  {
    text: 'SUMMER',
    x: -10,
    y: 120,
    size: 96,
    weight: '700',
    spacing: 0,
    noiseScale: 0.02
  },
  {
    text: 'BREEZE',
    x: 0,
    y: 240,
    size: 96,
    weight: '700',
    spacing: 0,
    noiseScale: 0.02
  },
  {
    text: '海辺の思い出',
    x: 0,
    y: 360,
    size: 15,
    weight: '300',
    spacing: 2,
    noiseScale: 0.08
  }
]

let perlin = null
let time = 0
let animationId = null

// 视差相关变量
const mouseX = ref(window.innerWidth / 2)
const mouseY = ref(window.innerHeight / 2)
const scrollY = ref(0)
let targetX2 = 0
let targetY2 = 0
let isHoveringImg2 = false
let ticking = false

// Cleanup函数
let cleanupLensFlare = null
let cleanupHeatWave = null

// 处理导航到Sowaka页面
function handleNavigateToSowaka() {
  console.log('开始跳转到Sowaka页面')
  router.push('/sowaka')
}

// 绘制带噪声效果的文字
function drawTextWithNoise() {
  const canvas = textCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  texts.forEach((textObj, index) => {
    ctx.font = `${textObj.weight} ${textObj.size}px Arial`
    ctx.textBaseline = 'top'

    const metrics = ctx.measureText(textObj.text)
    const textWidth = metrics.width
    const textHeight = textObj.size

    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    tempCanvas.width = textWidth + 20
    tempCanvas.height = textHeight + 20

    tempCtx.font = ctx.font
    tempCtx.fillStyle = 'white'
    tempCtx.textBaseline = 'top'
    tempCtx.fillText(textObj.text, 10, 10)

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
    const data = imageData.data

    for (let y = 0; y < tempCanvas.height; y++) {
      for (let x = 0; x < tempCanvas.width; x++) {
        const index = (y * tempCanvas.width + x) * 4
        const alpha = data[index + 3]

        if (alpha > 0) {
          const noiseX = x * textObj.noiseScale
          const noiseY = y * textObj.noiseScale
          const noise = perlin.noise(noiseX + time, noiseY + time * 0.5)
          const normalizedNoise = (noise + 1) / 2

          data[index] = 255
          data[index + 1] = 255
          data[index + 2] = 255
          data[index + 3] = Math.pow((1 - normalizedNoise * 0.4), 2) * alpha
        }
      }
    }

    tempCtx.putImageData(imageData, 0, 0)
    ctx.drawImage(tempCanvas, textObj.x, textObj.y)

    if (index === 0 || index === 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fillRect(textObj.x, textObj.y + textObj.size + 20, 120, 1)
    }
  })

  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 4
}

// 检测鼠标是否在图片区域
function isMouseOverImage(mx, my, container, img) {
  if (!container || !img) return false

  const containerRect = container.getBoundingClientRect()
  const imgRect = img.getBoundingClientRect()

  return mx >= imgRect.left &&
    mx <= imgRect.right &&
    my >= imgRect.top &&
    my <= imgRect.bottom
}

// 更新视差效果
function updateParallax() {
  const parallaxStrength2 = 30
  const tiltStrength = 4
  const scaleBase = 1.02

  const moveX2 = -targetX2 * parallaxStrength2
  const moveY2 = targetY2 * parallaxStrength2 * 0.8
  const tiltX2 = -targetY2 * tiltStrength
  const tiltY2 = targetX2 * tiltStrength
  const scale2 = scaleBase + Math.abs(targetX2 * 0.025) + Math.abs(targetY2 * 0.025)

  const backgroundImg2 = document.querySelector('#background2 img')
  const backgroundContainer2 = document.querySelector('#background2')

  if (backgroundImg2) {
    backgroundImg2.style.transform =
      `perspective(1200px) ` +
      `translateX(${moveX2}px) translateY(${moveY2}px) ` +
      `rotateX(${tiltX2}deg) rotateY(${tiltY2}deg) ` +
      `scale(${scale2}) ` +
      `translateZ(15px)`

    const filterBrightness = 1.03 + Math.abs(targetY2 * 0.06)
    const filterContrast = 1.02 + Math.abs(targetX2 * 0.07)
    const filterSaturate = 1 + Math.abs(targetY2 * 0.08)
    backgroundImg2.style.filter =
      `contrast(${filterContrast}) brightness(${filterBrightness}) saturate(${filterSaturate})`
  }

  if (backgroundContainer2) {
    const shadowIntensity2 = 0.7 + Math.abs(targetX2 * 0.25) + Math.abs(targetY2 * 0.2)
    backgroundContainer2.style.setProperty('--shadow-opacity', shadowIntensity2)
  }
}

// 更新滚动视差
function updateScrollParallax() {
  const scrollFactor2 = scrollY.value * 0.4

  const backgroundContainer2 = document.querySelector('#background2')

  if (backgroundContainer2) {
    backgroundContainer2.style.transform = `translateY(${-scrollFactor2}px)`
  }
}

// 主动画循环
function animate() {
  time += 0.005
  drawTextWithNoise()
  updateParallax()
  
  animationId = requestAnimationFrame(animate)
}

// 鼠标移动事件处理
function handleMouseMove(e) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY

  const backgroundContainer2 = document.querySelector('#background2')
  const backgroundImg2 = document.querySelector('#background2 img')

  isHoveringImg2 = isMouseOverImage(mouseX.value, mouseY.value, backgroundContainer2, backgroundImg2)

  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  const offsetX = (mouseX.value - centerX) / centerX
  const offsetY = (mouseY.value - centerY) / centerY

  if (isHoveringImg2) {
    targetX2 = offsetX
    targetY2 = offsetY
  } else {
    targetX2 *= 0.95
    targetY2 *= 0.95
  }
}

// 滚动事件处理
function handleScroll() {
  scrollY.value = window.pageYOffset

  if (!ticking) {
    requestAnimationFrame(() => {
      updateScrollParallax()
      ticking = false
    })
    ticking = true
  }
}

// 窗口大小调整处理
function handleResize() {
  const canvas = textCanvas.value
  if (canvas) {
    canvas.width = 800
    canvas.height = 600
  }

  mouseX.value = window.innerWidth / 2
  mouseY.value = window.innerHeight / 2
  targetX2 = 0
  targetY2 = 0
  isHoveringImg2 = false
}

// 页面可见性变化处理
function handleVisibilityChange() {
  if (document.hidden) {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  } else {
    if (!animationId) {
      animate()
    }
  }
}

onMounted(() => {
  // 初始化Canvas
  const canvas = textCanvas.value
  if (canvas) {
    canvas.width = 800
    canvas.height = 600
  }

  // 初始化Perlin噪声
  perlin = new PerlinNoise()

  // 初始化各种效果
  const lensFlareEffect = useLensFlare(lensFlareCanvas)
  const heatWaveEffect = useHeatWave(heatWaveCanvas)
  
  const { drawLensFlare } = lensFlareEffect
  const { drawHeatWave } = heatWaveEffect
  
  // 保存cleanup函数供onUnmounted使用
  cleanupLensFlare = lensFlareEffect.cleanup
  cleanupHeatWave = heatWaveEffect.cleanup

  // 修改主动画循环以包含所有效果
  const originalAnimate = animate
  animate = function() {
    time += 0.005
    drawTextWithNoise()
    updateParallax()
    drawLensFlare()
    drawHeatWave()
    
    animationId = requestAnimationFrame(animate)
  }

  // 启动动画循环
  animate()

  // 添加事件监听器
  document.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleResize)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Canvas悬停效果
  if (canvas) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const isHovering = (y > 180 && y < 300 && x < 600)
      canvas.style.cursor = isHovering ? 'pointer' : 'default'
    })
  }

  // 分阶段加载动画
  setTimeout(() => { bgLeftLoaded.value = true }, 75)
  setTimeout(() => { foreground2Loaded.value = true }, 900)
  setTimeout(() => { contentLoaded.value = true }, 1500)
  setTimeout(() => { heatWaveLoaded.value = true }, 1800)
  setTimeout(() => { lensFlareLoaded.value = true }, 2100)

  // 初始化视差效果
  updateParallax()
})

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  // 取消动画
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  
  // 清理特效
  if (cleanupLensFlare) {
    cleanupLensFlare()
  }
  if (cleanupHeatWave) {
    cleanupHeatWave()
  }
})
</script>

<style scoped>
/* 全局重置样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}



/* 左侧模糊背景层 */
.left-blur-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  z-index: -3;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.9s ease-out 0.075s, transform 0.9s ease-out 0.075s;
}

.left-blur-bg.bg-loaded {
  opacity: 1;
  transform: scale(1);
}

.left-blur-bg::before {
  content: '';
  position: absolute;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  background-image: url('/backgroundLeft.jpg');
  background-size: cover;
  background-position: center;
  filter: blur(30px) brightness(1.1) saturate(0.8);
  transform: scale(1.2);
  animation: leftBgFloat 20s ease-in-out infinite;
  will-change: transform, filter, background-position;
  transition: animation-duration 0.3s ease-in-out;
}

@keyframes leftBgFloat {
  0% {
    transform: scale(1.2) rotate(0deg);
    filter: blur(25px) brightness(0.8) saturate(0.8);
  }
  25% {
    transform: scale(1.25) rotate(1deg);
    filter: blur(27px) brightness(0.85) saturate(0.85);
  }
  50% {
    transform: scale(1.3) rotate(0deg);
    filter: blur(30px) brightness(0.9) saturate(0.9);
  }
  75% {
    transform: scale(1.25) rotate(-1deg);
    filter: blur(27px) brightness(0.85) saturate(0.85);
  }
  100% {
    transform: scale(1.2) rotate(0deg);
    filter: blur(25px) brightness(0.8) saturate(0.8);
  }
}

.left-blur-bg:hover::before {
  animation: leftBgFloatIntense 8s ease-in-out infinite;
}

@keyframes leftBgFloatIntense {
  0% {
    transform: scale(1.3) rotate(0deg);
    filter: blur(25px) brightness(1.3) saturate(1.1);
  }
  33% {
    transform: scale(1.4) rotate(2deg);
    filter: blur(28px) brightness(1.4) saturate(1.2);
  }
  66% {
    transform: scale(1.35) rotate(-2deg);
    filter: blur(27px) brightness(1.35) saturate(1.15);
  }
  100% {
    transform: scale(1.3) rotate(0deg);
    filter: blur(25px) brightness(1.3) saturate(1.1);
  }
}

.left-blur-bg::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 30%;
  height: 100%;
  background: linear-gradient(to right,
    transparent 0%,
    rgba(225, 245, 254, 0.3) 40%,
    rgba(225, 245, 254, 0.7) 70%,
    rgba(225, 245, 254, 1) 100%);
  pointer-events: none;
}

/* 热浪扭曲特效Canvas */
#heatWaveCanvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  z-index: -2;
  pointer-events: none;
  opacity: 0;
  mix-blend-mode: overlay;
  transition: opacity 0.45s ease-out 1.8s;
}

#heatWaveCanvas.effect-loaded {
  opacity: 0.4;
}

/* 太阳光晕Canvas */
#lensFlareCanvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  z-index: 99;
  pointer-events: none;
  opacity: 0;
  mix-blend-mode: screen;
  transition: opacity 0.45s ease-out 2.1s;
}

#lensFlareCanvas.effect-loaded {
  opacity: 0.7;
}

/* 渐变遮罩层 */
.gradient-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  background: radial-gradient(ellipse 60% 100% at center,
    rgba(225, 245, 254, 0.6) 0%,
    rgba(225, 245, 254, 0.4) 40%,
    rgba(225, 245, 254, 0.2) 70%,
    transparent 100%);
  pointer-events: none;
}

/* 左侧前景图片容器 */
#background2 {
  position: fixed;
  top: 0;
  left: -400px;
  width: 100%;
  height: 100%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: visible;
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
  transition: opacity 0.9s ease-out 0.9s, transform 0.9s ease-out 0.9s;
  --shadow-opacity: 0.7;
  perspective: 1500px;
  perspective-origin: center center;
  transform-style: preserve-3d;
}

#background2.foreground-loaded {
  opacity: 1;
  transform: translateX(0) scale(1);
}

#background2 img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  filter: contrast(1.02) brightness(1.03);
  transform-style: preserve-3d;
  transition: transform 0.2s ease-out, filter 0.3s ease-out, box-shadow 0.3s ease-out;
  will-change: transform, filter;
  position: relative;
}

#background2::before {
  content: '';
  position: absolute;
  top: -25px;
  left: -25px;
  right: -25px;
  bottom: -25px;
  background: linear-gradient(225deg,
    rgba(0, 0, 0, 0.02) 0%,
    transparent 25%,
    transparent 75%,
    rgba(0, 0, 0, 0.09) 100%);
  border-radius: 25px;
  filter: blur(18px);
  z-index: -1;
  transition: all 0.3s ease-out;
  opacity: var(--shadow-opacity, 0.7);
  transform: translateZ(-15px);
}

#background2:hover::before {
  transform: translateZ(-8px) scale(1.08);
  opacity: calc(var(--shadow-opacity) * 1.4);
  filter: blur(22px);
}

/* 主容器 */
.container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  padding-left: 80px;
  z-index: 10;
  opacity: 0;
  transform: translateY(30px) scale(0.98);
  transition: opacity 0.9s ease-out 1.5s, transform 0.9s ease-out 1.5s;
}

.container.content-loaded {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.text-canvas-container {
  position: relative;
}

canvas {
  display: block;
}

/* 动画性能优化 */
.left-blur-bg, .right-blur-bg {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding-left: 40px;
  }

  .left-blur-bg::before {
    animation-duration: 30s;
  }

  #background2 {
    perspective: 800px;
  }

  #background2::before {
    filter: blur(10px);
  }
}

@media (max-width: 480px) {
  #background2::before {
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    filter: blur(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .left-blur-bg::before,
  .left-blur-bg:hover::before {
    animation: none;
  }

  #background2 img {
    transform: none !important;
    transition: none !important;
  }

  #background2::before {
    transform: none !important;
  }
}
</style>

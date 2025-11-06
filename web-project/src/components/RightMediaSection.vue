<template>
  <div class="right-media-section">
    <!-- 雨滴粒子Canvas - 位于右侧 -->
    <canvas ref="rainCanvas" id="rainCanvas" :class="{ 'effect-loaded': rainLoaded }"></canvas>

    <!-- 右侧模糊背景层 -->
    <div class="right-blur-bg" :class="{ 'bg-loaded': bgRightLoaded }"></div>

    <!-- 背景图片（右侧） -->
    <div id="background" :class="{ 'foreground-loaded': foreground1Loaded }">
      <img src="/backgroundLeft.jpg" alt="Background">
    </div>

    <!-- 视频容器 -->
    <div id="videoContainer" :class="{ 'video-loaded': videoLoaded }">
      <video ref="videoElement" id="mainVideo" muted loop preload="metadata">
        <source src="/videoLeft-vmake_AE.mp4" type="video/mp4">
        您的浏览器不支持视频播放。
      </video>
    </div>

    <!-- 右侧媒体区域包装容器 - 独立层级以确保可点击 -->
    <div class="right-media-area" @click="handleRightAreaClick"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRainEffect } from '../composables/useRainEffect'

// Props定义
const props = defineProps({
  mouseX: {
    type: Number,
    default: 0
  },
  mouseY: {
    type: Number,
    default: 0
  },
  scrollY: {
    type: Number,
    default: 0
  }
})

// Emit定义
const emit = defineEmits(['rightAreaClick'])

// Canvas和视频引用
const rainCanvas = ref(null)
const videoElement = ref(null)

// 加载状态
const bgRightLoaded = ref(false)
const foreground1Loaded = ref(false)
const videoLoaded = ref(false)
const rainLoaded = ref(false)

// 视差相关变量
let targetX1 = 0
let targetY1 = 0
let isHoveringImg1 = false
let isHoveringVideo = false
let targetXVideo = 0
let targetYVideo = 0
let isHoveringRightArea = false
let imageOpacity = 1
let videoOpacity = 0
let animationId = null

// Cleanup函数
let cleanupRain = null

// 处理右侧区域点击
function handleRightAreaClick() {
  console.log('右侧区域被点击，准备跳转到Sowaka页面')
  emit('rightAreaClick')
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
  const parallaxStrength1 = 25
  const tiltStrength = 4
  const scaleBase = 1.02

  const moveX1 = targetX1 * parallaxStrength1
  const moveY1 = targetY1 * parallaxStrength1 * 0.7
  const tiltX1 = targetY1 * tiltStrength
  const tiltY1 = -targetX1 * tiltStrength
  const scale1 = scaleBase + Math.abs(targetX1 * 0.03) + Math.abs(targetY1 * 0.02)

  const backgroundImg1 = document.querySelector('#background img')
  const video = videoElement.value
  const backgroundContainer1 = document.querySelector('#background')
  const videoContainer = document.querySelector('#videoContainer')

  if (backgroundImg1) {
    backgroundImg1.style.transform =
      `perspective(1200px) ` +
      `translateX(${moveX1}px) translateY(${moveY1}px) ` +
      `rotateX(${tiltX1}deg) rotateY(${tiltY1}deg) ` +
      `scale(${scale1}) ` +
      `translateZ(20px)`

    const filterBrightness = 1.03 + Math.abs(targetX1 * 0.05)
    const filterContrast = 1.02 + Math.abs(targetY1 * 0.08)
    const filterSaturate = 1 + Math.abs(targetX1 * 0.1)
    const glowIntensity = 0.6 + Math.abs(targetX1 * 0.2) + Math.abs(targetY1 * 0.2)
    const glowBlue = 0.4 + Math.abs(targetX1 * 0.15)
    backgroundImg1.style.filter =
      `contrast(${filterContrast}) brightness(${filterBrightness}) saturate(${filterSaturate}) drop-shadow(0 0 20px rgba(255, 255, 255, ${glowIntensity})) drop-shadow(0 0 70px rgba(102, 242, 255, ${glowBlue}))`

    backgroundImg1.style.opacity = imageOpacity
  }

  const moveXVideo = targetXVideo * parallaxStrength1
  const moveYVideo = targetYVideo * parallaxStrength1 * 0.7
  const tiltXVideo = targetYVideo * tiltStrength
  const tiltYVideo = -targetXVideo * tiltStrength
  const scaleVideo = scaleBase + Math.abs(targetXVideo * 0.03) + Math.abs(targetYVideo * 0.02)

  if (video) {
    video.style.transform =
      `perspective(1200px) ` +
      `translateX(${moveXVideo}px) translateY(${moveYVideo}px) ` +
      `rotateX(${tiltXVideo}deg) rotateY(${tiltYVideo}deg) ` +
      `scale(${scaleVideo}) ` +
      `translateZ(25px)`

    const filterBrightness = 1.03 + Math.abs(targetXVideo * 0.05)
    const filterContrast = 1.02 + Math.abs(targetYVideo * 0.08)
    const filterSaturate = 1 + Math.abs(targetXVideo * 0.1)
    const glowIntensity = 0.6 + Math.abs(targetXVideo * 0.2) + Math.abs(targetYVideo * 0.2)
    const glowBlue = 0.4 + Math.abs(targetXVideo * 0.15)
    video.style.filter =
      `contrast(${filterContrast}) brightness(${filterBrightness}) saturate(${filterSaturate}) drop-shadow(0 0 20px rgba(255, 255, 255, ${glowIntensity})) drop-shadow(0 0 70px rgba(102, 242, 255, ${glowBlue}))`

    video.style.opacity = videoOpacity

    if (videoContainer) {
      if (videoOpacity > 0.1) {
        videoContainer.style.pointerEvents = 'auto'
      } else {
        videoContainer.style.pointerEvents = 'none'
      }
    }
  }

  if (backgroundContainer1) {
    const shadowIntensity1 = 0.6 + Math.abs(targetX1 * 0.2) + Math.abs(targetY1 * 0.15)
    backgroundContainer1.style.setProperty('--shadow-opacity', shadowIntensity1)
  }

  if (videoContainer) {
    const shadowIntensityVideo = 0.6 + Math.abs(targetXVideo * 0.2) + Math.abs(targetYVideo * 0.15)
    videoContainer.style.setProperty('--shadow-opacity', shadowIntensityVideo)
  }
}

// 更新滚动视差
function updateScrollParallax() {
  const scrollFactor1 = props.scrollY * 0.3

  const backgroundContainer1 = document.querySelector('#background')
  const videoContainer = document.querySelector('#videoContainer')

  if (backgroundContainer1) {
    backgroundContainer1.style.transform = `translateY(${scrollFactor1}px)`
  }

  if (videoContainer) {
    videoContainer.style.transform = `translateY(${scrollFactor1}px)`
  }
}

// 处理鼠标移动
function handleMouseMove() {
  const mouseX = props.mouseX
  const mouseY = props.mouseY

  const backgroundContainer1 = document.querySelector('#background')
  const backgroundImg1 = document.querySelector('#background img')
  const video = videoElement.value
  const videoContainer = document.querySelector('#videoContainer')

  isHoveringImg1 = isMouseOverImage(mouseX, mouseY, backgroundContainer1, backgroundImg1)
  isHoveringVideo = isMouseOverImage(mouseX, mouseY, videoContainer, video)
  isHoveringRightArea = isMouseOverImage(mouseX, mouseY, backgroundContainer1, backgroundImg1)

  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  const offsetX = (mouseX - centerX) / centerX
  const offsetY = (mouseY - centerY) / centerY

  if (isHoveringImg1) {
    targetX1 = offsetX
    targetY1 = offsetY
  } else {
    targetX1 *= 0.95
    targetY1 *= 0.95
  }

  if (isHoveringVideo) {
    targetXVideo = offsetX
    targetYVideo = offsetY
  } else {
    targetXVideo *= 0.95
    targetYVideo *= 0.95
  }

  if (isHoveringRightArea) {
    imageOpacity = Math.max(0, imageOpacity - 0.05)
    videoOpacity = Math.min(1, videoOpacity + 0.05)
  } else {
    imageOpacity = Math.min(1, imageOpacity + 0.05)
    videoOpacity = Math.max(0, videoOpacity - 0.05)
  }
}

// 动画循环
let drawRainFunc = null
function animate() {
  updateParallax()
  if (drawRainFunc) {
    drawRainFunc()
  }
  
  animationId = requestAnimationFrame(animate)
}

// 监听props变化
watch([() => props.mouseX, () => props.mouseY], () => {
  handleMouseMove()
})

watch(() => props.scrollY, () => {
  updateScrollParallax()
})

onMounted(() => {
  // 初始化雨滴特效
  const rainEffect = useRainEffect(rainCanvas)
  const { drawRain } = rainEffect
  drawRainFunc = drawRain
  cleanupRain = rainEffect.cleanup

  // 启动动画循环
  animate()

  // 视频初始化
  const video = videoElement.value
  if (video) {
    video.load()

    video.addEventListener('click', () => {
      if (video.paused) {
        video.play().catch(e => console.log('视频播放失败:', e))
      } else {
        video.pause()
      }
    })

    video.addEventListener('canplay', () => {
      setTimeout(() => {
        video.play().catch(e => {
          console.log('自动播放失败:', e)
          video.muted = true
          video.play().catch(e2 => console.log('静音播放也失败:', e2))
        })
      }, 1000)
    })

    video.addEventListener('loadeddata', () => {
      console.log('视频数据加载完成')
    })

    video.addEventListener('error', (e) => {
      console.error('视频加载错误:', e)
    })
  }

  // 分阶段加载动画
  setTimeout(() => { bgRightLoaded.value = true }, 225)
  setTimeout(() => { foreground1Loaded.value = true }, 600)
  setTimeout(() => { videoLoaded.value = true }, 1200)
  setTimeout(() => { rainLoaded.value = true }, 1950)

  // 初始化视差效果
  updateParallax()
})

onUnmounted(() => {
  // 取消动画
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  
  // 清理特效
  if (cleanupRain) {
    cleanupRain()
  }
})
</script>

<style scoped>
.right-media-section {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 雨滴粒子Canvas */
#rainCanvas {
  position: fixed;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.45s ease-out 1.95s;
}

#rainCanvas.effect-loaded {
  opacity: 0.8;
}

/* 右侧模糊背景层 */
.right-blur-bg {
  position: fixed;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  z-index: -3;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.9s ease-out 0.225s, transform 0.9s ease-out 0.225s;
}

.right-blur-bg.bg-loaded {
  opacity: 1;
  transform: scale(1);
}

.right-blur-bg::before {
  content: '';
  position: absolute;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  background-image: url('/backgroundRight4.png');
  background-size: cover;
  background-position: center;
  filter: blur(30px) brightness(0.6) saturate(0.8);
  transform: scale(1.2);
  animation: rightBgDrift 25s ease-in-out infinite;
  will-change: transform, filter, background-position;
  transition: animation-duration 0.3s ease-in-out;
}

@keyframes rightBgDrift {
  0% {
    transform: scale(1.2) translateX(0px) translateY(0px);
    filter: blur(30px) brightness(0.6) saturate(0.8);
    background-position: center;
  }
  20% {
    transform: scale(1.15) translateX(-15px) translateY(10px);
    filter: blur(28px) brightness(0.65) saturate(0.9);
    background-position: 45% 45%;
  }
  40% {
    transform: scale(1.25) translateX(10px) translateY(-8px);
    filter: blur(35px) brightness(0.7) saturate(1.0);
    background-position: 55% 40%;
  }
  60% {
    transform: scale(1.18) translateX(-8px) translateY(15px);
    filter: blur(33px) brightness(0.55) saturate(0.85);
    background-position: 40% 60%;
  }
  80% {
    transform: scale(1.22) translateX(12px) translateY(-5px);
    filter: blur(31px) brightness(0.68) saturate(0.95);
    background-position: 60% 35%;
  }
  100% {
    transform: scale(1.2) translateX(0px) translateY(0px);
    filter: blur(30px) brightness(0.6) saturate(0.8);
    background-position: center;
  }
}

.right-blur-bg:hover::before {
  animation: rightBgDriftIntense 10s ease-in-out infinite;
}

@keyframes rightBgDriftIntense {
  0% {
    transform: scale(1.3) translateX(0px) translateY(0px);
    filter: blur(20px) brightness(0.8) saturate(1.2);
    background-position: center;
  }
  25% {
    transform: scale(1.25) translateX(-25px) translateY(20px);
    filter: blur(18px) brightness(0.85) saturate(1.3);
    background-position: 35% 35%;
  }
  50% {
    transform: scale(1.35) translateX(20px) translateY(-15px);
    filter: blur(25px) brightness(0.9) saturate(1.4);
    background-position: 65% 30%;
  }
  75% {
    transform: scale(1.28) translateX(-18px) translateY(25px);
    filter: blur(22px) brightness(0.75) saturate(1.25);
    background-position: 30% 70%;
  }
  100% {
    transform: scale(1.3) translateX(0px) translateY(0px);
    filter: blur(20px) brightness(0.8) saturate(1.2);
    background-position: center;
  }
}

.right-blur-bg::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 30%;
  height: 100%;
  background: linear-gradient(to left,
    transparent 0%,
    rgba(225, 245, 254, 0.3) 40%,
    rgba(225, 245, 254, 0.7) 70%,
    rgba(225, 245, 254, 1) 100%);
  pointer-events: none;
}

/* 右侧前景图片容器 */
#background {
  position: fixed;
  top: 0;
  left: 400px;
  width: 100%;
  height: 100%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: visible;
  opacity: 0;
  transform: translateX(30px) scale(0.95);
  transition: opacity 0.9s ease-out 0.6s, transform 0.9s ease-out 0.6s;
  --shadow-opacity: 0.6;
  perspective: 1500px;
  perspective-origin: center center;
  transform-style: preserve-3d;
}

#background.foreground-loaded {
  opacity: 1;
  transform: translateX(0) scale(1);
}

#background img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  filter: contrast(1.02) brightness(1.03) drop-shadow(0 0 20px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 40px rgba(135, 206, 250, 0.4));
  transform-style: preserve-3d;
  transition: transform 0.2s ease-out, filter 0.3s ease-out, box-shadow 0.3s ease-out, opacity 0.6s ease-in-out;
  will-change: transform, filter, opacity;
  position: relative;
  opacity: 1;
}

#background::before {
  content: '';
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: linear-gradient(135deg,
    rgba(0, 0, 0, 0.1) 0%,
    transparent 30%,
    transparent 70%,
    rgba(0, 0, 0, 0.08) 100%);
  border-radius: 20px;
  filter: blur(15px);
  z-index: -1;
  transition: all 0.3s ease-out;
  opacity: var(--shadow-opacity, 0.6);
  transform: translateZ(-10px);
}

#background:hover::before {
  transform: translateZ(-5px) scale(1.05);
  opacity: calc(var(--shadow-opacity) * 1.3);
  filter: blur(20px);
}

/* 视频容器 */
#videoContainer {
  position: fixed;
  top: 0;
  left: 380px;
  width: 98%;
  height: 98%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: visible;
  opacity: 0;
  transition: opacity 0.75s ease-out 1.2s, transform 0.75s ease-out 1.2s;
  pointer-events: none;
  --shadow-opacity: 0.6;
}

#videoContainer.video-loaded {
  opacity: 1;
  transform: translateX(0) scale(1);
}

#videoContainer video {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  filter: contrast(1.02) brightness(1.03) drop-shadow(0 0 20px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 40px rgba(135, 206, 250, 0.4));
  transform-style: preserve-3d;
  transition: transform 0.2s ease-out, filter 0.3s ease-out, box-shadow 0.3s ease-out, opacity 0.6s ease-in-out;
  will-change: transform, filter, opacity;
  position: relative;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0;
}

#videoContainer::before {
  content: '';
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: linear-gradient(135deg,
    rgba(0, 0, 0, 0.12) 0%,
    transparent 30%,
    transparent 70%,
    rgba(0, 0, 0, 0.1) 100%);
  border-radius: 20px;
  filter: blur(15px);
  z-index: -1;
  transition: all 0.3s ease-out;
  opacity: var(--shadow-opacity, 0.6);
  transform: translateZ(-10px);
}

.right-media-area {
  position: fixed;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  z-index: 99;
  pointer-events: auto;
  background: transparent;
  cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .right-blur-bg::before {
    animation-duration: 30s;
  }

  #background {
    perspective: 800px;
  }

  #background::before {
    filter: blur(10px);
  }
}

@media (max-width: 480px) {
  #background::before {
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    filter: blur(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .right-blur-bg::before,
  .right-blur-bg:hover::before {
    animation: none;
  }

  #background img {
    transform: none !important;
    transition: none !important;
  }

  #background::before {
    transform: none !important;
  }
}
</style>




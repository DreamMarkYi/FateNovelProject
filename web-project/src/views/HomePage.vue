<template>
  <div class="home-page">
    <SowakaNavigation
        :mobile-menu-open="mobileMenuOpen"
        @toggle-mobile-menu="toggleMobileMenu"
        @scroll-to-section="scrollToSection"
    />
    <!-- 背景色层 -->
    <div class="background-color"></div>
    
    <!-- 背景视频 -->
    <div id="background">
      <video autoplay muted loop playsinline>
        <source src="/mainBG_AE_1.mp4" type="video/mp4">
      </video>
    </div>
    
    <!-- 渐变遮罩 -->
    <div id="overlay"></div>
    
    <!-- Canvas画布 -->
    <canvas ref="canvasRef" id="canvas"></canvas>

    <!-- 装饰点 -->
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>

    <!-- 主要内容 -->
    <div class="container">
      <!-- 标题 -->
      <div class="title">
        <span class="small">そして</span>
        <span class="large">春が来て秋が来て。</span>
        <span class="large">四季が巡ります。</span>
      </div>

      <!-- 导航菜单 -->
      <nav class="nav-menu">
        <div class="nav-sentence">
          <div class="nav-part">
            <router-link to="/blue" class="nav-link" @click="handleNavClick">昔の詩</router-link>を辿り、
          </div>
          <div class="nav-part">
            <router-link to="/chapters" class="nav-link" @click="handleNavClick">出会った人々</router-link>と共に、
          </div>
          <div class="nav-part">
            <a href="#" class="nav-link" @click="handleClick">果てしない道</a>を歩む。
          </div>
        </div>
      </nav>

      <!-- 页脚文字 -->
      <div class="footer-text">
        <span class="interactive-text" @click="handleClick">"One day I woke up and saw, we'll find one half of me asleep, I tried to tell the old me in my dream, Let's believe in them, such a strange story, only two pieces left to tell."</span><br><br>
        <span class="interactive-text" @click="handleClick">One sunny day waking up. No city could wake up. Let me dream a little longer. There's a sense of loss there. Like if you could, could a friend lend you his dream? The sense that something is missing. Seeing yourself asleep. In the end there was no escape, was there. I lost someone.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { createPetals, addPetalStyles } from '@/utils/cherryBlossoms'
import { Ribbon } from '@/utils/ribbonAnimation'
import { createRipple } from '@/utils/rippleEffect'
import SowakaNavigation from "@/components/sowaka/SowakaNavigation.vue";
import {useSowakaPage} from "@/composables/useSowakaPage.js";

const {mobileMenuOpen, toggleMobileMenu , scrollToSection} = useSowakaPage();

const router = useRouter()
const canvasRef = ref(null)
let ribbon = null
let petalCleanup = null

onMounted(() => {
  // 添加樱花样式
  addPetalStyles()
  
  // 页面加载动画
  setTimeout(() => {
    document.body.classList.add('loaded')
  }, 50)

  // 创建樱花
 // petalCleanup = createPetals(document.body)

  // 初始化Canvas
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // 启动丝带动画
    ribbon = new Ribbon(canvas, ctx)
    ribbon.start()

    // 窗口大小调整
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // 保存清理函数
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })
  }

  // 全局点击波纹效果
  const handleGlobalClick = (e) => {
    if (!e.target.closest('.nav-link, .interactive-text, a')) {
      createRipple(e, 'rgba(230, 165, 165, 0.5)')
    }
  }
  document.body.addEventListener('click', handleGlobalClick)

  onUnmounted(() => {
    document.body.removeEventListener('click', handleGlobalClick)
  })
})

onUnmounted(() => {
  // 清理丝带动画
  if (ribbon) {
    ribbon.stop()
  }
  
  // 清理樱花
  if (petalCleanup) {
    petalCleanup.cleanup()
  }
})

// 处理导航点击
const handleNavClick = (e) => {
  createRipple(e, 'rgba(230, 165, 165, 0.6)')
}

// 处理普通点击
const handleClick = (e) => {
  e.preventDefault()
  createRipple(e, 'rgba(230, 165, 165, 0.6)')
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.home-page {
  font-family: 'Shippori Mincho', 'Zen Antique', 'Kaisei Decol', 'Noto Serif JP', 'Yu Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif;
  overflow: hidden;
  cursor: crosshair;
  background: transparent;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  min-height: 100vh;
  position: relative;
}

/* 背景色层 - 最底层 */
.background-color {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fef5f5 0%, #fdf0f0 50%, #fce8e8 100%);
  z-index: -3;
}

#background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

#background video {
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  object-fit: cover;
  opacity: 1;
}

#overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(253, 240, 240, 0.3) 100%);
  z-index: -1;
}

canvas {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
}

.container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px 80px;
  z-index: 1;
}

.title {
  position: absolute;
  top: 60px;
  left: 80px;
  color: #d4a5a5;
  letter-spacing: 0.3em;
  font-weight: 300;
  opacity: 0;
  animation: fadeInDown 1.5s ease forwards;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 25px;
  font-family: 'Noto Serif JP', 'Yu Mincho', 'YuMincho', serif;
}

.title .small {
  font-family: 'Noto Serif JP', 'Yu Mincho', 'YuMincho', serif;
  font-size: 1.6rem;
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: 0.3em;
  color: #e6b8b8;
  font-weight: 300;
  padding: 15px 0;
  text-shadow: 0 0 20px rgba(230, 184, 184, 0.3);
  animation: gentleSway1 7s ease-in-out infinite;
}

.title .large {
  font-family: 'Noto Serif JP', 'Yu Mincho', 'YuMincho', serif;
  font-size: 2.4rem;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 0.2em;
  font-weight: 300;
  color: #c99;
  line-height: 2;
  padding: 0 15px;
  text-shadow: 0 0 25px rgba(204, 153, 153, 0.2);
  animation: gentleSway2 8s ease-in-out infinite;
}

.title .large:nth-child(2) {
  animation-name: gentleSway2;
  animation-duration: 8s;
}

.title .large:nth-child(3) {
  animation-name: gentleSway3;
  animation-duration: 7.5s;
}

.nav-menu {
  position: absolute;
  left: 80px;
  bottom: 100px;
  display: flex;
  flex-direction: row;
  gap: 40px;
  align-items: flex-end;
}

.nav-sentence {
  display: flex;
  flex-direction: row;
  gap: 45px;
  align-items: flex-end;
}

.nav-part {
  color: #d4a5a5;
  font-size: 1.5rem;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 0.25em;
  line-height: 2.1;
  font-weight: 300;
  opacity: 0;
  text-shadow: 0 0 20px rgba(230, 165, 165, 0.15);
  transition: all 0.3s ease;
}

.nav-part:hover {
  color: #e6a5a5;
  text-shadow: 0 0 15px rgba(255, 153, 153, 0.2), 0 0 8px rgba(230, 165, 165, 0.15);
}

.nav-part:nth-child(1) {
  animation: fadeInBottom 1s ease 0.6s forwards, gentleSway4 9s ease-in-out 1.6s infinite;
  margin-bottom: 120px;
}

.nav-part:nth-child(2) {
  animation: fadeInBottom 1s ease 0.8s forwards, gentleSway5 8.5s ease-in-out 1.8s infinite;
  margin-bottom: 30px;
}

.nav-part:nth-child(3) {
  animation: fadeInBottom 1s ease 1s forwards, gentleSway6 9.5s ease-in-out 2s infinite;
  margin-bottom: 0px;
}

.nav-part .nav-link {
  color: inherit;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  display: inline;
  position: relative;
}

.nav-part .nav-link:hover {
  color: #ff9999;
  text-shadow: 0 0 15px rgba(255, 153, 153, 0.3), 0 0 8px rgba(230, 165, 165, 0.25);
  filter: brightness(1.1);
}

.footer-text {
  position: absolute;
  right: 80px;
  bottom: 60px;
  color: #c9a5a5;
  font-size: 0.75rem;
  line-height: 1.8;
  max-width: 250px;
  text-align: right;
  opacity: 0;
  animation: slideUpFade 1.5s ease 1.5s forwards, scrollUp 8s linear 3s infinite;
}

.interactive-text {
  cursor: pointer;
  transition: all 0.3s ease;
}

.interactive-text:hover {
  color: #e69999;
  text-shadow: 0 0 10px rgba(230, 165, 165, 0.5);
}

.dot {
  position: absolute;
  left: 80px;
  width: 8px;
  height: 8px;
  background: #e6b8b8;
  border-radius: 50%;
  opacity: 0;
  animation: dotFade 0.5s ease forwards;
  box-shadow: 0 0 10px rgba(230, 184, 184, 0.3);
}

.dot:nth-child(1) { top: 60px; animation-delay: 0.3s; }
.dot:nth-child(2) { top: 400px; animation-delay: 0.5s; }
.dot:nth-child(3) { top: 650px; animation-delay: 0.7s; }
.dot:nth-child(4) { top: 900px; animation-delay: 0.9s; }

/* 动画定义 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInBottom {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scrollUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-20px);
  }
}

@keyframes dotFade {
  to { opacity: 0.6; }
}

@keyframes gentleSway1 {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  50% {
    transform: translateX(0.8px) rotate(0.15deg);
  }
}

@keyframes gentleSway2 {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  50% {
    transform: translateX(-0.6px) rotate(-0.12deg);
  }
}

@keyframes gentleSway3 {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  50% {
    transform: translateX(0.7px) rotate(0.14deg);
  }
}

@keyframes gentleSway4 {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  50% {
    transform: translateX(-1px) rotate(-0.2deg);
  }
}

@keyframes gentleSway5 {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  50% {
    transform: translateX(1.2px) rotate(0.22deg);
  }
}

@keyframes gentleSway6 {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  50% {
    transform: translateX(-0.9px) rotate(-0.18deg);
  }
}

@media (max-width: 768px) {
  .container {
    padding: 40px;
  }

  .title {
    top: 40px;
    left: 40px;
    gap: 15px;
  }

  .title .small {
    font-size: 1.2rem;
    padding: 10px 0;
  }

  .title .large {
    font-size: 1.8rem;
    padding: 0 10px;
    line-height: 1.8;
  }

  .nav-menu {
    left: 40px;
    bottom: 60px;
    gap: 25px;
  }

  .nav-sentence {
    gap: 25px;
  }

  .nav-part {
    font-size: 1.1rem;
    letter-spacing: 0.18em;
    line-height: 1.9;
  }

  .footer-text {
    right: 40px;
    bottom: 40px;
    font-size: 0.7rem;
    max-width: 200px;
  }
}
</style>


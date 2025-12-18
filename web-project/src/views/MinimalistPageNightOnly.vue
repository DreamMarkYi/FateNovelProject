<template>
  <div class="eternal-night-page">

    <SowakaNavigation
        :mobile-menu-open="mobileMenuOpen"
        @toggle-mobile-menu="toggleMobileMenu"
        @scroll-to-section="scrollToSection"
    />

    <svg class="noise-filter-svg" style="position: absolute; width: 0; height: 0;">
      <defs>
        <filter id="textNoiseFilter" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              stitchTiles="stitch"
              result="noise"/>
          <feColorMatrix
              in="noise"
              type="saturate"
              values="1"
              result="noise"/>
          <feComposite
              in="SourceGraphic"
              in2="noise"
              operator="overlay"
              opacity="1"/>
        </filter>
      </defs>
    </svg>

    <div class="blink-layer" v-if="playBlinkAnimation">
      <div class="blink-shutter blink-top"></div>
      <div class="blink-shutter blink-bottom"></div>
    </div>

    <div class="visual-wrapper" :class="{ 'no-animation': !playBlinkAnimation }">
      <div class="bg-overlay"></div>
      <div class="stars-layer"></div>

      <div class="center-content">
        <div class="extreme-page-content">

          <div class="extreme-title-wrapper">
            <span class="title-kanji extreme-title">永</span>
            <span class="title-kanji extreme-title">夜</span>
          </div>

          <div class="extreme-subtitle">—Eternal Night—</div>

          <div class="extreme-description">
            <p>在无尽的黑暗中</p>
            <p>星辰指引着方向</p>
          </div>

          <div class="game-menu-container">
            <button class="menu-btn" @click="startGame">开始游戏</button>
            <button class="menu-btn" @click="continueGame">继续游戏</button>
            <button class="menu-btn" @click="selectChapter">章节选择</button>
            <button class="menu-btn special-btn" @click="enterDaySide">日之暗处</button>
          </div>

        </div>
      </div>
    </div>

    <div class="navigation-controls" :class="{ 'no-animation': !playBlinkAnimation }">
      <button class="nav-button" @click="goBack" title="返回">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SowakaNavigation from "@/components/sowaka/SowakaNavigation.vue";
import { useSowakaPage } from "@/composables/useSowakaPage.js";

const router = useRouter();
const route = useRoute();
const { mobileMenuOpen, toggleMobileMenu, scrollToSection } = useSowakaPage();

// 控制眨眼动画是否播放
const playBlinkAnimation = ref(false);

onMounted(() => {
  // 只有从 StartPage 首次完成身份注册后跳转过来才播放眨眼动画
  if (route.query.firstTime === 'true') {
    playBlinkAnimation.value = true;
    console.log('🌙 首次进入永夜页面，播放眨眼动画');
    
    // 动画播放完毕后清除 URL 参数，避免刷新时再次播放
    setTimeout(() => {
      router.replace({ path: route.path, query: {} });
    }, 8000); // 眨眼动画约 7-8 秒
  } else {
    console.log('🌙 非首次进入，跳过眨眼动画');
  }
});

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

// 新增：按钮点击处理逻辑
const startGame = () => {
  console.log('开始游戏');
  router.push({
    path: '/novel-show',
    query: { scriptId: 'chapter1-0' }
  });
};

const continueGame = () => {
  console.log('继续游戏');
  router.push('/novel-show?openMenu=load');
};

const selectChapter = () => {
  console.log('章节选择');
  router.push('/chapter-select');
};

const enterDaySide = () => {
  console.log('进入日之暗处');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+JP:wght@200;300;400;700&display=swap');

.noise-filter-svg {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

.eternal-night-page {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: #0b1016;
}

/* =========================================
   === [核心动画] 眨眼与真实过曝模拟 ===
   ========================================= */

/* 1. 眨眼层 */
.blink-layer {
  position: fixed;
  top: 0;
  left: -200px;
  width: 300%;
  height: 100%;
  z-index: 200;
  pointer-events: none;
}

.blink-shutter {
  position: absolute;
  left: 0;
  width: 300%;
  height: 52%;
  background: #000;
  filter: blur(25px);
  will-change: transform;
}

.blink-top {
  top: -20px;
  transform-origin: top;
  animation: blinkSequenceTop 7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.blink-bottom {
  bottom: 0;
  transform-origin: bottom;
  animation: blinkSequenceBottom 7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes blinkSequenceTop {
  0%, 15% { transform: translateY(0); }
  25%     { transform: translateY(-40%); }
  35%     { transform: translateY(0); }
  50%     { transform: translateY(-70%); }
  60%     { transform: translateY(0); }
  85%, 100% { transform: translateY(-100%); }
}

@keyframes blinkSequenceBottom {
  0%, 15% { transform: translateY(0); }
  25%     { transform: translateY(40%); }
  35%     { transform: translateY(0); }
  50%     { transform: translateY(70%); }
  60%     { transform: translateY(0); }
  85%, 100% { transform: translateY(100%); }
}

/* 2. 背景层 */
.visual-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  animation: imgExposureFocus 8s cubic-bezier(0.1, 0.5, 0.1, 1) forwards;
  will-change: filter, transform;
}

@keyframes imgExposureFocus {
  0% {
    filter: blur(50px) brightness(6.0) contrast(4.0);
    transform: scale(1.35);
  }
  100% {
    filter: blur(0px) brightness(1.0) contrast(1.0);
    transform: scale(1.0);
  }
}

/* =========================================
   === 内容部分 ===
     background-image: url('/fullNight_BG_HighResolution.png');
   ========================================= */

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('https://mini-story-bg.oss-cn-shanghai.aliyuncs.com/fullNight_BG_HighResolution.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.stars-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
      radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.8), transparent),
      radial-gradient(2px 2px at 60% 70%, rgba(255, 255, 255, 0.6), transparent);
  background-size: 200% 200%;
  opacity: 0;
  pointer-events: none;
  z-index: 1;
  animation: starsFloat 60s ease-in-out infinite, starsFadeIn 3s ease 7.5s forwards;
}

.center-content {
  position: fixed;
  left: 50%;
  top: 48%; /* 微调：稍微上移以容纳按钮 */
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.extreme-page-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  opacity: 0;
  animation: moonRise 2s cubic-bezier(0.2, 0.8, 0.2, 1) 6.5s forwards;
}

@keyframes moonRise {
  from {
    opacity: 0;
    transform: translateY(60px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.navigation-controls {
  position: absolute;
  top: 50%;
  left: 40px;
  transform: translateY(-50%);
  z-index: 20;
  opacity: 0;
  animation: fadeIn 1s ease 8.5s forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

@keyframes starsFloat {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
}

@keyframes starsFadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* 字体与排版样式 */
.extreme-title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.extreme-title {
  font-size: 120px;
  font-weight: 300;
  font-family: 'Noto Serif JP', serif;
  display: block;
  position: relative;
  background: linear-gradient(to bottom, #465a6a 0%, #486071 50%, #4b7ea3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 -3px 1px rgb(238, 248, 255);
  animation: extremePulse 4s ease-in-out infinite;
}

@keyframes extremePulse {
  0%, 100% { opacity: 0.90; }
  50% { opacity: 1; }
}

.extreme-subtitle {
  font-size: 14px;
  letter-spacing: 8px;
  margin-top: 20px;
  font-family: 'Cinzel', serif;
  font-weight: 300;
  text-transform: uppercase;
  color: rgba(200, 210, 220, 1);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.extreme-description {
  margin-top: 20px; /* 调整间距 */
  display: flex;
  flex-direction: column;
  gap: 15px;
  text-align: center;
  font-family: 'Noto Serif JP', serif;
  font-size: 16px;
  font-weight: 300;
  line-height: 1.8;
  letter-spacing: 3px;
  color: rgba(200, 210, 220, 1);
  opacity: 0.8;
}

.extreme-description p {
  margin: 0;
}

/* -------------------------------------- */
/* 新增：夜间模式菜单按钮样式 */
/* -------------------------------------- */
.game-menu-container {
  margin-top: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  width: 100%;
  opacity: 0;
  /* 关键：设置 7.5s 延迟，让它在文字浮现后才慢慢出现 */
  animation: menuFadeIn 1.5s ease-out 7.5s forwards;
}

@keyframes menuFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-btn {
  position: relative;
  overflow: hidden;
  background: transparent;
  /* 夜间特有的冷色调边框，低透明度 */
  border: 1px solid rgba(200, 210, 220, 0.25);
  color: rgba(200, 210, 220, 0.8);
  font-family: 'Noto Serif JP', serif;
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 4px;
  padding: 12px 0;
  width: 220px;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  text-align: center;
  /* 增加一点磨砂感 */
  backdrop-filter: blur(2px);
}



/* 按钮悬停：类似星光被点亮 */
.menu-btn:hover {
  border-color: rgba(255, 255, 255, 0.6);
  background-color: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  letter-spacing: 6px;
  /* 幽灵般的白色辉光 */
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
}

.menu-btn:active {
  transform: scale(0.98);
}

/* 定义底部流光伪元素 */
.menu-btn::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 0%;
  height: 2px;
  /* 永夜主题流光：两头透明，中间是明亮的银白色 */
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
  /* 添加冷色调的发光效果 */
  box-shadow: 0 1px 8px rgba(255, 255, 255, 0.6);
  opacity: 0;
  /* 配合夜间模式较慢的过渡节奏 */
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 1;
}

/* 鼠标悬停时的状态 */
.menu-btn:hover::after {
  width: 100%;
  opacity: 1;
}

/* "日之暗处" 特殊按钮 */
.special-btn {
  margin-top: 10px;
  border-color: rgba(100, 110, 120, 0.2);
  color: rgba(150, 160, 170, 0.5);
}

.special-btn:hover {
  border-color: rgba(150, 160, 170, 0.6);
  background-color: rgba(0, 0, 0, 0.2); /* 稍微深沉的背景 */
  color: #e0e0e0;
}
.special-btn::after {
  background: linear-gradient(90deg, transparent, rgba(150, 160, 170, 0.6), transparent);
  box-shadow: 0 1px 5px rgba(150, 160, 170, 0.3);
}
/* -------------------------------------- */
/* 返回按钮样式 (保持不变) */
/* -------------------------------------- */
.nav-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.nav-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.8);
}

@media (max-width: 768px) {
  .extreme-title {
    font-size: 80px;
  }
  .navigation-controls {
    top: auto;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* =========================================
   === 无动画模式（非首次进入时） ===
   ========================================= */
.visual-wrapper.no-animation {
  animation: none;
  filter: none;
  transform: none;
}

.visual-wrapper.no-animation .stars-layer {
  opacity: 1;
  animation: starsFloat 60s ease-in-out infinite; /* 保留星星浮动，去掉淡入延迟 */
}

.visual-wrapper.no-animation .extreme-page-content {
  opacity: 1;
  animation: none;
  transform: none;
  filter: none;
}

.visual-wrapper.no-animation .game-menu-container {
  opacity: 1;
  animation: none;
  transform: none;
}

.navigation-controls.no-animation {
  opacity: 1;
  animation: none;
}
</style>
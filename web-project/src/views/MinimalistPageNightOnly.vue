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

    <div class="blink-layer">
      <div class="blink-shutter blink-top"></div>
      <div class="blink-shutter blink-bottom"></div>
    </div>

    <div class="visual-wrapper">
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

        </div>
      </div>
    </div>

    <div class="game-menu-bar">
      <div class="menu-item" @click="handleGameStart">
        <span class="menu-en">Start Game</span>
        <span class="menu-cn">开始游戏</span>
      </div>

      <div class="menu-divider"></div>

      <div class="menu-item" @click="handleLoadGame">
        <span class="menu-en">Load Game</span>
        <span class="menu-cn">加载存档</span>
      </div>

      <div class="menu-divider"></div>

      <div class="menu-item" @click="handleChapterSelect">
        <span class="menu-en">Chapters</span>
        <span class="menu-cn">章节选择</span>
      </div>

      <div class="menu-divider"></div>

      <div class="menu-item" @click="handleExtras">
        <span class="menu-en">Archives</span>
        <span class="menu-cn">已解锁信息</span>
      </div>
    </div>

    <div class="navigation-controls">
      <button class="nav-button" @click="goBack" title="返回">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import SowakaNavigation from "@/components/sowaka/SowakaNavigation.vue";
import { useSowakaPage } from "@/composables/useSowakaPage.js";

const router = useRouter();
const { mobileMenuOpen, toggleMobileMenu, scrollToSection } = useSowakaPage();

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

// [新增] 菜单点击处理逻辑
const handleGameStart = () => {
  console.log("Start Game Clicked");
  // router.push('/game/start');
};

const handleLoadGame = () => {
  console.log("Load Game Clicked");
  // router.push('/game/load');
};

const handleChapterSelect = () => {
  console.log("Chapter Select Clicked");
  // router.push('/game/chapters');
};

const handleExtras = () => {
  console.log("Extras Clicked");
  // router.push('/game/extras');
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
  left: 0;
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
  top: 0;
  transform-origin: top;
  animation: blinkSequenceTop 7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.blink-bottom {
  bottom: 0;
  transform-origin: bottom;
  animation: blinkSequenceBottom 7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes blinkSequenceTop {
  0%, 15% { transform: translateY(0); }         /* 闭 */
  25%     { transform: translateY(-40%); }      /* 睁1 */
  35%     { transform: translateY(0); }         /* 闭 */
  50%     { transform: translateY(-70%); }      /* 睁2 */
  60%     { transform: translateY(0); }         /* 闭 */
  85%, 100% { transform: translateY(-100%); }   /* 睁3(定格) */
}

@keyframes blinkSequenceBottom {
  0%, 15% { transform: translateY(0); }
  25%     { transform: translateY(40%); }
  35%     { transform: translateY(0); }
  50%     { transform: translateY(70%); }
  60%     { transform: translateY(0); }
  85%, 100% { transform: translateY(100%); }
}

/* 2. 背景层：实现真实过曝 */
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
   ========================================= */

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/fullNight_BG_HighResolution.png');
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
  top: 50%;
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
  background: linear-gradient(to bottom, #ffffff 0%, #e0f0ff 50%, #ffffff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 1);
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
  margin-top: 40px;
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

/* =========================================
   === [新增] 底部游戏菜单样式 ===
   ========================================= */

.game-menu-bar {
  position: absolute;
  bottom: 8%; /* 距离底部的位置 */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 40px; /* 按钮之间的间距 */
  z-index: 30; /* 确保在背景之上 */
  opacity: 0;
  /* 动画：延迟 8.5s 开始，持续 1.5s 淡入 */
  animation: menuFadeIn 1.5s ease 8.5s forwards;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
}

/* 英文小标题 */
.menu-en {
  font-family: 'Cinzel', serif;
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
  transition: color 0.3s ease;
  text-transform: uppercase;
}

/* 中文标题 */
.menu-cn {
  font-family: 'Noto Serif JP', serif;
  font-size: 16px;
  font-weight: 300;
  letter-spacing: 2px;
  color: rgba(220, 220, 220, 0.8);
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  transition: all 0.3s ease;
}

/* 悬停效果 */
.menu-item:hover .menu-cn {
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.6), 0 0 20px rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.menu-item:hover .menu-en {
  color: rgba(255, 255, 255, 0.8);
}

/* 分割线 */
.menu-divider {
  width: 1px;
  height: 25px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.3), transparent);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .extreme-title {
    font-size: 80px;
  }
  .navigation-controls {
    top: auto;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0; /* 保持原有的fadeIn动画 */
  }

  /* 移动端菜单调整 */
  .game-menu-bar {
    width: 90%;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    bottom: 15%; /* 稍微抬高，给返回按钮留空间 */
  }

  .menu-divider {
    display: none;
  }

  .menu-item {
    width: 40%;
    margin-bottom: 10px;
  }
}
</style>
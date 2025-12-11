<template>
  <div class="minimalist-page page-day-mode">

    <SowakaNavigation
        :mobile-menu-open="mobileMenuOpen"
        @toggle-mobile-menu="toggleMobileMenu"
        @scroll-to-section="scrollToSection"
    />

    <svg class="noise-filter-svg" style="position: absolute; width: 0; height: 0;">
      <defs>
        <filter id="textNoiseFilter" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" result="noise"/>
          <feColorMatrix in="noise" type="saturate" values="1" result="noise"/>
          <feComposite in="SourceGraphic" in2="noise" operator="overlay" opacity="1"/>
        </filter>
      </defs>
    </svg>

    <div class="center-main-title">
      <div class="extreme-content left-extreme">
        <div class="extreme-page-content">
          <div class="extreme-title-wrapper">
            <span class="title-kanji extreme-title">白</span>
            <span class="title-kanji extreme-title">昼</span>
          </div>
          <div class="extreme-subtitle">—Endless Day—</div>
          <div class="extreme-description">
            <p>在永恒的光明中</p>
            <p>万物生长繁盛</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { defineComponent } from 'vue';
import SowakaNavigation from "@/components/sowaka/SowakaNavigation.vue";
import { useSowakaPage } from "@/composables/useSowakaPage.js";

// 使用原有的导航逻辑
const { mobileMenuOpen, toggleMobileMenu, scrollToSection } = useSowakaPage();

defineComponent({
  name: 'ExtremeDayPage'
});
</script>

<style scoped>
/* 基础页面容器 */
.minimalist-page {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  /* 对应原代码中 page-day-mode 的背景设置 */
  /* 注意：原代码中此处使用了 fullNight_BG_HighResolution.png 作为白昼背景，保留原逻辑 */
  background-image: url('/fullDay_BG_HighResolution.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* SVG 滤镜容器隐藏 */
.noise-filter-svg {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

/* 中央容器定位 */
.center-main-title {
  position: fixed;
  left: 50%;
  top: 45%;
  transform: translate(-50%, -50%);
  z-index: 150;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
}

/* 内容布局 */
.extreme-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.extreme-page-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

/* 标题淡入动画 */
.left-extreme {
  animation: dayTitleFadeIn 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

@keyframes dayTitleFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.extreme-title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* 大标题样式 */
.extreme-title {
  font-size: 120px;
  font-weight: 300;
  font-family: 'Noto Serif JP', serif; /* 需确保 index.html 引入了该字体 */
  display: block;
  position: relative;

  /* 白昼特定的金棕色渐变 */
  background: linear-gradient(
      to bottom,
      #8c8781 0%,
      #65605a 50%,
      #88847f 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.7);

  animation: extremePulse 4s ease-in-out infinite;
}

@keyframes extremePulse {
  0%, 100% {
    opacity: 0.95;
  }
  50% {
    opacity: 1;
  }
}

/* 副标题样式 */
.extreme-subtitle {
  font-size: 14px;
  letter-spacing: 8px;
  margin-top: 20px;
  font-family: 'Cinzel', serif; /* 需确保 index.html 引入了该字体 */
  font-weight: 300;
  text-transform: uppercase;
  color: rgba(107, 93, 75, 0.85);
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
  animation: extremeSubtitleFloat 5s ease-in-out infinite;
}

@keyframes extremeSubtitleFloat {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* 描述文字样式 */
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
  color: rgba(107, 93, 75, 0.7);
}

.extreme-description p {
  margin: 0;
}
</style>
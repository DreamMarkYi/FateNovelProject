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

          <div class="game-menu-container">
            <button class="menu-btn" @click="startGame">开始游戏</button>
            <button class="menu-btn" @click="continueGame">继续游戏</button>
            <button class="menu-btn" @click="selectChapter">章节选择</button>
            <button class="menu-btn special-btn" @click="enterDarkSide">日之暗处</button>
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

// 新增：按钮点击处理逻辑
const startGame = () => {
  console.log('开始游戏');
  // 路由跳转逻辑...
};

const continueGame = () => {
  console.log('继续游戏');
};

const selectChapter = () => {
  console.log('章节选择');
};

const enterDarkSide = () => {
  console.log('进入日之暗处');
  // 可以添加特殊转场效果
};
</script>

<style scoped>
/* 基础页面容器 */
.minimalist-page {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
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

/* 中央容器定位 - 稍微上调 top 值以容纳下方按钮 */
.center-main-title {
  position: fixed;
  left: 50%;
  top: 48%; /* 原为 45%，稍微下移或保持居中，视视觉重心而定 */
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
  font-family: 'Noto Serif JP', serif;
  display: block;
  position: relative;
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
  0%, 100% { opacity: 0.95; }
  50% { opacity: 1; }
}

/* 副标题样式 */
.extreme-subtitle {
  font-size: 14px;
  letter-spacing: 8px;
  margin-top: 20px;
  font-family: 'Cinzel', serif;
  font-weight: 300;
  text-transform: uppercase;
  color: rgba(107, 93, 75, 0.85);
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
  animation: extremeSubtitleFloat 5s ease-in-out infinite;
}

@keyframes extremeSubtitleFloat {
  0%, 100% { transform: translateY(0); opacity: 0.8; }
  50% { transform: translateY(-8px); opacity: 1; }
}

/* 描述文字样式 */
.extreme-description {
  margin-top: 20px; /* 原为 40px，稍微减小与标题的距离 */
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

/* -------------------------------------- */
/* 新增：菜单按钮样式 */
/* -------------------------------------- */
.game-menu-container {
  margin-top: 50px; /* 与上方描述文字拉开距离 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  width: 100%;
  /* 稍微延迟出现，让标题先展示 */
  animation: menuFadeIn 1.5s ease-out 0.5s forwards;
  opacity: 0;
}

@keyframes menuFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-btn {
  position: relative;
  background: transparent;
  /* 使用与主题一致的金棕色，带低透明度边框 */
  border: 1px solid rgba(107, 93, 75, 0.3);
  color: #65605a;
  font-family: 'Noto Serif JP', serif;
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 4px;
  padding: 12px 0;
  width: 220px; /* 固定宽度保证整齐 */
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  text-align: center;
}

/* 按钮悬停效果 */
.menu-btn:hover {
  border-color: rgba(107, 93, 75, 0.8);
  background-color: rgba(107, 93, 75, 0.05); /* 极淡的背景填充 */
  color: #4a4540;
  letter-spacing: 6px; /* 字体间距微张 */
  box-shadow: 0 4px 15px rgba(107, 93, 75, 0.15);
}

/* 点击时的微缩放反馈 */
.menu-btn:active {
  transform: scale(0.98);
}

/* "日之暗处" 特殊样式 */
.special-btn {
  margin-top: 10px; /* 与上方常规选项稍微区隔 */
  border-color: rgba(80, 70, 60, 0.15);
  color: rgba(100, 90, 80, 0.6);
  font-size: 14px;
}

.special-btn:hover {
  border-color: rgba(60, 60, 60, 0.6);
  background-color: rgba(0, 0, 0, 0.03); /* 稍微偏暗的背景 */
  color: #2c2c2c;
}
</style>
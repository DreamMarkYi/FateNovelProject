<template>
  <div class="midnight-page">

    <SowakaNavigation
        :mobile-menu-open="mobileMenuOpen"
        @toggle-mobile-menu="toggleMobileMenu"
        @scroll-to-section="scrollToSection"
    />

    <div class="background-layer">
      <div class="stars-overlay"></div>
    </div>

    <div class="content-wrapper">

      <div class="header-section">
        <div class="main-title-group">
          <span class="kanji-title">永</span>
          <span class="kanji-title">夜</span>
        </div>
        <div class="english-subtitle">— ETERNAL NIGHT —</div>
        <p class="flavor-text">在无尽的黑暗中，星辰指引着归途</p>
      </div>

      <div class="cards-section">
        <div
            v-for="(card, index) in cards"
            :key="card.key"
            class="glass-card"
            :class="`card-${index + 1}`"
            @mouseenter="activeCard = index"
            @mouseleave="activeCard = null"
            @click="navigateTo(card.route)"
        >
          <div class="card-border-glow"></div>

          <div class="card-content">
            <div class="card-number">{{ card.number }}</div>
            <div class="card-kanji">{{ card.text }}</div>
            <div class="card-divider"></div>
            <div class="card-english">{{ card.title }}</div>
            <div class="card-subtitle">{{ card.subtitle }}</div>
          </div>

          <div class="card-hover-light"></div>
        </div>
      </div>

    </div>

    <div class="footer-controls">
      <button class="back-button" @click="goBack">
        <span class="button-text">BACK</span>
        <div class="button-line"></div>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import SowakaNavigation from "@/components/sowaka/SowakaNavigation.vue";
import { useSowakaPage } from "@/composables/useSowakaPage.js";

const router = useRouter();
const { mobileMenuOpen, toggleMobileMenu, scrollToSection } = useSowakaPage();
const activeCard = ref(null);

const cards = ref([
  {
    key: 'ho1',
    number: '01',
    title: 'HO1',
    text: '人 間 不 信',
    subtitle: 'Distrust of Humanity',
    route: '/'
  },
  {
    key: 'ho2',
    number: '02',
    title: 'HO2',
    text: '思 界 者',
    subtitle: 'Thinker of Realms',
    route: '/cards'
  },
  {
    key: 'ho3',
    number: '03',
    title: 'HO3',
    text: '永 遠 回 帰',
    subtitle: 'Eternal Recurrence',
    route: '/sowaka'
  }
]);

const navigateTo = (route) => {
  router.push(route);
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Noto+Serif+JP:wght@200;300;400;700&display=swap');

.midnight-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #0b1026; /* 深蓝底色兜底 */
  color: white;
  font-family: 'Noto Serif JP', serif;
}

/* --- 背景设置 --- */
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 这里请替换为你上传的那张星空图片的路径 */
  background-image: url('/extreme-night.png');
  background-size: cover;
  background-position: center;
  z-index: 0;
  /* 添加轻微的暗角，让视线集中在中间 */
  box-shadow: inset 0 0 200px rgba(0,0,0,0.6);
}

/* 简单的星星闪烁层 */
.stars-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(white 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
  animation: twinkle 5s infinite ease-in-out;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

/* --- 内容布局 --- */
.content-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 60px; /* 标题和卡片的间距 */
}

/* --- 顶部标题 (参考图片风格) --- */
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-top: -50px; /* 稍微上移 */
  animation: fadeDown 1.5s ease-out forwards;
}

.main-title-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.kanji-title {
  font-size: 64px;
  font-weight: 300;
  line-height: 1.1;
  text-shadow: 0 0 20px rgba(188, 214, 255, 0.6);
  background: linear-gradient(to bottom, #fff 0%, #a4c0d9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.english-subtitle {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  letter-spacing: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
}

.flavor-text {
  margin-top: 15px;
  font-size: 12px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.5);
  transform: scale(0.9);
}

/* --- 卡片区域 (核心设计) --- */
.cards-section {
  display: flex;
  gap: 40px;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
}

/* 卡片本体 - 玻璃拟态 */
.glass-card {
  position: relative;
  width: 240px;
  height: 360px;

  /* 玻璃质感核心代码 */
  background: rgba(18, 26, 56, 0.25); /* 深蓝半透明 */
  backdrop-filter: blur(8px); /* 磨砂效果 */
  -webkit-backdrop-filter: blur(8px);

  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: cardFloatUp 1s ease-out forwards;
  animation-delay: calc(var(--i) * 0.1s); /* 需要在循环中动态加 style="--i: index" */
}

/* 依次入场 */
.glass-card:nth-child(1) { animation-delay: 0.2s; opacity: 0; }
.glass-card:nth-child(2) { animation-delay: 0.4s; opacity: 0; }
.glass-card:nth-child(3) { animation-delay: 0.6s; opacity: 0; }

@keyframes cardFloatUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 悬停效果 */
.glass-card:hover {
  transform: translateY(-10px) scale(1.02);
  background: rgba(18, 26, 56, 0.45);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(164, 192, 217, 0.2);
}

/* 卡片内容样式 */
.card-content {
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  width: 100%;
}

.card-number {
  font-family: 'Cinzel', serif;
  font-size: 48px;
  color: rgba(255, 255, 255, 0.1);
  position: absolute;
  top: 20px;
  right: 20px;
  font-weight: 700;
  transition: color 0.4s ease;
}

.glass-card:hover .card-number {
  color: rgba(255, 255, 255, 0.25);
}

.card-kanji {
  font-size: 24px;
  letter-spacing: 8px; /* 宽间距 */
  margin-top: 40px;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  font-weight: 300;
}

.card-divider {
  width: 30px;
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
  margin-bottom: 20px;
  transition: width 0.4s ease;
}

.glass-card:hover .card-divider {
  width: 60px;
  background: rgba(255, 255, 255, 0.8);
}

.card-english {
  font-family: 'Cinzel', serif;
  font-size: 16px;
  letter-spacing: 2px;
  margin-bottom: 5px;
}

.card-subtitle {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 卡片内部的光效 */
.card-hover-light {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
      circle at 50% 100%,
      rgba(130, 180, 255, 0.2) 0%,
      transparent 60%
  );
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
  z-index: 1;
}

.glass-card:hover .card-hover-light {
  opacity: 1;
}

/* --- 底部控制 --- */
.footer-controls {
  position: absolute;
  bottom: 50px;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 20;
}

.back-button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Cinzel', serif;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
  padding: 10px 20px;
}

.button-line {
  width: 0px;
  height: 1px;
  background: white;
  transition: width 0.3s ease;
}

.back-button:hover {
  color: white;
  letter-spacing: 2px;
}

.back-button:hover .button-line {
  width: 100%;
}

/* 响应式 */
@media (max-width: 900px) {
  .cards-section {
    flex-direction: column;
    gap: 20px;
  }

  .glass-card {
    width: 280px;
    height: 160px; /* 变扁平 */
    flex-direction: row;
    padding: 0 20px;
  }

  .card-number {
    position: static;
    font-size: 32px;
    margin-right: 20px;
  }

  .card-content {
    align-items: flex-start;
    text-align: left;
    padding: 0;
  }

  .card-kanji {
    margin: 0 0 5px 0;
    font-size: 20px;
  }

  .card-divider {
    display: none;
  }
}

@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
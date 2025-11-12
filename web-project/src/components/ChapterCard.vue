<template>
  <div class="chapter-card-wrapper">
    <!-- 左侧封面页 -->
    <div class="cover-page" :style="{ background: chapter.gradient }">
      <router-link to="/sowaka" class="nav-link" >
        <img
          v-if="chapter.leftBackgroundImage"
          :src="chapter.leftBackgroundImage"
          :alt="`${chapter.number} 插画`"
          class="illustration-image"
      />
        <div v-else>
          <!-- 装饰边框 -->
          <div class="frame-decoration frame-top-left"></div>
          <div class="frame-decoration frame-top-right-1"></div>
          <div class="frame-decoration frame-top-right-2"></div>
          <div class="frame-decoration frame-top-horizontal"></div>
          <div class="frame-decoration frame-bottom-left"></div>
          <div class="frame-decoration frame-bottom-horizontal"></div>
          <div class="frame-decoration frame-right-vertical"></div>

          <!-- 底部大标题 -->
          <div class="bottom-main-title">{{ chapter.bottomTitle }}</div>
          <!-- 中央主标题 - 竖排 -->
          <div class="main-title-vertical" v-html="chapter.verticalTitle"></div>
          <!-- 装饰元素 -->
          <div class="decorative-circle circle-1"></div>
          <div class="decorative-circle circle-2"></div>
          <div class="decorative-line"></div>
        </div>
      <div class="cover-overlay"></div>
      
      <!-- 顶部小标签 -->
      <div class="chapter-label">{{ chapter.number }}</div>
      
      <!-- 左侧副标题信息 -->
      <div class="side-info" v-html="chapter.leftSidebar"></div>
      
      <!-- 作者标识 -->
      <div class="author-mark">R18</div>
      </router-link>
    </div>
    
    <!-- 右侧内容页 -->
    <div class="content-page">
      <div class="content-overlay"></div>
      
      <!-- 随机散布的标题装饰文字（底层） -->
      <div class="scattered-titles">
        <div class="scattered-text scattered-1">{{ chapter.englishTitle }}</div>
        <div class="scattered-text scattered-2">{{ chapter.subTitle }}</div>
        <div class="scattered-text scattered-3">{{ chapter.number }}</div>
        <div class="scattered-text scattered-4">{{ chapter.verticalTitle?.replace(/<br>/g, '') }}</div>
        <div class="scattered-text scattered-5">{{ chapter.bottomTitle }}</div>
        <div class="scattered-text scattered-6">{{ chapter.englishTitle }}</div>
      </div>
      
      <!-- 顶部装饰线 -->
      <div class="top-accent-line"></div>
      
      <!-- 英文主标题 -->
      <div class="english-title">{{ chapter.englishTitle }}</div>
      
      <!-- 副标题装饰 -->
      <div class="subtitle-accent">
        <span class="accent-line"></span>
        <span class="accent-text">{{ chapter.subTitle }}</span>
        <span class="accent-line"></span>
      </div>
      
      <!-- 主要内容文字 -->
      <div class="main-content">
        <p v-for="(paragraph, index) in chapter.content" :key="index" class="content-paragraph">
          {{ paragraph }}
        </p>
      </div>

      <!-- 装饰性插画区域
      <div class="illustration-left-buttom-area">
        <img
          v-if="chapter.illustrationImage"
          :src="chapter.illustrationImage"
          :alt="`${chapter.number} 插画`"
          class="illustration-image"
        />
        <div v-else class="illustration-placeholder" :style="{ background: chapter.illustrationGradient }">
          <div class="illustration-overlay"></div>
        </div>
      </div> -->
      
      <!-- 底部装饰文字 -->
      <div class="bottom-decoration">
        <span>{{ chapter.decorativeText }}</span>
      </div>
      
      <!-- 右侧竖排标题 -->
      <div class="vertical-accent" v-html="chapter.verticalAccent"></div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  chapter: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.chapter-card-wrapper {
  display: flex;
  gap: 30px;
  perspective: 1500px;
  animation: fadeIn 0.8s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 左侧封面页 */
.cover-page {
  width: 550px;
  height: 750px;
  position: relative;
  box-shadow:
      0 25px 70px rgba(0, 0, 0, 0.35),
      0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: all 0.5s ease;
  border: 8px solid #ffffff;
}

.cover-page:hover {
  transform: translateY(-5px);
  box-shadow:
    0 12px 40px rgba(250, 244, 213,1),
    0 8px 20px rgba(218, 200, 213, 0.8);
}

.cover-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 25% 35%, rgba(255, 255, 255, 0.25) 0%, transparent 45%),
    radial-gradient(circle at 75% 65%, rgba(0, 0, 0, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.chapter-label {
  position: absolute;
  top: 25px;
  right: 25px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  color: #222;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.main-title-vertical {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  font-size: 6rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: #1a1a1a;
  line-height: 1;
  text-shadow: 
    3px 3px 0px rgba(255, 255, 255, 0.8),
    -1px -1px 0px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.side-info {
  position: absolute;
  left: 25px;
  top: 80px;
  writing-mode: vertical-rl;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.65);
  letter-spacing: 0.12em;
  line-height: 1.8;
  z-index: 5;
}

.bottom-main-title {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  font-size: 5.5rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.85);
  text-align: center;
  letter-spacing: 0.08em;
  line-height: 1;
  text-shadow: 
    4px 4px 0px rgba(255, 255, 255, 0.7),
    -1px -1px 0px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

/* 装饰边框 */
.frame-decoration {
  position: absolute;
  background: #000;
  z-index: 8;
}

.frame-top-left {
  top: 0;
  left: 0;
  width: 10px;
  height: 80px;
}

.frame-top-right-1 {
  top: 0;
  right: 100px;
  width: 10px;
  height: 60px;
}

.frame-top-right-2 {
  top: 0;
  right: 60px;
  width: 10px;
  height: 80px;
}

.frame-top-horizontal {
  top: 0;
  right: 0;
  width: 120px;
  height: 10px;
}

.frame-bottom-left {
  bottom: 0;
  left: 0;
  width: 10px;
  height: 130px;
}

.frame-bottom-horizontal {
  bottom: 0;
  left: 0;
  width: 90px;
  height: 10px;
}

.frame-right-vertical {
  right: 0;
  top: 0;
  width: 10px;
  height: 140px;
}

/* 装饰元素 */
.decorative-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  filter: blur(30px);
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 20%;
  left: 15%;
  animation: float 8s ease-in-out infinite;
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: 25%;
  right: 20%;
  animation: float 10s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

.decorative-line {
  position: absolute;
  width: 2px;
  height: 150px;
  background: rgba(0, 0, 0, 0.12);
  top: 28%;
  left: 48%;
  transform: rotate(25deg);
}

.author-mark {
  position: absolute;
  bottom: 18px;
  right: 25px;
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.5);
  letter-spacing: 0.15em;
  font-style: italic;
  font-weight: 600;
}

/* 右侧内容页 */
.content-page {
  width: 550px;
  height: 750px;
  background: linear-gradient(135deg,  #d8b8c8 0%,  #ffe8dd 60%, #fff0e8 100%);
  position: relative;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 8px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: all 0.5s ease;
  border: 8px solid #ffffff;
  outline: 2px solid #000000;
  outline-offset: -10px;
}

.content-page:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.45),
    0 10px 25px rgba(0, 0, 0, 0.25);
}

.content-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 15% 20%, rgba(225, 208, 218, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 85% 80%, rgba(220, 210, 216, 0.12) 0%, transparent 45%);
  pointer-events: none;
}

/* 随机散布的标题装饰文字 */
.scattered-titles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}

.scattered-text {
  position: absolute;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.03);
  white-space: nowrap;
  user-select: none;
  animation: floatSlow 20s ease-in-out infinite;
}

.scattered-1 {
  top: 8%;
  left: -5%;
  font-size: 4rem;
  transform: rotate(-12deg);
  animation-delay: 0s;
  letter-spacing: 0.5em;
}

.scattered-2 {
  top: 25%;
  right: -8%;
  font-size: 2.5rem;
  transform: rotate(8deg);
  animation-delay: -3s;
  opacity: 0.5;
}

.scattered-3 {
  top: 45%;
  left: 5%;
  font-size: 6rem;
  transform: rotate(-5deg);
  animation-delay: -6s;
  letter-spacing: 0.3em;
}

.scattered-4 {
  top: 15%;
  right: 10%;
  font-size: 3rem;
  transform: rotate(15deg);
  animation-delay: -9s;
  writing-mode: vertical-rl;
  opacity: 0.4;
}

.scattered-5 {
  bottom: 20%;
  left: -10%;
  font-size: 5rem;
  transform: rotate(-8deg);
  animation-delay: -12s;
  letter-spacing: 0.2em;
}

.scattered-6 {
  bottom: 5%;
  right: -5%;
  font-size: 3.5rem;
  transform: rotate(10deg);
  animation-delay: -15s;
  opacity: 0.6;
}

@keyframes floatSlow {
  0%, 100% {
    transform: translateY(0) rotate(var(--rotate, 0deg));
  }
  50% {
    transform: translateY(-15px) rotate(var(--rotate, 0deg));
  }
}

.top-accent-line {
  position: absolute;
  top: 50px;
  left: 40px;
  right: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%);
  z-index: 3;
}

.english-title {
  position: absolute;
  top: 60px;
  left: 40px;
  right: 40px;
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  color: #ffffff;
  text-align: center;
  text-indent: 0.3em;
  font-family: 'Cinzel', 'Times New Roman', serif;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  z-index: 3;
}

.subtitle-accent {
  position: absolute;
  top: 140px;
  left: 40px;
  right: 40px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: rgba(0, 0, 0, 0.6);
  z-index: 3;
}

.accent-line {
  flex: 1;
  height: 1px;
  background: rgba(0, 0, 0, 0.2);
}

.accent-text {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  font-weight: 300;
}

.main-content {
  position: absolute;
  top: 200px;
  left: 40px;
  right: 40px;
  color: rgba(0, 0, 0, 0.85);
  font-size: 0.85rem;
  line-height: 2;
  letter-spacing: 0.08em;
  z-index: 10;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 5px;
}

.content-paragraph {
  margin-bottom: 15px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.illustration-area {
  position: absolute;
  bottom: 50px;
  right: 0px;
  width: 214px;
  height: 214px;
  border: 0px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.1);
}

.illustration-left-buttom-area {
  position: absolute;
  bottom: 30px;
  right: 0px;
  width: 214px;
  height: 214px;
  border: 0px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.illustration-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.5s ease;
}

.illustration-image:hover {
  transform: scale(1.05);
}

.illustration-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
}

.illustration-overlay {
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.2) 0%, transparent 60%);
}

.bottom-decoration {
  position: absolute;
  bottom: 40px;
  left: 40px;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.15em;
  font-style: italic;
  z-index: 3;
}

.vertical-accent {
  position: absolute;
  right: 25px;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  font-size: 1.2rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.5);
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  z-index: 3;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .chapter-card-wrapper {
    flex-direction: column;
    gap: 20px;
  }
  
  .cover-page,
  .content-page {
    width: 100%;
    max-width: 450px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .cover-page,
  .content-page {
    width: 380px;
    height: 532px;
  }
  
  .main-title-vertical {
    font-size: 4.5rem;
    right: 30px;
  }
  
  .bottom-main-title {
    font-size: 4rem;
  }
  
  .english-title {
    font-size: 2rem;
  }
}
</style>


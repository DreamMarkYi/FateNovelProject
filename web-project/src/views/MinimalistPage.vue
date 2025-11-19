<template>
  <div class="minimalist-page">
    <!-- 中央大标题 -->
    <div class="center-main-title" :class="'title-theme-' + currentBg">
      
      <!-- 交错排布的标题组合 -->
      <div class="title-composition">
        <!-- 第一个字 -->
        <span class="title-kanji">白</span>
        
        <!-- 竖线装饰 -->
        <div class="side-vertical-line">  <div class="side-subtitle-vertical">
          <span class="subtitle-letter">MIDNIGHT</span>
        </div></div>
        
        <!-- 第二个字 -->
        <span class="title-kanji">夜</span>
        
        <!-- 副标题 -->

      </div>

    </div>

    <!-- 左侧大图区域 -->
    <div class="left-section">
      <div class="sky-background">
        <!-- 多层背景叠加 -->
        <div class="bg-layer bg-default" :class="{ active: currentBg === 0 }"></div>
        <div class="bg-layer bg-1" :class="{ active: currentBg === 1 }"></div>
        <div class="bg-layer bg-2" :class="{ active: currentBg === 2 }"></div>
        <div class="bg-layer bg-3" :class="{ active: currentBg === 3 }"></div>
        
        <!-- 装饰性线条元素 -->
        <div class="deco-lines-left">
          <div class="line-h line-h-1"></div>
          <div class="line-h line-h-2"></div>
          <div class="line-v line-v-1"></div>
          <div class="line-v line-v-2"></div>
        </div>

        <!-- 几何装饰元素 -->
        <div class="geometric-deco">
          <div class="geo-circle-outline"></div>
          <div class="geo-square-outline"></div>
          <div class="geo-cross"></div>
        </div>
        
        <div class="title-vertical" :class="'title-mode-' + currentBg">
          <!-- 标题装饰框 -->
          <div class="title-frame-lines">
            <span class="frame-line frame-top"></span>
            <span class="frame-line frame-bottom"></span>
          </div>
          <p class="subtitle">—Midnight Sun—</p>
        </div>
      </div>
    </div>

    <!-- 右侧卡片区域 -->
    <div class="right-section">
      <!-- 右侧装饰线条 -->
      <div class="deco-lines-right">
        <div class="right-line-h right-line-h-1"></div>
        <div class="right-line-h right-line-h-2"></div>
        <div class="right-line-v right-line-v-1"></div>
      </div>
      
      <div class="card-container">
        <!-- 卡片1 -->
        <div class="minimal-card"
             @mouseenter="currentBg = 1"
             @mouseleave="currentBg = 0">
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
            <div class="card-number">01</div>
            <h2 class="card-title">H O 1</h2>

            <p class="card-text">人　間　不　信</p>
            <div class="card-subtitle">Distrust of Humanity</div>
          </div>

          <div class="card-season-tag">春</div>
        </div>

        <!-- 卡片2 -->
        <div class="minimal-card"
             @mouseenter="currentBg = 2"
             @mouseleave="currentBg = 0">
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
            <div class="card-number">02</div>
            <h2 class="card-title">H O 2</h2>

            <p class="card-text">思　界　者</p>
            <div class="card-subtitle">Thinker of Realms</div>
          </div>
          
          <div class="card-season-tag">夏</div>
        </div>

        <!-- 卡片3 -->
        <div class="minimal-card"
             @mouseenter="currentBg = 3"
             @mouseleave="currentBg = 0">
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
            <div class="card-number">03</div>
            <h2 class="card-title">H O 3</h2>

            <p class="card-text">永　遠　回　帰</p>
            <div class="card-subtitle">Eternal Recurrence</div>
          </div>
          
          <div class="card-season-tag">冬</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const currentBg = ref(0);

onMounted(() => {
  // 添加淡入动画
  const cards = document.querySelectorAll('.minimal-card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 200 * (index + 1));
  });
});
</script>

<style scoped>
.minimalist-page {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f5f3f0;
  position: relative;
}

/* 中央大标题 */
.center-main-title {
  position: fixed;
  left: 30%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 150;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 交错排布的标题组合 */
.title-composition {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 35px;
  position: relative;
}

/* 标题文字基础样式 */
.title-kanji {
  font-size: 140px;
  font-weight: 300;
  font-family: 'Noto Serif JP', serif;
  display: inline-block;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 第一个字 "白" - 左偏移 + 冷色调 */
.title-composition .title-kanji:nth-child(1) {
  transform: translateX(-25px);
  background: linear-gradient(
    to bottom,
    #fbf2eb 0%,
    #edf4f8 50%,
    #faf5eb 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(2px 2px 0 rgba(255, 255, 255, 0.8))
          drop-shadow(-2px -2px 0 rgba(122, 143, 163, 0.1));
}

/* 第二个字 "夜" - 右偏移 + 暖色调 */
.title-composition .title-kanji:nth-child(3) {
  transform: translateX(30px);
  background: linear-gradient(
    to bottom,
    #4a5a6a 0%,
    #8b9aaa 50%,
    #4a5a6a 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(2px 2px 0 rgba(255, 255, 255, 0.8))
          drop-shadow(-2px -2px 0 rgba(212, 165, 165, 0.1));
}

/* hover 效果 - 第一个字 */
.title-composition .title-kanji:nth-child(1):hover {
  transform: translateX(-25px) scale(1.08);
  filter: drop-shadow(3px 3px 0 rgba(255, 255, 255, 0.9))
          drop-shadow(-3px -3px 0 rgba(122, 143, 163, 0.15))
          drop-shadow(0 6px 30px rgba(122, 143, 163, 0.4))
          drop-shadow(0 0 80px rgba(122, 143, 163, 0.3));
}

/* hover 效果 - 第二个字 */
.title-composition .title-kanji:nth-child(3):hover {
  transform: translateX(30px) scale(1.08);
  filter: drop-shadow(3px 3px 0 rgba(255, 255, 255, 0.9))
          drop-shadow(-3px -3px 0 rgba(212, 165, 165, 0.15))
          drop-shadow(0 6px 30px rgba(212, 165, 165, 0.4))
          drop-shadow(0 0 80px rgba(255, 192, 203, 0.3));
}

/* 竖线装饰 - 在第一个字和第二个字之间 */
.title-composition .side-vertical-line {
  width: 1px;
  height: 220px;
  background: linear-gradient(
    to bottom,
    rgba(122, 143, 163, 0.3) 0%,
    rgba(122, 143, 163, 0.6) 30%,
    rgba(212, 165, 165, 0.6) 70%,
    rgba(212, 165, 165, 0.3) 100%
  );
  align-self: flex-end;
  margin-right:130px;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 竖直副标题 - 在第二个字之后 */
.title-composition .side-subtitle-vertical {
  writing-mode: vertical-lr;
  text-orientation: upright;
  font-family: 'Cinzel', serif;
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 6px;
  color: rgba(227, 234, 243, 0.6);
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-self: flex-start;
  margin-left: 20px;
  margin-top: -20px;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(
      to bottom,
      #e6e8ec 0%,
      #d0e0ed 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle-letter {
  display: inline-block;
  transition: all 0.3s ease;
}

.subtitle-letter:hover {
  color: rgba(212, 165, 165, 0.85);
  transform: scale(1.1);
}

/* 背景切换时的装饰样式 */
.center-main-title.title-theme-1 .side-vertical-line,
.center-main-title.title-theme-2 .side-vertical-line,
.center-main-title.title-theme-3 .side-vertical-line {
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.6) 30%,
    rgba(255, 255, 255, 0.6) 70%,
    rgba(255, 255, 255, 0.3) 100%
  );
}

.center-main-title.title-theme-1 .side-subtitle-vertical,
.center-main-title.title-theme-2 .side-subtitle-vertical,
.center-main-title.title-theme-3 .side-subtitle-vertical {
  color: rgba(255, 255, 255, 0.75);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 背景切换时的标题文字样式 */
.center-main-title.title-theme-1 .title-kanji,
.center-main-title.title-theme-2 .title-kanji,
.center-main-title.title-theme-3 .title-kanji {
  filter: drop-shadow(2px 2px 0 rgba(255, 255, 255, 0.3))
          drop-shadow(0 4px 20px rgba(0, 0, 0, 0.4))
          drop-shadow(0 0 60px rgba(255, 255, 255, 0.3));
}


/* 英文标题 */
.title-english {
  font-size: 14px;
  letter-spacing: 10px;
  color: rgba(60, 60, 70, 0.65);
  margin: 0;
  font-family: 'Cinzel', serif;
  font-weight: 300;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.center-main-title.title-theme-1 .title-english,
.center-main-title.title-theme-2 .title-english,
.center-main-title.title-theme-3 .title-english {
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

/* 页面标记 */
.title-page-mark {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 15px 0;
}

.mark-text {
  font-size: 11px;
  letter-spacing: 3px;
  color: rgba(60, 60, 70, 0.5);
  font-family: 'Cinzel', serif;
  font-weight: 300;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.center-main-title.title-theme-1 .mark-text,
.center-main-title.title-theme-2 .mark-text,
.center-main-title.title-theme-3 .mark-text {
  color: rgba(255, 255, 255, 0.7);
}

.mark-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(60, 60, 70, 0.4);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.center-main-title.title-theme-1 .mark-dot,
.center-main-title.title-theme-2 .mark-dot,
.center-main-title.title-theme-3 .mark-dot {
  background: rgba(255, 255, 255, 0.6);
}

/* 装饰线 */
.title-decoration-top,
.title-decoration-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-line {
  width: 70px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(60, 60, 70, 0.35),
    transparent
  );
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.center-main-title.title-theme-1 .title-line,
.center-main-title.title-theme-2 .title-line,
.center-main-title.title-theme-3 .title-line {
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
}

.title-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(60, 60, 70, 0.45);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.center-main-title.title-theme-1 .title-dot,
.center-main-title.title-theme-2 .title-dot,
.center-main-title.title-theme-3 .title-dot {
  background: rgba(255, 255, 255, 0.65);
}

/* 左侧区域 - 30% */
.left-section {
  flex: 0 0 30%;
  position: relative;
  overflow: hidden;
}

.sky-background {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 背景层 - 使用叠加方式实现平滑过渡 */
.bg-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.bg-layer.active {
  opacity: 1;
}

/* 默认背景 - 白夜·黎明 (原始天空) */
.bg-layer.bg-default {
  background: linear-gradient(
    to bottom,
    #a8c5dd 0%,      /* 上: 空色 (天蓝) */
    #d4b5a8 50%,     /* 中: 灰櫻 (暖粉灰) */
    #c5d3e0 100%     /* 下: 水色 (淡蓝) */
  );
}

/* 卡片1背景 - 人間不信·春 (樱花季) */
.bg-layer.bg-1 {
  background: linear-gradient(
    to bottom,
    #dae7f0 0%,      /* 上: 暖色 - 淡樱灰粉 (低饱和) */
    #f7d3d2 50%,     /* 中: 暖色 - 灰樱色 (温柔的灰粉) */
    #dae7f0 100%     /* 下: 冷色 - 淡蓝灰 (春日薄雾天空) */
  );
}

/* 卡片2背景 - 思界者·夏 (夏日天空) */
.bg-layer.bg-2 {
  background: linear-gradient(
    to bottom,
    #e8d5b7 0%,      /* 上: 空色 (夏日蓝天) */
    #7db9de 50%,     /* 中: 勿忘草色 (明亮蓝) */
    #e8d5b7 100%     /* 下: 砂色 (夏日沙滩) */
  );
}

/* 卡片3背景 - 永遠回帰·冬 (雪夜) */
.bg-layer.bg-3 {
  background: linear-gradient(
    to bottom,
    #4a5a6a 0%,      /* 上: 藍鼠 (冬夜深蓝) */
    #8b9aaa 50%,     /* 中: 銀鼠 (银灰雪色) */
    #4a5a6a 100%     /* 下: 鼠色 (冬日灰蓝) */
  );
}

/* 云朵效果 - 添加到默认背景层 */
.bg-layer.bg-default::before {
  content: '';
  position: absolute;
  top: 10%;
  left: 20%;
  width: 300px;
  height: 150px;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  filter: blur(40px);
  animation: float 20s ease-in-out infinite;
}

.bg-layer.bg-default::after {
  content: '';
  position: absolute;
  top: 30%;
  right: 15%;
  width: 250px;
  height: 120px;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  filter: blur(35px);
  animation: float 25s ease-in-out infinite reverse;
}

/* 其他背景层也添加微妙的光效 */
.bg-layer.bg-1::before,
.bg-layer.bg-2::before,
.bg-layer.bg-3::before {
  content: '';
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  height: 200px;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  filter: blur(60px);
  animation: float 15s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, -20px);
  }
}

/* 左侧装饰线条 */
.deco-lines-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
}

.line-h {
  position: absolute;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: lineSlideH 8s ease-in-out infinite;
}

.line-h-1 {
  top: 15%;
  left: 8%;
  width: 120px;
}

.line-h-2 {
  bottom: 25%;
  right: 10%;
  width: 150px;
  animation-delay: 4s;
}

.line-v {
  position: absolute;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: lineSlideV 8s ease-in-out infinite;
}

.line-v-1 {
  top: 20%;
  left: 12%;
  height: 100px;
  animation-delay: 2s;
}

.line-v-2 {
  bottom: 15%;
  right: 15%;
  height: 80px;
  animation-delay: 6s;
}

@keyframes lineSlideH {
  0%, 100% {
    opacity: 0.3;
    transform: translateX(0);
  }
  50% {
    opacity: 0.6;
    transform: translateX(15px);
  }
}

@keyframes lineSlideV {
  0%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 0.6;
    transform: translateY(15px);
  }
}

/* 几何装饰元素 */
.geometric-deco {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
}

.geo-circle-outline {
  position: absolute;
  top: 30%;
  right: 8%;
  width: 80px;
  height: 80px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  animation: geoRotate 20s linear infinite;
}

.geo-square-outline {
  position: absolute;
  bottom: 20%;
  left: 10%;
  width: 50px;
  height: 50px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  transform: rotate(45deg);
  animation: geoFloat 12s ease-in-out infinite;
}

.geo-cross {
  position: absolute;
  top: 60%;
  left: 15%;
  width: 30px;
  height: 30px;
}

.geo-cross::before,
.geo-cross::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.25);
}

.geo-cross::before {
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  transform: translateY(-50%);
}

.geo-cross::after {
  top: 0;
  left: 50%;
  width: 1px;
  height: 100%;
  transform: translateX(-50%);
}

@keyframes geoRotate {
  0% {
    transform: rotate(0deg);
    opacity: 0.4;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    transform: rotate(360deg);
    opacity: 0.4;
  }
}

@keyframes geoFloat {
  0%, 100% {
    transform: rotate(45deg) translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: rotate(45deg) translateY(-15px);
    opacity: 0.7;
  }
}

/* 垂直标题 */
.title-vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 40px 0;
}

/* 标题装饰框线 */
.title-frame-lines {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  width: 150px;
  pointer-events: none;
}

.frame-line {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transition: all 0.8s ease;
}

.frame-top {
  top: -20px;
}

.frame-bottom {
  bottom: -20px;
}

.title-vertical.title-mode-1 .frame-line,
.title-vertical.title-mode-2 .frame-line,
.title-vertical.title-mode-3 .frame-line {
  width: 80px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
}

.main-title {
  font-size: 120px;
  font-weight: 300;
  letter-spacing: 30px;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  margin: 0;
  font-family: 'Noto Serif JP', serif;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.title-vertical.title-mode-1 .main-title,
.title-vertical.title-mode-2 .main-title,
.title-vertical.title-mode-3 .main-title {
  text-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  transform: scale(1.03);
}

.subtitle {
  font-size: 16px;
  letter-spacing: 8px;
  color: rgba(255, 255, 255, 0.8);
  margin: 40px 0;
  font-family: 'Cinzel', serif;
  font-weight: 300;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.title-vertical.title-mode-1 .subtitle,
.title-vertical.title-mode-2 .subtitle,
.title-vertical.title-mode-3 .subtitle {
  letter-spacing: 12px;
  color: rgba(255, 255, 255, 0.95);
}

.decorative-text {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 60px;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  letter-spacing: 10px;
}

.decorative-text span {
  display: inline-block;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.title-vertical.title-mode-1 .decorative-text span,
.title-vertical.title-mode-2 .decorative-text span,
.title-vertical.title-mode-3 .decorative-text span {
  transform: translateX(-10px);
  opacity: 0.95;
}

.decorative-text span:nth-child(1) {
  transition-delay: 0.1s;
}

.decorative-text span:nth-child(2) {
  transition-delay: 0.2s;
}

.decorative-text span:nth-child(3) {
  transition-delay: 0.3s;
}

/* 右侧区域 - 70% */
.right-section {
  flex: 0 0 70%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 60px;
  background: #f5f3f0;
  position: relative;
  z-index: 100;
  overflow-y: auto;
}

/* 右侧装饰线条 */
.deco-lines-right {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.right-line-h {
  position: absolute;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(200, 190, 180, 0.3),
    transparent
  );
  animation: rightLineFloat 10s ease-in-out infinite;
}

.right-line-h-1 {
  top: 20%;
  left: 5%;
  width: 100px;
}

.right-line-h-2 {
  bottom: 30%;
  right: 8%;
  width: 120px;
  animation-delay: 5s;
}

.right-line-v {
  position: absolute;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(200, 190, 180, 0.3),
    transparent
  );
  animation: rightLineFloat 10s ease-in-out infinite;
}

.right-line-v-1 {
  top: 15%;
  right: 12%;
  height: 90px;
  animation-delay: 3s;
}

@keyframes rightLineFloat {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.7;
  }
}

.card-container {
  display: flex;
  gap: 30px;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
  max-width: 100%;
}

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

/* 卡片边缘高光 */
.card-pattern {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.3) 0%,
    transparent 30%,
    transparent 70%,
    rgba(0, 0, 0, 0.03) 100%
  );
  pointer-events: none;
  z-index: 1;
  opacity: 0.5;
  transition: opacity 0.6s ease;
}

.minimal-card:hover .card-pattern {
  opacity: 0.8;
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

/* 标题分隔线 */
.title-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 25px 0;
}

.sep-line {
  width: 30px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(139, 125, 107, 0.3),
    transparent
  );
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.sep-circle {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(139, 125, 107, 0.4);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.minimal-card:hover .sep-line {
  width: 40px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(139, 125, 107, 0.6),
    transparent
  );
}

.minimal-card:hover .sep-circle {
  background: rgba(139, 125, 107, 0.7);
  transform: scale(1.5);
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
  .left-section {
    flex: 0 0 35%;
  }
  
  .right-section {
    flex: 0 0 65%;
    padding: 30px 40px;
  }
  
  .center-main-title {
    left: 35%;
  }
  
  .vertical-main-title {
    font-size: 120px;
    letter-spacing: 30px;
  }
  
  .minimal-card {
    width: 240px;
    height: 380px;
  }
}

@media (max-width: 1200px) {
  .minimalist-page {
    flex-direction: column;
  }

  .left-section {
    flex: 0 0 40vh;
    width: 100%;
  }

  .right-section {
    flex: 0 0 60vh;
    width: 100%;
    padding: 30px;
  }
  
  .center-main-title {
    display: none;
  }

  .card-container {
    flex-direction: row;
    gap: 20px;
    overflow-x: auto;
  }

  .minimal-card {
    width: 220px;
    height: 340px;
    flex-shrink: 0;
  }

  .main-title {
    font-size: 80px;
    letter-spacing: 20px;
  }
}

@media (max-width: 768px) {
  .main-title {
    font-size: 60px;
    letter-spacing: 15px;
  }

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


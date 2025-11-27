<template>
  <div class="container" @click="handleContainerClick" ref="vnContainer">
    <!-- 左侧菜单栏 -->
    <div class="side-menu" :class="{ open: isMenuOpen }">
      <div class="menu-header">
        <span class="menu-title">菜单</span>
        <button class="menu-close" @click.stop="toggleMenu">✕</button>
      </div>
      <div class="menu-items">
        <button class="menu-item" @click.stop="toggleAutoPlay">
          <span class="menu-text">{{ autoPlay ? '停止自动' : '自动播放' }}</span>
        </button>
        <button class="menu-item" @click.stop="skipToNext">
          <span class="menu-text">快进</span>
        </button>
        <button class="menu-item" @click.stop="previousPage">
          <span class="menu-text">后退</span>
        </button>
        <div class="menu-divider"></div>
        <div class="menu-section-title">章节跳转</div>
        <button 
          v-for="(page, index) in pages" 
          :key="index"
          class="menu-item chapter-item"
          :class="{ active: currentPage === index }"
          @click.stop="jumpToPage(index)"
        >
          <span class="chapter-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="chapter-title">{{ page.title }}</span>
        </button>
      </div>
    </div>

    <!-- 菜单开关按钮 -->
    <button class="menu-toggle" @click.stop="toggleMenu" :class="{ hidden: isMenuOpen }">
      <div class="hamburger-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>

    <!-- 装饰性角标 -->
    <div class="corner-decoration top-left"></div>
    <div class="corner-decoration top-right"></div>
    <div class="corner-decoration bottom-left"></div>
    <div class="corner-decoration bottom-right"></div>

    <!-- 日式装饰圆点 -->
    <div class="japanese-ornament top"></div>
    <div class="japanese-ornament bottom"></div>

    <!-- 图片区域 -->
    <div class="image-section">
      <img :src="currentPageData.image" alt="Scene" :class="{ active: imageLoaded }" @load="onImageLoad">
      <!-- 图片上的细线装饰 -->
      <div class="image-border"></div>
    </div>
    
    <!-- 文本区域 -->
    <div class="text-section">
      <!-- 左侧垂直标题 -->
      <div class="text-left">
        <div class="vertical-title">
          {{ currentPageData.title }}
          <span class="vertical-subtitle">{{ currentPageData.subtitle }}</span>
        </div>
      </div>

      <!-- 垂直分隔线 -->
      <div class="vertical-divider"></div>
      
      <!-- 右侧两栏文本 -->
      <div class="text-right page-transition">
        <!-- 微妙的纸张纹理覆盖层 -->
        <div class="paper-texture"></div>
        <div class="text-column" v-html="currentPageData.column1"></div>
        <div class="text-column" v-html="currentPageData.column2"></div>
      </div>
      
      <!-- 页码 -->
      <div class="page-indicator">{{ pageNumber }}</div>
      
      <!-- 导航提示 -->
      <div class="navigation-hint">点击继续</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 视觉小说数据
const pages = [
  {
    image: 'https://images.unsplash.com/photo-1618022325802-7e5e732d97a1?w=1600&h=900&fit=crop',
    title: 'EVANGELION',
    subtitle: 'NEON GENESIS',
    column1: `是一部日本机甲动画电视剧，由<strong>Hideaki Anno</strong>执导，由Gainax和Tatsunoko Production制作，于1995年3月至1996年播出。

演员包括Megumi Ogata、Megumi Hayashibara、Kotono Mitsuishi、Yuko Miyamura和Akira Ishida。音乐由Shiro Sagisu创作。

《新世纪福音战士》获得了广泛好评，但也引发了争议。尤其是最后两集因探讨了<strong>人类存在的终结</strong>而备受争议,从不同视角展现结局。`,
    column2: `《新世纪福音战士》的故事设定在第二次冲击（特别是东京-3这座强化城市）发生十五年后。

主角是Shinji，一个被父亲Gendo召唤到影子组织Nerv的少年，目的是驾驶一台名为"Evangelion"的巨型机甲，与被称为<strong>Angels</strong>的生命体作战。

该系列探讨了Evangelion飞行员和成员的经历和情感，因为他们试图阻止Angels引发更多灾难。在这个过程中，他们被要求理解灾难的最终原因以及人类行为的动机。`
  },
  {
    image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1600&h=900&fit=crop',
    title: '使徒来袭',
    subtitle: 'ANGEL ATTACK',
    column1: `第三使徒突然出现在东京-3市郊。联合国军队动用了所有常规武器，包括N²地雷，但都无法对其造成任何伤害。

面对这个未知的敌人，人类第一次感受到了真正的无力感。所有的科技，所有的武器，在这个神秘生命体面前都变得毫无意义。

<strong>NERV</strong>组织启动了紧急协议，准备出动人类最后的希望——EVA初号机。`,
    column2: `碇真嗣被父亲召唤到NERV总部时，他并不知道等待自己的是什么。在地下深处，他第一次见到了那个紫色的巨人。

"驾驶它，"父亲冷漠地说，"不然就让绫波丽带着伤再来一次。"

真嗣犹豫了。他不明白为什么是自己，为什么要战斗。但当他看到重伤的绫波丽时，他做出了决定。就在那一刻，一个十四岁少年的命运被永远改变了。`
  },
  {
    image: 'https://images.unsplash.com/photo-1635776062043-223faf322554?w=1600&h=900&fit=crop',
    title: '暴走',
    subtitle: 'BERSERKER',
    column1: `初号机的第一次战斗是一场灾难。真嗣没有接受过任何训练，对EVA的操作一无所知。使徒轻易地击倒了初号机，系统不断发出刺耳的警报。

<strong>同步率崩溃。</strong>神经连接中断。生命维持系统失效。

葛城美里在指挥中心焦急地下达着命令，但一切都太迟了。就在所有人以为这是终结的时候——`,
    column2: `初号机动了。

不，那不是真嗣在操纵。机体自己动了起来，以完全超越人类反应速度的动作躲开了使徒的攻击。然后，它发出了野兽般的咆哮。

<strong>暴走状态。</strong>

紫色的巨人以狂暴的姿态扑向使徒，双手撕开了AT力场，将使徒残忍地撕成碎片。驾驶舱内，真嗣已经昏迷。没有人知道刚才到底发生了什么。

这是人类对使徒的第一次胜利，但代价是看到了EVA真正的面目——它并非只是机器。`
  },
  {
    image: 'https://images.unsplash.com/photo-1579566346927-c68383817a25?w=1600&h=900&fit=crop',
    title: '日常',
    subtitle: 'DAILY LIFE',
    column1: `战斗之后，真嗣开始了在东京-3的新生活。他住进了葛城美里的公寓，开始上学，试图过正常的中学生活。

早晨的课程，午后的训练，傍晚的同步测试。表面上看，这似乎是普通的日子，但每个人都知道，<strong>下一次使徒来袭只是时间问题。</strong>

在学校里，同学们既羡慕又畏惧他。毕竟，他是驾驶EVA拯救了城市的英雄。`,
    column2: `但真嗣并不觉得自己是英雄。他只是一个被命运裹挟的少年，被迫坐进那个可怕的机器里。

他遇到了另一位驾驶员——<strong>绫波丽</strong>。这个沉默寡言的少女驾驶着零号机，全身都是绷带。她很少说话，眼神总是空洞而遥远。

还有新来的转学生，<strong>明日香</strong>。这个自信而强势的女孩驾驶着从德国运来的二号机。她骄傲地宣称自己是世界上最优秀的驾驶员。

三个少年，三台EVA，三种不同的命运，在这座城市里交织在一起。`
  },
  {
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=900&fit=crop',
    title: '真相',
    subtitle: 'THE TRUTH',
    column1: `在NERV总部的最深处，在那些禁止进入的区域里，隐藏着这一切的真相。

<strong>人类补完计划。</strong>

这是碇源堂和Seele组织的终极目标。使徒的来袭，EVA的开发，少年们的牺牲——这一切都只是这个宏大计划的一部分。

EVA并非人类制造的机器，而是从第一使徒<strong>Adam</strong>复制而来的人造生命体。每一台EVA都有自己的灵魂，都是活着的。`,
    column2: `而初号机的灵魂，正是真嗣的母亲——<strong>碇唯</strong>。

这就是为什么只有真嗣能够驾驶它。这就是为什么初号机会暴走来保护他。这就是那个紫色巨人令人不安的真相。

真嗣开始质疑一切。父亲的目的，NERV的真实面目，以及自己战斗的意义。

<strong>人类真的值得拯救吗？</strong>

这个问题，将在最后的使徒降临时得到答案。而那个答案，可能比使徒本身更加可怕。`
  },
  {
    image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1600&h=900&fit=crop',
    title: '未完待续',
    subtitle: 'TO BE CONTINUED',
    column1: `故事还远未结束。

每一次战斗都让真嗣更加接近真相，但同时也让他更加迷茫。在这个复杂的世界里，没有简单的答案，没有绝对的正义。

人与人之间的理解是如此困难。每个人都被困在自己的内心深处，无法真正触及他人。这种绝望的孤独，比使徒的威胁更加可怕。

<strong>但正是这种努力，定义了我们作为人类的存在。</strong>`,
    column2: `真嗣将继续战斗，不是因为他想成为英雄，而是因为他别无选择。绫波丽将继续执行命令，尽管她开始思考自己存在的意义。明日香将继续证明自己，尽管她的自信正在一点点崩溃。

使徒还会继续出现。秘密还在不断揭开。而人类补完计划，正在一步步接近完成。

在那个时刻到来之前，这些少年们将守护这座城市，守护人类，守护彼此。

<strong>故事的结局，还未到来...</strong>`
  }
];

const currentPage = ref(0);
const imageLoaded = ref(false);
const vnContainer = ref(null);
const isMenuOpen = ref(false);
const autoPlay = ref(false);
let autoPlayTimer = null;

// 计算属性
const currentPageData = computed(() => pages[currentPage.value]);
const pageNumber = computed(() => String(currentPage.value + 1).padStart(2, '0'));

// 方法
const onImageLoad = () => {
  imageLoaded.value = true;
};

const nextPage = () => {
  imageLoaded.value = false;
  currentPage.value = (currentPage.value + 1) % pages.length;
};

const previousPage = () => {
  imageLoaded.value = false;
  currentPage.value = (currentPage.value - 1 + pages.length) % pages.length;
  closeMenu();
};

const jumpToPage = (index) => {
  imageLoaded.value = false;
  currentPage.value = index;
  closeMenu();
};

const skipToNext = () => {
  nextPage();
  closeMenu();
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const handleContainerClick = () => {
  if (isMenuOpen.value) {
    closeMenu();
  } else {
    nextPage();
  }
};

const toggleAutoPlay = () => {
  autoPlay.value = !autoPlay.value;
  
  if (autoPlay.value) {
    // 启动自动播放，每5秒翻页
    autoPlayTimer = setInterval(() => {
      nextPage();
    }, 5000);
  } else {
    // 停止自动播放
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }
};

const handleKeydown = (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
    if (!isMenuOpen.value) {
      nextPage();
    }
  } else if (e.key === 'ArrowLeft') {
    if (!isMenuOpen.value) {
      previousPage();
    }
  } else if (e.key === 'Escape') {
    closeMenu();
  }
};

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  imageLoaded.value = true;
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  // 清理自动播放定时器
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
  }
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  font-family: 'Yu Mincho', 'YuMincho', 'Hiragino Mincho ProN', 'Hiragino Mincho Pro', 'Songti SC', 'SimSun', serif;
  background: linear-gradient(to bottom, #fdfcfb 0%, #f7f6f4 100%);
  min-height: 100vh;
  cursor: pointer;
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 图片区域 - 占据上半部分 */
.image-section {
  width: 100%;
  height: 50vh;
  background: #f5f5f5;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.03);
}

/* 图片边框装饰 */
.image-border {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(0, 0, 0, 0.02);
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.image-section img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1.2s ease;
  filter: saturate(0.85) brightness(1.05);
}

.image-section img.active {
  opacity: 0.95;
}

/* 文本区域 - 占据下半部分 */
.text-section {
  width: 100%;
  height: 50vh;
  display: flex;
  position: relative;
  background: transparent;
}

/* 纸张纹理覆盖层 */
.paper-texture {
  position: absolute;
  inset: 0;
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.003) 2px,
      rgba(0, 0, 0, 0.003) 4px
    );
  pointer-events: none;
  opacity: 0.5;
}

/* 左侧 - 垂直标题 */
.text-left {
  width: 160px;
  background: rgba(245, 240, 235, 0.3);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  border-right: 1px solid rgba(0, 0, 0, 0.03);
}

/* 垂直分隔线 */
.vertical-divider {
  width: 1px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.06) 20%,
    rgba(0, 0, 0, 0.06) 80%,
    transparent 100%
  );
  position: relative;
}

.vertical-divider::before,
.vertical-divider::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 6px;
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  transform: translateX(-50%);
}

.vertical-divider::before {
  top: 60px;
}

.vertical-divider::after {
  bottom: 60px;
}

.vertical-title {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 1.4em;
  font-weight: 300;
  color: rgba(90, 80, 70, 0.65);
  letter-spacing: 0.8em;
  line-height: 1.8;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.vertical-subtitle {
  writing-mode: vertical-rl;
  font-size: 0.7em;
  font-weight: 200;
  letter-spacing: 0.5em;
  margin-left: 20px;
  opacity: 0.4;
  color: rgba(120, 100, 80, 0.5);
}

/* 右侧 - 两栏文本 */
.text-right {
  flex: 1;
  display: flex;
  padding: 70px 120px 70px 90px;
  gap: 120px;
  background: transparent;
  position: relative;
}

.text-column {
  flex: 1;
  color: rgba(70, 65, 60, 0.8);
  font-size: 1em;
  line-height: 2.5;
  text-align: justify;
  letter-spacing: 0.1em;
  font-weight: 300;
  position: relative;
}

.text-column :deep(p) {
  margin-bottom: 2em;
  text-indent: 2em;
}

.text-column :deep(strong) {
  color: rgba(60, 60, 60, 0.85);
  font-weight: 400;
  position: relative;
}

/* 页码指示器 */
.page-indicator {
  position: absolute;
  bottom: 50px;
  right: 80px;
  font-size: 2.5em;
  font-weight: 200;
  color: rgba(0, 0, 0, 0.08);
  letter-spacing: 0.15em;
  font-family: 'Georgia', 'Times New Roman', serif;
}

/* 导航提示 */
.navigation-hint {
  position: absolute;
  top: 35px;
  right: 80px;
  font-size: 0.65em;
  color: rgba(0, 0, 0, 0.25);
  letter-spacing: 0.3em;
  font-weight: 300;
  animation: fadeInOut 4s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

/* 页面过渡动画 */
.page-transition {
  animation: fadeIn 1.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 日式装饰圆点 */
.japanese-ornament {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  pointer-events: none;
  z-index: 10;
}

.japanese-ornament::before,
.japanese-ornament::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
}

.japanese-ornament::before {
  left: -12px;
}

.japanese-ornament::after {
  right: -12px;
}

.japanese-ornament.top {
  top: 40px;
}

.japanese-ornament.bottom {
  bottom: 40px;
}

/* 装饰性细线 */
.corner-decoration {
  position: absolute;
  width: 35px;
  height: 35px;
  border: 0.5px solid rgba(100, 90, 80, 0.08);
  pointer-events: none;
  opacity: 0.6;
}

.corner-decoration.top-left {
  top: 20px;
  left: 20px;
  border-right: none;
  border-bottom: none;
}

.corner-decoration.top-right {
  top: 20px;
  right: 20px;
  border-left: none;
  border-bottom: none;
}

.corner-decoration.bottom-left {
  bottom: 20px;
  left: 20px;
  border-right: none;
  border-top: none;
}

.corner-decoration.bottom-right {
  bottom: 20px;
  right: 20px;
  border-left: none;
  border-top: none;
}

/* 菜单开关按钮 */
.menu-toggle {
  position: fixed;
  top: 30px;
  left: 30px;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(100, 90, 80, 0.1);
  border-radius: 50%;
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: scale(1.05);
}

.menu-toggle.hidden {
  opacity: 0;
  pointer-events: none;
}

.hamburger-icon {
  width: 20px;
  height: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hamburger-icon span {
  width: 100%;
  height: 2px;
  background: rgba(70, 65, 60, 0.7);
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* 侧边菜单 */
.side-menu {
  position: fixed;
  top: 0;
  left: -320px;
  width: 320px;
  height: 100vh;
  background: linear-gradient(to bottom, rgba(250, 248, 245, 0.98), rgba(245, 243, 240, 0.98));
  border-right: 1px solid rgba(100, 90, 80, 0.1);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
  z-index: 1001;
  transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.side-menu.open {
  left: 0;
}

.menu-header {
  padding: 30px;
  border-bottom: 1px solid rgba(100, 90, 80, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.3);
}

.menu-title {
  font-size: 1.2em;
  font-weight: 300;
  color: rgba(70, 65, 60, 0.8);
  letter-spacing: 0.3em;
}

.menu-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 1.5em;
  color: rgba(70, 65, 60, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-close:hover {
  background: rgba(100, 90, 80, 0.1);
  color: rgba(70, 65, 60, 0.8);
  transform: rotate(90deg);
}

.menu-items {
  padding: 20px 0;
}

.menu-item {
  width: 100%;
  padding: 16px 30px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(70, 65, 60, 0.75);
  font-size: 0.95em;
  font-family: inherit;
  letter-spacing: 0.08em;
  text-align: left;
}

.menu-item:hover {
  background: rgba(100, 90, 80, 0.05);
  color: rgba(70, 65, 60, 0.95);
  padding-left: 35px;
}

.menu-text {
  flex: 1;
  font-weight: 300;
}

.menu-divider {
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(100, 90, 80, 0.1) 50%,
    transparent
  );
  margin: 20px 30px;
}

.menu-section-title {
  padding: 20px 30px 10px;
  font-size: 0.75em;
  color: rgba(70, 65, 60, 0.5);
  letter-spacing: 0.3em;
  font-weight: 300;
  text-transform: uppercase;
}

.chapter-item {
  padding: 12px 30px;
  gap: 12px;
}

.chapter-item.active {
  background: rgba(100, 90, 80, 0.08);
  color: rgba(70, 65, 60, 1);
  border-left: 3px solid rgba(100, 90, 80, 0.4);
}

.chapter-item:hover {
  padding-left: 30px;
}

.chapter-item.active:hover {
  padding-left: 30px;
}

.chapter-number {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 0.9em;
  color: rgba(100, 90, 80, 0.4);
  min-width: 28px;
}

.chapter-item.active .chapter-number {
  color: rgba(100, 90, 80, 0.7);
  font-weight: 500;
}

.chapter-title {
  flex: 1;
  font-size: 0.9em;
  font-weight: 300;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式设计 */
@media (max-width: 1000px) {
  .text-right {
    flex-direction: column;
    gap: 40px;
    padding: 50px 60px;
  }
  
  .vertical-title {
    font-size: 1.2em;
  }
  
  .page-indicator {
    font-size: 2em;
    bottom: 30px;
    right: 60px;
  }
}

@media (max-width: 600px) {
  .container {
    height: auto;
    min-height: 100vh;
  }

  .image-section {
    height: 40vh;
    min-height: 300px;
  }

  .text-section {
    height: auto;
    flex-direction: column;
    min-height: 60vh;
  }
  
  .text-left {
    width: 100%;
    height: 70px;
    padding: 0;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
  }
  
  .vertical-title {
    writing-mode: horizontal-tb;
    font-size: 1em;
    letter-spacing: 0.5em;
  }
  
  .vertical-subtitle {
    writing-mode: horizontal-tb;
    margin-left: 15px;
    letter-spacing: 0.3em;
  }

  .text-right {
    padding: 40px 30px;
    gap: 30px;
  }

  .text-column {
    font-size: 0.95em;
    line-height: 2.3;
  }

  .page-indicator {
    font-size: 1.8em;
    bottom: 20px;
    right: 30px;
  }

  .navigation-hint {
    top: 20px;
    right: 30px;
    font-size: 0.6em;
  }
}
</style>

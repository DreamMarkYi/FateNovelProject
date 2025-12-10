<template>
  <div class="minimalist-page"
       :class="{
         'page-day-mode': isFullLeft,
         'page-night-mode': isFullRight
       }">

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
        <filter id="textNoiseFilterSubtle" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="3"
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
              opacity="0.12"/>
        </filter>
      </defs>
    </svg>

    <div class="center-main-title"
         :class="['title-theme-' + currentBg, { 'animate-from-right-title': fromExtremeRight }]"
         :style="{ left: titlePosition + '%' }">

      <div v-if="isFullLeft" class="extreme-content left-extreme">
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

      <div v-else-if="isFullRight" class="extreme-content right-extreme">
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

      <div v-else class="title-composition" :class="{ 'animate-from-right-title': fromExtremeRight }">
        <span class="title-kanji">白</span>

        <div class="side-vertical-line">
          <div class="side-subtitle-vertical">
            <span class="subtitle-letter">MIDNIGHT</span>
          </div>
        </div>

        <span class="title-kanji">夜</span>
      </div>

    </div>

    <div class="left-section"
         :style="{ width: leftWidth + '%' }"
         :class="{
           'section-hidden': isFullRight,
           'section-solid-bg': leftBgMode === 'solid',
           'animate-from-right-section': fromExtremeRight
         }">
      <div class="sky-background"
           :class="{ 'bg-solid': leftBgMode === 'solid' }"
           :style="leftBgMode !== 'solid' ? { backgroundPosition: leftBgPosition + '% 50%' } : {}">
        <div class="bg-layer bg-default" :class="{ active: currentBg === 0 }"></div>
        <div class="bg-layer bg-1" :class="{ active: currentBg === 1 }"></div>
        <div class="bg-layer bg-2" :class="{ active: currentBg === 2 }"></div>
        <div class="bg-layer bg-3" :class="{ active: currentBg === 3 }"></div>

        <div class="deco-lines-left">
          <div class="line-h line-h-1"></div>
          <div class="line-h line-h-2"></div>
          <div class="line-v line-v-1"></div>
          <div class="line-v line-v-2"></div>
        </div>

        <div class="geometric-deco">
          <div class="geo-circle-outline"></div>
          <div class="geo-square-outline"></div>
          <div class="geo-cross"></div>
        </div>

        <div v-if = "leftBgMode !== 'solid'" class="title-vertical" :class="'title-mode-' + currentBg">
          <div class="title-frame-lines">
            <span class="frame-line frame-top"></span>
            <span class="frame-line frame-bottom"></span>
          </div>
          <p class="subtitle">—Midnight Sun—</p>
        </div>

        <div class="left-card-container"
             v-if="leftBgMode === 'solid'"
             :class="{ 'cards-fading': leftCardsFading }">
          <MinimalCard
              v-if="leftCards[0].visible"
              :key="`left-card1-${leftCards[0].key}`"
              ref="leftCard1Ref"
              number="L1"
              title="L E F T 1"
              text="左　侧　之　一"
              subtitle="Left Card One"
              season="春"
              route="/blue"
              @mouseenter="currentBg = 1"
              @mouseleave="currentBg = 0"
              @destroyed="removeLeftCard(0)"
          />

          <MinimalCard
              v-if="leftCards[1].visible"
              :key="`left-card2-${leftCards[1].key}`"
              ref="leftCard2Ref"
              number="L2"
              title="L E F T 2"
              text="左　侧　之　二"
              subtitle="Left Card Two"
              season="夏"
              route="/sowaka"
              @mouseenter="currentBg = 2"
              @mouseleave="currentBg = 0"
              @destroyed="removeLeftCard(1)"
          />

          <MinimalCard
              v-if="leftCards[2].visible"
              :key="`left-card3-${leftCards[2].key}`"
              ref="leftCard3Ref"
              number="L3"
              title="L E F T 3"
              text="左　侧　之　三"
              subtitle="Left Card Three"
              season="秋"
              route="/chapters"
              @mouseenter="currentBg = 3"
              @mouseleave="currentBg = 0"
              @destroyed="removeLeftCard(2)"
          />
        </div>
      </div>
    </div>

    <div class="divider"
         :class="{
           'edge-left': isFullLeft,
           'edge-right': isFullRight,
           transitioning: isTransitioning
         }"
         :style="{ left: leftWidth + '%' }">
      <div class="divider-handle">
        <span class="handle-line"></span>

        <div class="button-group" v-if="!isFullLeft && !isFullRight">
          <button
              class="nav-button nav-button-left"
              @mousedown.stop="navigateLeft"
              title="切换到左侧模式">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <button
              class="nav-button nav-button-right"
              @mousedown.stop="navigateRight"
              title="切换到右侧模式">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <button
            class="nav-button nav-button-single"
            @mousedown.stop="navigateRight"
            v-if="isFullLeft"
            title="返回">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button
            class="nav-button nav-button-single"
            @mousedown.stop="navigateLeft"
            v-if="isFullRight"
            title="返回">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>


    <div class="right-section"
         :style="{ width: (100 - leftWidth) + '%' }"
         :class="{
           'section-hidden': isFullLeft,
           'section-fullscreen': isFullRight,
           'section-gradient-bg': rightBgMode === 'gradient',
           'animate-from-right-section': fromExtremeRight
         }">

      <div class="sky-background"
           :class="{ 'bg-solid': rightBgMode === 'solid' }"
           :style="rightBgMode !== 'solid' ? { backgroundPosition: rightBgPosition + '% 50%' } : {}">
        <div class="bg-layer bg-default2" :class="{ active: currentBg === 0 }"></div>
        <div class="bg-layer bg-4" :class="{ active: currentBg === 1 }"></div>
        <div class="bg-layer bg-5" :class="{ active: currentBg === 2 }"></div>
        <div class="bg-layer bg-6" :class="{ active: currentBg === 3 }"></div>

        <div class="deco-lines-right">
          <div class="right-line-h right-line-h-1"></div>
          <div class="right-line-h right-line-h-2"></div>
          <div class="right-line-v right-line-v-1"></div>
        </div>

        <div v-if="rightBgMode !== 'solid'" class="title-vertical" :class="'title-mode-' + currentBg">
          <div class="title-frame-lines">
            <span class="frame-line frame-top"></span>
            <span class="frame-line frame-bottom"></span>
          </div>
          <p class="subtitle">—Midnight Sun—</p>
        </div>



        <div class="card-container"  v-if="rightBgMode === 'solid'"
             :class="{ 'cards-fading': rightCardsFading }">
          <MinimalCard
              v-if="cards[0].visible"
              :key="`card1-${cards[0].key}`"
              ref="card1Ref"
              number="01"
              title="H O 1"
              text="人　間　不　信"
              subtitle="Distrust of Humanity"
              season="春"
              route="/"
              @mouseenter="currentBg = 1"
              @mouseleave="currentBg = 0"
              @destroyed="removeCard(0)"
          />

          <MinimalCard
              v-if="cards[1].visible"
              :key="`card2-${cards[1].key}`"
              ref="card2Ref"
              number="02"
              title="H O 2"
              text="思　界　者"
              subtitle="Thinker of Realms"
              season="夏"
              route="/cards"
              @mouseenter="currentBg = 2"
              @mouseleave="currentBg = 0"
              @destroyed="removeCard(1)"
          />

          <MinimalCard
              v-if="cards[2].visible"
              :key="`card3-${cards[2].key}`"
              ref="card3Ref"
              number="03"
              title="H O 3"
              text="永　遠　回　帰"
              subtitle="Eternal Recurrence"
              season="冬"
              route="/sowaka"
              @mouseenter="currentBg = 3"
              @mouseleave="currentBg = 0"
              @destroyed="removeCard(2)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import MinimalCard from '@/components/MinimalCard.vue';
import SowakaNavigation from "@/components/sowaka/SowakaNavigation.vue";
import {useSowakaPage} from "@/composables/useSowakaPage.js";

// 接收外部参数，控制初始状态
const props = defineProps({
  // 'day' = 极昼 (0%), 'night' = 极夜 (100%), 'default' = 默认 (25%)
  initialState: {
    type: String,
    default: 'night' // <--- 默认为极夜
  }
});

const currentBg = ref(0);

// 根据 prop 计算初始宽度和模式
const getInitialState = () => {
  if (props.initialState === 'day') {
    return { width: 0, mode: 'extreme-left' };
  } else if (props.initialState === 'night') {
    return { width: 100, mode: 'extreme-right' };
  } else if (props.initialState === 'default') {
    return { width: 25, mode: 'left' };
  }
  // 兜底逻辑
  return { width: 100, mode: 'extreme-right' };
};

const initState = getInitialState();

// 初始化状态
const leftWidth = ref(initState.width);
const currentMode = ref(initState.mode);

// 移除了 isDragging, dragStartX, dragStartWidth 相关变量

const isTransitioning = ref(false);
const {mobileMenuOpen, toggleMobileMenu , scrollToSection} = useSowakaPage();
const fromExtremeRight = ref(false); // 是否从极夜模式返回

// 卡片状态（使用 key 来强制重新生成）
const cards = ref([
  { visible: true, key: 0 },
  { visible: true, key: 0 },
  { visible: true, key: 0 }
]);

// 左侧卡片状态
const leftCards = ref([
  { visible: false, key: 0 },
  { visible: false, key: 0 },
  { visible: false, key: 0 }
]);

// 卡片引用
const card1Ref = ref(null);
const card2Ref = ref(null);
const card3Ref = ref(null);

// 左侧卡片引用
const leftCard1Ref = ref(null);
const leftCard2Ref = ref(null);
const leftCard3Ref = ref(null);

// 是否已触发燃烧
const hasBurned = ref(false);

// 卡片淡出状态控制
const rightCardsFading = ref(false);
const leftCardsFading = ref(false);

// 背景模式控制
const leftBgMode = ref('gradient');
const rightBgMode = ref('solid');

// 计算标题位置（跟随分割线）
const titlePosition = computed(() => leftWidth.value);

// 计算左侧背景图片位置（蒙版效果）
const leftBgPosition = computed(() => {
  const maxPosition = 66.67;
  const position = (leftWidth.value / 100) * maxPosition;
  return Math.max(0, Math.min(maxPosition, position));
});

// 计算右侧背景图片位置
const rightBgPosition = computed(() => {
  const maxPosition = 66.67;
  const position = (leftWidth.value / 100) * maxPosition;
  return Math.max(0, Math.min(maxPosition, position));
});

// 判断是否完全拖到左边或右边（极昼/极夜模式）
const isFullLeft = computed(() => leftWidth.value <= 2);
const isFullRight = computed(() => leftWidth.value >= 98);

// 移除了 startDrag, onDrag, stopDrag 函数

// 移除卡片
const removeCard = (index) => {
  cards.value[index].visible = false;
  // 重置背景
  if (currentBg.value === index + 1) {
    currentBg.value = 0;
  }
};

// 移除左侧卡片
const removeLeftCard = (index) => {
  leftCards.value[index].visible = false;
  if (currentBg.value === index + 1) {
    currentBg.value = 0;
  }
};

// 触发所有卡片燃烧
const burnAllCards = () => {
  if (hasBurned.value) return; // 防止重复触发
  hasBurned.value = true;

  // 同时触发三张卡片的燃烧动画
  const cardRefs = [card1Ref.value, card2Ref.value, card3Ref.value];
  cardRefs.forEach((cardRef) => {
    if (cardRef && cardRef.startDissolve) {
      cardRef.startDissolve();
    }
  });
};
// 显示左侧卡片
const showLeftCards = async () => {
  leftCards.value.forEach((card) => {
    card.visible = true;
  });

  await nextTick();

  leftCards.value.forEach((card) => {
    card.key += 1;
  });

  // 添加淡入动画
  setTimeout(() => {
    const cardElements = document.querySelectorAll('.left-card-container .minimal-card');
    cardElements.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 200 * (index + 1));
    });
  }, 50);
};

// 隐藏左侧卡片
const hideLeftCards = () => {
  leftCards.value.forEach((card) => {
    card.visible = false;
  });
};
const hideRightCards = () => {
  cards.value.forEach((card) => {
    card.visible = false;
  });
};

// 显示右侧卡片
const showRightCards = async () => {
  cards.value.forEach((card) => {
    card.visible = true;
  });

  await nextTick();

  cards.value.forEach((card) => {
    card.key += 1;
  });

  // 添加淡入动画
  setTimeout(() => {
    const cardElements = document.querySelectorAll('.card-container .minimal-card');
    cardElements.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }, 50);
};

// 监听分割线位置，处理各种效果
watch(leftWidth, (newWidth) => {
  // 使用25%和75%作为分界线
  if (newWidth >= 50) {
    // 大于等于50%：左边显示卡牌，右边显示颜色（左侧模式）
    leftCardsFading.value = false;
    rightCardsFading.value = true;

    leftBgMode.value = 'solid';
    rightBgMode.value = 'gradient';

    if (!leftCards.value[0].visible) {
      showLeftCards();
    }
    hideRightCards();
  } else {
    // 小于50%：右边显示卡牌，左边显示颜色（右侧模式）
    leftCardsFading.value = true;
    rightCardsFading.value = false;

    leftBgMode.value = 'gradient';
    rightBgMode.value = 'solid';

    if (!cards.value[0].visible) {
      showRightCards();
    }
    hideLeftCards();
  }
}, { immediate: true });

// 添加卡片淡入动画
const addCardFadeInAnimation = () => {
  if (isFullLeft.value || isFullRight.value) return;

  nextTick(() => {
    const selector = leftWidth.value >= 50 ? '.left-card-container .minimal-card' : '.card-container .minimal-card';
    const cardElements = document.querySelectorAll(selector);
    cardElements.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 200 * (index + 1));
    });
  });
};


// 向左导航函数
const navigateLeft = () => {
  if (isTransitioning.value) return;

  isTransitioning.value = true;
  if(leftWidth.value == 75)
  {
    currentMode.value = 'left';
    setTimeout(() => {
      leftWidth.value = 25;
      setTimeout(() => {
        isTransitioning.value = false;
      }, 600);
    }, 50);
  }
  else if(leftWidth.value == 25)
  {
    setTimeout(() => {
      leftWidth.value = 0;
      setTimeout(() => {
        isTransitioning.value = false;
      }, 600);
    }, 0);
  }
  else if(leftWidth.value == 100)
  {
    currentMode.value = 'right';
    fromExtremeRight.value = true;
    setTimeout(() => {
      leftWidth.value = 75;
      setTimeout(() => {
        isTransitioning.value = false;
        fromExtremeRight.value = false;
      }, 1000);
    }, 50);
  }
};

// 向右导航函数
const navigateRight = () => {
  if (isTransitioning.value) return;

  isTransitioning.value = true;

  if(leftWidth.value == 25)
  {
    currentMode.value = 'right';
    setTimeout(() => {
      leftWidth.value = 75;
      setTimeout(() => {
        isTransitioning.value = false;
      }, 600);
    }, 50);
  }
  else if(leftWidth.value == 75)
  {
    setTimeout(() => {
      leftWidth.value = 100;
      setTimeout(() => {
        isTransitioning.value = false;
      }, 600);
    }, 50);
  }
  else if(leftWidth.value == 0)
  {
    currentMode.value = 'left';
    setTimeout(() => {
      leftWidth.value = 25;
      setTimeout(() => {
        isTransitioning.value = false;
      }, 600);
    }, 50);
  }

};



onMounted(() => {
  // 仅在非极端模式下触发初始动画
  if (!isFullLeft.value && !isFullRight.value) {
    addCardFadeInAnimation();
  }

  // 移除了全局拖拽事件监听 (mousemove, mouseup)
});
</script>

<style scoped>
/* SVG 滤镜容器 - 隐藏但保持可用 */
.noise-filter-svg {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

.minimalist-page {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f5f3f0;
  position: relative;
  transition: background 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 昼之模式 - 完全拖到左边 */
.minimalist-page.page-day-mode {
  background-image: url('/fullNight_BG_HighResolution.png'); /* 请确保图片存在于public目录下 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 夜之模式 - 完全拖到右边 */
.minimalist-page.page-night-mode {
  background-image: url('/extreme-night.png'); /* 请确保图片存在于public目录下 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 夜空背景从左往右扫入 */
.minimalist-page.page-night-mode::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* 这里的图片必须和 page-night-mode 的背景一致 */
  background-image: url('/fullNight_BG_HighResolution.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  animation: nightSweep 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  z-index: 0;
}

@keyframes nightSweep {
  0% {
    clip-path: inset(0 100% 0 0);
  }
  100% {
    clip-path: inset(0 0 0 0);
  }
}

/* 星空效果 */
.minimalist-page.page-night-mode::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
      radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.8), transparent),
      radial-gradient(2px 2px at 60% 70%, rgba(255, 255, 255, 0.6), transparent),
      radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.7), transparent),
      radial-gradient(1px 1px at 80% 10%, rgba(255, 255, 255, 0.5), transparent),
      radial-gradient(2px 2px at 90% 60%, rgba(255, 255, 255, 0.6), transparent),
      radial-gradient(1px 1px at 33% 80%, rgba(255, 255, 255, 0.4), transparent),
      radial-gradient(1px 1px at 15% 60%, rgba(255, 255, 255, 0.5), transparent);
  background-size: 200% 200%;
  animation: starsFloat 60s ease-in-out infinite, starsFadeIn 1.2s ease 0.4s forwards;
  opacity: 0;
  pointer-events: none;
  z-index: 1;
}

@keyframes starsFloat {
  0%, 100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
}

@keyframes starsFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.minimalist-page.page-night-mode .left-section {
  width: 100% !important;
  opacity: 1 !important;
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
  transition: right 0.6s cubic-bezier(0.4, 0, 0.2, 1), all 0.8s cubic-bezier(0.4, 0, 0.2, 1);

}

/* 当在极端状态时，标题居中显示 */
.page-night-mode .center-main-title,
.page-day-mode .center-main-title {
  left: 50% !important;
}

/* 极端状态的内容样式 */
.extreme-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 白昼标题淡入 */
.left-extreme {
  animation: dayTitleFadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

@keyframes dayTitleFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 永夜标题从左往右滑入 */
.right-extreme {
  animation: nightTitleSlideIn 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
  opacity: 0;
}

@keyframes nightTitleSlideIn {
  from {
    opacity: 0;
    transform: translateX(-100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.extreme-page-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.extreme-title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.extreme-title {
  font-size: 120px !important;
  font-weight: 300 !important;
  animation: extremePulse 4s ease-in-out infinite;
  display: block !important;
  transform: none !important;
  position: relative;
}

@keyframes extremePulse {
  0%, 100% {
    opacity: 0.95;
  }
  50% {
    opacity: 1;
  }
}

.extreme-subtitle {
  font-size: 14px;
  letter-spacing: 8px;
  margin-top: 20px;
  font-family: 'Cinzel', serif;
  font-weight: 300;
  text-transform: uppercase;
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
  opacity: 0.75;
}

.extreme-description p {
  margin: 0;
}

/* 左侧极端状态 - 昼之页面 */
.left-extreme .extreme-title {
  background: linear-gradient(
      to bottom,
      #8b7d6b 0%,
      #6b5d4b 50%,
      #8b7d6b 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.5);
}


.left-extreme .extreme-subtitle {
  color: rgba(107, 93, 75, 0.85);
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
}

.left-extreme .extreme-description {
  color: rgba(107, 93, 75, 0.7);
}

/* 右侧极端状态 - 夜之页面 */
.right-extreme .extreme-title {
  background: linear-gradient(
      to bottom,
      #ffffff 0%,
      #e0f0ff 50%,
      #ffffff 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 1);
}


.right-extreme .extreme-subtitle {
  color: rgba(200, 210, 220, 1);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.right-extreme .extreme-description {
  color: rgba(200, 210, 220, 1);
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
  position: relative;
}

/* 第一个字 "白" - 右偏移 + 暖色调 */
.title-composition .title-kanji:nth-child(1) {
  transform: translateX(-25px);
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

/* 为"白"字添加额外的噪点层 - 使用 ::before 创建更明显的效果 */
.title-composition .title-kanji:nth-child(1)::before {
  content: '白';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
      url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise2b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise2b)' opacity='0.4'/%3E%3C/svg%3E"),
      linear-gradient(
          to bottom,
          #4a5a6a 0%,
          #8b9aaa 50%,
          #4a5a6a 100%
      );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  mix-blend-mode: screen;
  opacity: 0.6;
  pointer-events: none;
  z-index: 0;
  filter: drop-shadow(2px 2px 0 rgba(255, 255, 255, 0.8))
  drop-shadow(-2px -2px 0 rgba(212, 165, 165, 0.1));
}

/* 为"白"字添加噪点纹理叠加层 - 使用 ::after 确保显示在文字上方 */
.title-composition .title-kanji:nth-child(1)::after {
  content: '白';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
      url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='6' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.3 0.7 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise2)'/%3E%3C/svg%3E"),
      linear-gradient(
          to bottom,
          #4a5a6a 0%,
          #8b9aaa 50%,
          #4a5a6a 100%
      );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  mix-blend-mode: overlay;
  opacity: 1;
  pointer-events: none;
  z-index: 1;
  filter: drop-shadow(2px 2px 0 rgba(255, 255, 255, 0.8))
  drop-shadow(-2px -2px 0 rgba(212, 165, 165, 0.1));
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

/* 为"夜"字添加额外的噪点层 - 使用 ::before 创建更明显的效果 */
.title-composition .title-kanji:nth-child(3)::before {
  content: '夜';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
      url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise2b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.0' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise2b)' opacity='0.4'/%3E%3C/svg%3E"),
      linear-gradient(
          to bottom,
          #4a5a6a 0%,
          #8b9aaa 50%,
          #4a5a6a 100%
      );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  mix-blend-mode: screen;
  opacity: 0.6;
  pointer-events: none;
  z-index: 0;
  filter: drop-shadow(2px 2px 0 rgba(255, 255, 255, 0.8))
  drop-shadow(-2px -2px 0 rgba(212, 165, 165, 0.1));
}

/* 为"夜"字添加噪点纹理叠加层 - 使用 ::after 确保显示在文字上方 */
.title-composition .title-kanji:nth-child(3)::after {
  content: '夜';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
      url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='6' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.3 0.7 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise2)'/%3E%3C/svg%3E"),
      linear-gradient(
          to bottom,
          #4a5a6a 0%,
          #8b9aaa 50%,
          #4a5a6a 100%
      );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  mix-blend-mode: overlay;
  opacity: 1;
  pointer-events: none;
  z-index: 1;
  filter: drop-shadow(2px 2px 0 rgba(255, 255, 255, 0.8))
  drop-shadow(-2px -2px 0 rgba(212, 165, 165, 0.1));
}

/* hover 效果 - 第一个字 */
.title-composition .title-kanji:nth-child(1):hover {
  transform: translateX(30px) scale(1.08);
  filter: drop-shadow(3px 3px 0 rgba(255, 255, 255, 0.9))
  drop-shadow(-3px -3px 0 rgba(212, 165, 165, 0.15))
  drop-shadow(0 6px 30px rgba(212, 165, 165, 0.4))
  drop-shadow(0 0 80px rgba(255, 192, 203, 0.3));
}

.title-composition .title-kanji:nth-child(1):hover::after {
  opacity: 1;
  filter: drop-shadow(3px 3px 0 rgba(255, 255, 255, 0.9))
  drop-shadow(-3px -3px 0 rgba(212, 165, 165, 0.15))
  drop-shadow(0 6px 30px rgba(212, 165, 165, 0.4))
  drop-shadow(0 0 80px rgba(255, 192, 203, 0.3));
}

/* hover 效果 - 第二个字 */
.title-composition .title-kanji:nth-child(3):hover {
  transform: translateX(30px) scale(1.08);
  filter: drop-shadow(3px 3px 0 rgba(255, 255, 255, 0.9))
  drop-shadow(-3px -3px 0 rgba(212, 165, 165, 0.15))
  drop-shadow(0 6px 30px rgba(212, 165, 165, 0.4))
  drop-shadow(0 0 80px rgba(255, 192, 203, 0.3));
}

.title-composition .title-kanji:nth-child(3):hover::after {
  opacity: 1;
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
  color: rgba(255, 255, 255, 1);
  text-shadow: 1px 1px  rgba(0, 0, 0, 1);
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-self: flex-start;
  margin-left: 20px;
  margin-top: -20px;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
  background-clip: text;
}

.subtitle-letter {
  display: inline-block;
  transition: all 0.3s ease;
}

.subtitle-letter:hover {
  color: rgba(255, 255, 255, 1);
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
  color: rgba(255, 255, 255, 1);
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

.center-main-title.title-theme-1 .title-kanji::after,
.center-main-title.title-theme-2 .title-kanji::after,
.center-main-title.title-theme-3 .title-kanji::after {
  opacity: 0.7;
}

/* 可拖拽的分割线 */
.divider {
  position: fixed;
  left: 30%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: transparent;
  /* 移除了 ew-resize，改为 default */
  cursor: default;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s ease, background 0.3s ease;
}

.divider.transitioning {
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s ease, background 0.3s ease;
}

/* 边缘状态 - 隐藏在边缘 */
.divider.edge-left {
  left: 0 !important;
  width: 3px;
  background: linear-gradient(
      to right,
      rgba(200, 210, 220, 0.2),
      rgba(200, 210, 220, 0.1),
      transparent
  );
  /* 边缘状态下依然不需要 resize 光标 */
  cursor: default;
}

.divider.edge-left:hover {
  width: 6px;
  background: linear-gradient(
      to right,
      rgba(200, 210, 220, 0.4),
      rgba(200, 210, 220, 0.2),
      transparent
  );
  box-shadow: 2px 0 10px rgba(200, 210, 220, 0.3);
}

.divider.edge-right {
  left: calc(100% - 3px) !important;
  width: 3px;
  background: linear-gradient(
      to left,
      rgba(200, 190, 180, 0.2),
      rgba(200, 190, 180, 0.1),
      transparent
  );
  /* 边缘状态下依然不需要 resize 光标 */
  cursor: default;
}

.divider.edge-right:hover {
  width: 6px;
  left: calc(100% - 6px) !important;
  background: linear-gradient(
      to left,
      rgba(200, 190, 180, 0.4),
      rgba(200, 190, 180, 0.2),
      transparent
  );
  box-shadow: -2px 0 10px rgba(200, 190, 180, 0.3);
}

/* 正常状态 - 非常不明显 */
.divider::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -10px;
  right: -10px;
  background: transparent;
}

.divider:hover {
  width: 3px;
  background: linear-gradient(
      to right,
      rgba(200, 190, 180, 0.15),
      rgba(200, 190, 180, 0.25),
      rgba(200, 190, 180, 0.15)
  );
}

.divider.dragging {
  width: 4px;
  background: linear-gradient(
      to right,
      rgba(139, 125, 107, 0.2),
      rgba(139, 125, 107, 0.35),
      rgba(139, 125, 107, 0.2)
  );
}

.divider-handle {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.divider:hover .divider-handle,
.divider.dragging .divider-handle {
  opacity: 0.4;
}

.divider.edge-left .divider-handle,
.divider.edge-right .divider-handle {
  opacity: 0.15;
}

.divider.edge-left:hover .divider-handle,
.divider.edge-right:hover .divider-handle {
  opacity: 0.5;
}

.handle-line {
  width: 1px;
  height: 40px;
  background: linear-gradient(
      to bottom,
      transparent,
      rgba(139, 125, 107, 0.5),
      transparent
  );
  transition: all 0.3s ease;
}

.divider:hover .handle-line,
.divider.dragging .handle-line {
  height: 50px;
  background: linear-gradient(
      to bottom,
      transparent,
      rgba(139, 125, 107, 0.7),
      transparent
  );
}

/* 按钮组容器 */
.button-group {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 12px;
  pointer-events: auto;
  z-index: 10;
  opacity: 0;
  animation: buttonGroupFadeIn 0.3s ease 0.2s forwards;
}

@keyframes buttonGroupFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* 导航按钮基础样式 */
.nav-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(139, 125, 107, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(139, 125, 107, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: scale(1.1);
}

.nav-button:active {
  transform: scale(0.95);
}

/* 单个按钮样式（极端模式） */
.nav-button-single {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: singleButtonFadeIn 0.3s ease 0.2s forwards;
}

@keyframes singleButtonFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.nav-button-single:hover {
  transform: translate(-50%, -50%) scale(1.15);
}

.nav-button-single:active {
  transform: translate(-50%, -50%) scale(0.9);
}

/* 图标样式 */
.nav-icon {
  width: 18px;
  height: 18px;
  color: rgba(139, 125, 107, 0.7);
  transition: all 0.3s ease;
}

.nav-button:hover .nav-icon {
  color: rgba(139, 125, 107, 1);
}

/* 向左按钮悬停效果 */
.nav-button-left:hover .nav-icon {
  transform: translateX(-2px);
}

/* 向右按钮悬停效果 */
.nav-button-right:hover .nav-icon {
  transform: translateX(2px);
}

/* 单个按钮的箭头动画 */
.nav-button-single:hover .nav-icon {
  animation: arrowPulse 0.6s ease infinite;
}

@keyframes arrowPulse {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}

/* 极昼模式的向右箭头 */
.divider.edge-left .nav-button-single:hover .nav-icon {
  animation: arrowPulseRight 0.6s ease infinite;
}

@keyframes arrowPulseRight {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}

/* 极夜模式的向左箭头 */
.divider.edge-right .nav-button-single:hover .nav-icon {
  animation: arrowPulseLeft 0.6s ease infinite;
}

@keyframes arrowPulseLeft {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-3px);
  }
}

/* 左侧区域 - 30% */
.left-section {
  position: relative;
  overflow: hidden;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  transform-origin: right center;
}

.left-section.section-hidden {
  opacity: 0;
  pointer-events: none;
}

/* 永夜模式时，左侧区域从左往右扩展 */
.page-night-mode .left-section {
  animation: nightExpand 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes nightExpand {
  0% {
    width: 0%;
    transform: translateX(-100%);
    opacity: 0;
  }
  100% {
    width: 100%;
    transform: translateX(0);
    opacity: 1;
  }
}

.sky-background {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: background 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 左侧区域使用图片背景 - 渐变模式时显示图片 */
.left-section .sky-background:not(.bg-solid) {
  background-image: url('/minRightWidth.png') !important;
  /* 使用固定的大尺寸，确保图片不会因容器变化而放大或缩小 */
  /* 宽度设为视口的3倍，高度填满视口，保持图片比例 */
  background-size: 100vw 100vh !important;
  background-repeat: no-repeat !important;
  position: relative;
  transition: background-position 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 左侧渐变模式时隐藏背景层 */
.left-section .sky-background:not(.bg-solid) .bg-layer {
  opacity: 0 !important;
}

/* 右侧区域使用图片背景 - 渐变模式时显示图片 */
.right-section .sky-background:not(.bg-solid) {
  background-image: url('/minLeftWidth2.png') !important;
  /* 使用固定的大尺寸，确保图片不会因容器变化而放大或缩小 */
  /* 宽度设为视口的3倍，高度填满视口，保持图片比例 */
  background-size: 100vw 100vh !important;
  background-repeat: no-repeat !important;
  position: relative;
  transition: background-position 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 右侧渐变模式时隐藏背景层 */
.right-section .sky-background:not(.bg-solid) .bg-layer {
  opacity: 0 !important;
}

/* 纯色背景模式 */
.sky-background.bg-solid {
  background: #f5f3f0 !important;
}

/* 左侧区域使用图片背景 - 背景与卡片保持相对位置固定 */
.left-section .sky-background.bg-solid {
  /* 背景图片定位：使用百分比定位，确保与卡片容器保持相对位置 */
  /* 可以通过调整 background-position 的值来微调对齐（例如：120% 50% 表示向右偏移） */
  background: url('/minimalistBG.png') 50% 50% / cover no-repeat !important;
  position: relative;
  /* 确保背景覆盖整个区域 */
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
}

/* 右侧区域使用图片背景 - 背景与卡片保持相对位置固定 */
.right-section .sky-background.bg-solid {
  /* 背景图片定位：使用百分比定位，确保与卡片容器保持相对位置 */
  /* 可以通过调整 background-position 的值来微调对齐（例如：120% 50% 表示向右偏移） */
  background: url('/minimalistBG.png') 50% 50% / cover no-repeat !important;
  position: relative;
  /* 确保背景覆盖整个区域 */
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
}

.sky-background.bg-solid .bg-layer {
  opacity: 0 !important;
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
      #f7ddd7 0%,      /* 上: 空色 (天蓝) */ #bad6ea 50%,     /* 中: 灰櫻 (暖粉灰) */
      #f7ddd7 100%     /* 下: 水色 (淡蓝) */
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
.bg-layer.bg-default2 {
  background: linear-gradient(
      to bottom,
      #3a4a5a 0%,
      #8ea1b3 50%,
      #3a4a5a 100%
  );
}

.bg-layer.bg-4 {
  background: linear-gradient(
      to bottom,
      #A4C0D9 0%,      /* 上: 暖色 - 淡樱灰粉 (低饱和) */ #f1f3f6 50%,     /* 中: 暖色 - 灰樱色 (温柔的灰粉) */ #8aa4ba 100%     /* 下: 冷色 - 淡蓝灰 (春日薄雾天空) */
  );
}

/* 卡片2背景 - 思界者·夏 (夏日天空) */
.bg-layer.bg-5 {
  background: linear-gradient(
      to bottom,
      #e8d5b7 0%,      /* 上: 空色 (夏日蓝天) */
      #7db9de 50%,     /* 中: 勿忘草色 (明亮蓝) */
      #e8d5b7 100%     /* 下: 砂色 (夏日沙滩) */
  );
}

/* 卡片3背景 - 永遠回帰·冬 (雪夜) */
.bg-layer.bg-6 {
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
  position: absolute;
  z-index: 10;
  text-align: center;
  padding: 50px 0;
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

/* 右侧区域 - 70% */
.right-section {
  /* 移除 padding，由内部容器控制 */
  padding: 0;
  background: #f5f3f0;
  position: relative;
  z-index: 100;
  overflow-y: auto;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

/* 右侧渐变背景模式 - 不再需要，由内部 sky-background 处理 */
/*
.right-section.section-gradient-bg {
  background: linear-gradient(...);
}
*/

.right-section.section-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateX(50px);
}

.right-section.section-fullscreen .card-container {
  padding: 60px 80px;
}

/* 永夜模式时，右侧区域被推出 */
.page-night-mode .right-section {
  animation: sectionPushOut 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes sectionPushOut {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-100px);
  }
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

/* 卡片装饰图案容器 */
.card-decorative-patterns {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.geometric-framework {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  min-width: 1200px;
  min-height: 600px;
  opacity: 0.6;
}

/* 框架动画 */
.left-framework,
.center-framework,
.right-framework {
  animation: patternFadeIn 1.5s ease-out forwards;
}

.left-framework {
  animation-delay: 0.2s;
  opacity: 0;
}

.center-framework {
  animation-delay: 0.4s;
  opacity: 0;
}

.right-framework {
  animation-delay: 0.6s;
  opacity: 0;
}

@keyframes patternFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 船形图标动画 */
.ship-icon-left,
.ship-icon-right {
  animation: shipFloat 8s ease-in-out infinite;
}

.ship-icon-left {
  animation-delay: 0s;
}

.ship-icon-right {
  animation-delay: 4s;
}

@keyframes shipFloat {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(5px, -8px) rotate(2deg);
  }
}

/* 抽象图标动画 */
.abstract-icons circle,
.abstract-icons rect,
.abstract-icons polygon {
  animation: iconPulse 4s ease-in-out infinite;
}

.abstract-icons circle:nth-child(1) {
  animation-delay: 0s;
}

.abstract-icons rect {
  animation-delay: 1s;
}

.abstract-icons polygon {
  animation-delay: 2s;
}

.abstract-icons circle:nth-child(4) {
  animation-delay: 3s;
}

@keyframes iconPulse {
  0%, 100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.25;
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
  opacity: 1;
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  /* 添加 padding 以保持原有布局 */
  padding: 40px 60px;
}

/* 卡片淡出动画 */
.card-container.cards-fading {
  animation: cardsFadeOut 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes cardsFadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* 左侧卡片容器 */
.left-card-container {
  display: flex;
  gap: 30px;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
  max-width: 100%;
  opacity: 1;
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  /* 添加 padding 以保持原有布局 */
  padding: 40px 60px;
}

/* 左侧卡片淡出动画 */
.left-card-container.cards-fading {
  animation: cardsFadeOut 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* 响应式设计 */

/* 从极夜模式返回时的动画 - 标题 (保持垂直居中) */
.animate-from-right-title {
  animation: slideInFromRightTitle 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
}

@keyframes slideInFromRightTitle {
  0% {
    opacity: 0;

  }
  100% {
    opacity: 1;

  }
}

/* 从极夜模式返回时的动画 - 区块 (普通位移) */
.animate-from-right-section {
  animation: slideInFromRightSection 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
}

@keyframes slideInFromRightSection {
  0% {
    opacity: 0;
    transform: translateX(100px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
@media (max-width: 1400px) {
  .left-section {
    flex: 0 0 35%;
  }

  .right-section {
    flex: 0 0 65%;
  }

  .card-container {
    padding: 30px 40px;
  }

  .center-main-title {
    left: 35%;
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
  }

  .card-container {
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
}
</style>
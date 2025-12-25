<template>
  <div class="card-collection-page">
    <div class="main-container" :class="{ 'is-blurred': activeCardIndex !== null }">
      <div class="left-sidebar">
        <div class="sidebar-content" ref="sidebarContentRef">
          COLLECTION
        </div>
      </div>
      <SowakaNavigation
          :mobile-menu-open="mobileMenuOpen"
          @toggle-mobile-menu="toggleMobileMenu"
          @scroll-to-section="scrollToSection"
      />
      <div class="cards-wrapper" v-if="!loading && !error">
        <CardItem
            v-for="(card, index) in cardsData"
            :key="card._id || index"
            :ref="el => cardRefs[index] = el"
            :season="card.season"
            :number="card.number"
            :title="card.title"
            :subtitle="card.subtitle"
            :label="card.label"
            :background-image="card.backgroundImage"
            :hover-gradient="card.hoverGradient"
            :decoration-type="card.decorationType"
            :index="index"
            :unlocked="card.unlocked !== undefined ? card.unlocked : true"
            :command-image="card.commandImage"
            :overlay-color="card.overlayColor || 'rgba(100, 150, 200, 0.3)'"
            :overlay-dark-color="card.overlayDarkColor || 'rgba(50, 80, 120, 0.3)'"
            :overlay-background-image="card.overlayBackgroundImage || '/storyImage/harukaBG.png'"
            :is-active="hoveredCardIndex === index"
            @click="handleCardClick(index)"
            @hover="handleCardHover(index)"
            @hover-end="handleCardHoverEnd(index)"
        />
      </div>
      <div v-if="loading" class="loading-container">
        <div class="loading-text">加载中...</div>
      </div>
      <div v-if="error && !loading" class="error-container">
        <div class="error-text">加载失败: {{ error }}</div>
      </div>
    </div>

    <div class="bottom-info" v-if="activeCardIndex === null">
      <div class="bottom-info-line">
        <span>標題頁</span>
        <span class="bottom-info-dot"></span>
        <span>第壹章</span>
      </div>
      <div class="bottom-info-line">
        <span>Character Collection</span>
      </div>
    </div>

    <transition name="detail-fade">
      <CharacterDetail
          v-if="activeCardIndex !== null && currentCard"
          :card="currentCard"
          @close="closeDetail"
      />
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import CardItem from '../components/CardItem.vue'
import CharacterDetail from '../components/CharacterDetail.vue' // 引入新分离的组件
import characterCardApi from '../api/characterCardApi'
import SowakaNavigation from "@/components/sowaka/SowakaNavigation.vue";

const sidebarContentRef = ref(null)
const cardRefs = ref([])
const activeCardIndex = ref(null) // 用于显示详细页面（点击触发）
const hoveredCardIndex = ref(null) // 用于激活状态（悬浮触发）
const cardsData = ref([]) // 从API获取的数据
const loading = ref(true)
const error = ref(null)

// 从API加载卡片数据
const loadCards = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await characterCardApi.getAllCards({ sortBy: 'index' })
    cardsData.value = data || []
  } catch (err) {
    console.error('加载角色卡片失败:', err)
    error.value = err.message || '加载数据失败'
    // 如果API失败，使用空数组，避免页面崩溃
    cardsData.value = []
  } finally {
    loading.value = false
  }
}

// 计算当前选中的卡片数据
const currentCard = computed(() => {
  if (activeCardIndex.value === null) return null
  return cardsData.value[activeCardIndex.value]
})

const handleCardClick = (index) => {
  if (cardsData.value[index]?.unlocked === false) return
  activeCardIndex.value = index
}

const handleCardHover = (index) => {
  if (cardsData.value[index]?.unlocked === false) return
  hoveredCardIndex.value = index
}

const handleCardHoverEnd = (index) => {
  if (hoveredCardIndex.value === index) {
    hoveredCardIndex.value = null
  }
}

const closeDetail = () => {
  activeCardIndex.value = null
}

const handleMouseMove = (e) => {
  // 如果详情页打开，禁用列表视差
  if (activeCardIndex.value !== null) return
  // 如果正在悬浮卡片，禁用视差效果
  if (hoveredCardIndex.value !== null) return

  const mouseX = (e.clientX / window.innerWidth - 0.5) * 2
  const mouseY = (e.clientY / window.innerHeight - 0.5) * 2

  document.querySelectorAll('.card-decoration').forEach((deco, index) => {
    const card = deco.closest('.card')
    if (card && !card.matches(':hover')) {
      const speed = (index % 3 + 1) * 1.5
      const x = mouseX * speed
      const y = mouseY * speed
      deco.style.transform = `translate(${x}px, ${y}px)`
    }
  })

  if (sidebarContentRef.value) {
    const yOffset = mouseY * 10
    sidebarContentRef.value.style.transform = `translateY(${yOffset}px)`
  }

  const cards = document.querySelectorAll('.card')
  cards.forEach((card, index) => {
    if (!card.matches(':hover')) {
      const tiltX = mouseY * 0.3
      const tiltY = mouseX * 0.3
      card.style.transform = `skewY(-2deg) perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
    }
  })
}

onMounted(async () => {
  document.addEventListener('mousemove', handleMouseMove)
  // 加载卡片数据
  await loadCards()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+SC:wght@200;300;400;500;700&family=Noto+Sans+JP:wght@200;300;400&display=swap');

.card-collection-page {
  font-family: 'Cinzel', 'Noto Serif SC', 'Noto Sans JP', serif;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: #f8f8fa;
}

/* 主容器过渡 */
.main-container {
  display: grid;
  grid-template-columns: 20% 80%;
  height: 100vh;
  width: 100%;
  transition: filter 0.5s ease, transform 0.5s ease;
}

.main-container.is-blurred {
  filter: blur(15px) brightness(0.95);
  transform: scale(0.98);
  pointer-events: none; /* 防止点击底层 */
}

/* 详情页进出动画 (必须保留在父组件，因为Transition在这里) */
.detail-fade-enter-active,
.detail-fade-leave-active {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.detail-fade-enter-from,
.detail-fade-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.98);
}

/* ... 原有的左侧和卡片样式 ... */
.left-sidebar {
  position: relative;
  background: linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(251, 249, 241) 100%);
  border-right: 1px solid rgba(200, 200, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 30px;
}
.sidebar-content {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 16px;
  font-weight: 200;
  color: rgba(100, 100, 120, 1);
  letter-spacing: 8px;
  position: relative;
}
.cards-wrapper {
  display: flex;
  height: 100vh;
  width: 100%;
  position: relative;
  gap: 20px;
  padding: 0 40px 0 20px;
}

/* 底部信息 */
.bottom-info {
  position: fixed;
  bottom: 40px;
  right: 60px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 90;
}
.bottom-info-line {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 10px;
  font-weight: 200;
  color: rgba(100, 100, 120, 0.35);
  letter-spacing: 2px;
}
.bottom-info-dot {
  width: 3px;
  height: 3px;
  background: rgba(120, 120, 140, 0.25);
  border-radius: 50%;
}

@media (max-width: 1400px) {
  .main-container {
    grid-template-columns: 15% 85%;
  }
}

@media (max-width: 1024px) {
  .main-container {
    grid-template-columns: 10% 90%;
  }
  .sidebar-content {
    font-size: 14px;
    letter-spacing: 6px;
  }
  .cards-wrapper {
    gap: 15px;
    padding: 30px 30px 30px 15px;
  }
}

@media (max-width: 768px) {
  .main-container {
    grid-template-columns: 1fr;
  }
  .left-sidebar {
    display: none;
  }
  .cards-wrapper {
    padding: 20px;
    gap: 10px;
  }
}

/* 加载和错误状态 */
.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
}

.loading-text,
.error-text {
  font-size: 16px;
  color: rgba(100, 100, 120, 0.6);
  letter-spacing: 2px;
}

.error-text {
  color: rgba(200, 50, 50, 0.8);
}
</style>
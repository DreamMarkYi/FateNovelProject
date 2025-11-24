<template>
  <div class="card-collection-page">
    <div class="main-container">
      <!-- 左侧预留区域 -->
      <div class="left-sidebar">
        <div class="sidebar-content" ref="sidebarContentRef">
          COLLECTION
        </div>
      </div>

      <!-- 卡片区域 -->
      <div class="cards-wrapper">
        <CardItem
          v-for="(card, index) in cardsData"
          :key="index"
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
          @click="handleCardClick"
        />
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="bottom-info">
      <div class="bottom-info-line">
        <span>標題頁</span>
        <span class="bottom-info-dot"></span>
        <span>第壹章</span>
      </div>
      <div class="bottom-info-line">
        <span>Character Collection</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import CardItem from '../components/CardItem.vue'

const sidebarContentRef = ref(null)
const cardRefs = ref([])

// 卡片数据
const cardsData = [
  {
    season: 'Saber',
    number: 'H O 1',
    title: '白鳥 瑤',
    subtitle: '皎月之章',
    label: 'Distrust',
    backgroundImage: '/storyImage/haruka1_Alpha_position.png',
    hoverGradient: 'linear-gradient(168deg, rgba(252, 253, 257 ,0.7) 0%, rgba(227, 252, 254, 0.6) 50%, rgba(200, 207, 207, 0.5) 100%)',
    decorationType: 'type1',
    commandImage:'/storyImage/command1.png'
  },
  {
    season: 'Archer',
    number: 'H O 2',
    title: '天宮院 菲娜',
    subtitle: '烈阳之詩',
    label: 'Thinker',
    backgroundImage: '/storyImage/Ruri1.png',
    hoverGradient: 'linear-gradient(168deg, rgba(252, 242, 238, 0.9) 0%, rgba(227, 164, 171, 0.8) 50%, rgba(235, 206, 201, 0.7) 100%)',
    decorationType: 'type2',
    commandImage:'/storyImage/command2.png'
  },
  {
    season: 'Caster',
    number: 'H O 3',
    title: '神代 琉璃',
    subtitle: '玫瑰之歌',
    label: 'Recurrence',
    backgroundImage: '/storyImage/Seraphina.png',
    hoverGradient: 'linear-gradient(168deg, rgba(240, 242, 245, 0.7) 0%, rgba(123, 123, 114, 0.6) 50%, rgba(204, 207, 217, 0.5) 100%)',
    decorationType: 'type1',
    commandImage:'/storyImage/command3.png'
  },
  {
    season: '冬',
    number: 'H O 4',
    title: '雪之結晶',
    subtitle: '冬雪之夢',
    label: 'Crystal',
    backgroundImage: '/storyImage/haruka1_Alpha_position.png',
    hoverGradient: 'linear-gradient(168deg, rgba(238, 242, 247, 0.7) 0%, rgba(229, 233, 242, 0.6) 50%, rgba(201, 206, 221, 0.5) 100%)',
    decorationType: 'type2',
    unlocked: false,
    commandImage:'/storyImage/command1.png'
  },
  {
    season: '暁',
    number: 'H O 5',
    title: '暁之光',
    subtitle: '晨曦初照',
    label: 'Dawn',
    backgroundImage: '/storyImage/haruka1_Alpha_position.png',
    hoverGradient: 'linear-gradient(168deg, rgba(238, 247, 242, 0.7) 0%, rgba(229, 242, 233, 0.6) 50%, rgba(201, 220, 207, 0.5) 100%)',
    decorationType: 'type1',
    unlocked: false,
    commandImage:'/storyImage/command1.png'
  },
  {
    season: '暮',
    number: 'H O 6',
    title: '黄昏之影',
    subtitle: '夕暮之時',
    label: 'Twilight',
    backgroundImage: '/storyImage/haruka1_Alpha_position.png',
    hoverGradient: 'linear-gradient(168deg, rgba(252, 247, 238, 0.7) 0%, rgba(249, 242, 229, 0.6) 50%, rgba(235, 222, 201, 0.5) 100%)',
    decorationType: 'type2',
    unlocked: false,
    commandImage:'/storyImage/command2.png'
  },
  {
    season: '夜',
    number: 'H O 7',
    title: '月夜幻想',
    subtitle: '星月之夜',
    label: 'Fantasy',
    backgroundImage: '/storyImage/haruka1_Alpha_position.png',
    hoverGradient: 'linear-gradient(168deg, rgba(245, 238, 245, 0.7) 0%, rgba(239, 229, 239, 0.6) 50%, rgba(217, 202, 217, 0.5) 100%)',
    decorationType: 'type1',
    unlocked: false,
    commandImage:'/storyImage/command2.png'
  }
]

// 精致的视差效果
const handleMouseMove = (e) => {
  const mouseX = (e.clientX / window.innerWidth - 0.5) * 2
  const mouseY = (e.clientY / window.innerHeight - 0.5) * 2

  // 装饰元素视差
  document.querySelectorAll('.card-decoration').forEach((deco, index) => {
    const card = deco.closest('.card')
    if (card && !card.matches(':hover')) {
      const speed = (index % 3 + 1) * 1.5
      const x = mouseX * speed
      const y = mouseY * speed
      deco.style.transform = `translate(${x}px, ${y}px)`
    }
  })

  // 侧边栏内容视差
  if (sidebarContentRef.value) {
    const yOffset = mouseY * 10
    sidebarContentRef.value.style.transform = `translateY(${yOffset}px)`
  }

  // 卡片轻微倾斜
  const cards = document.querySelectorAll('.card')
  cards.forEach((card, index) => {
    if (!card.matches(':hover')) {
      const tiltX = mouseY * 0.3
      const tiltY = mouseX * 0.3
      // 保持 skewY(-2deg) 并添加轻微的 3D 倾斜效果
      card.style.transform = `skewY(-2deg) perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
    }
  })
}

// 卡片点击处理
const handleCardClick = (index) => {
  console.log('Card clicked:', index)
  // 可以在这里添加路由跳转或其他逻辑
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@200;300;400&family=Noto+Sans+JP:wght@200;300;400&display=swap');

.card-collection-page {
  font-family: 'Noto Serif SC', 'Noto Sans JP', serif;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: #f8f8fa;
}

/* 主容器 - 使用 grid 布局来分配左侧空间 */
.main-container {
  display: grid;
  grid-template-columns: 20% 80%;
  height: 100vh;
  width: 100%;
}

/* 左侧预留区域 */
.left-sidebar {
  position: relative;
  background: linear-gradient(135deg,
  rgb(255, 255, 255) 0%,
  rgb(251, 249, 241) 100%);
  border-right: 1px solid rgba(200, 200, 210, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 30px;
}

/* 左侧装饰性内容 */
.sidebar-content {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 16px;
  font-weight: 200;
  color: rgba(100, 100, 120, 1);
  letter-spacing: 8px;
  position: relative;
}

.sidebar-content::before,
.sidebar-content::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  background: linear-gradient(to bottom,
  transparent,
  rgba(120, 120, 140, 0.15),
  transparent);
}

.sidebar-content::before {
  top: -40px;
  height: 30px;
}

.sidebar-content::after {
  bottom: -40px;
  height: 30px;
}

/* 卡片容器 */
.cards-wrapper {
  display: flex;
  height: 100vh;
  width: 100%;
  position: relative;
  gap: 20px; /* 增加卡片间距 */
  padding: 0 40px 0 20px; /* 左右内边距，上下为0占满屏幕 */
}

/* 最后一个卡片不显示分割线 */
.cards-wrapper :deep(.card:last-child::before) {
  display: none;
}

/* 底部信息 */
.bottom-info {
  position: fixed;
  bottom: 40px; /* 增加底部距离 */
  right: 60px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  z-index: 100;
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

/* 响应式调整 */
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
</style>


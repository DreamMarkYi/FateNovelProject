<template>
  <div class="novel-gallery-page">
    <!-- 左侧大图区域 -->
    <div class="left-section">
      <div class="main-visual">
        <img :src="currentNovel.image" :alt="currentNovel.title" />
        <div class="overlay"></div>
        <div class="title-area">
          <h1 class="main-title">{{ currentNovel.title }}</h1>
          <p class="subtitle">{{ currentNovel.subtitle }}</p>
          <div class="vertical-text">
            <span v-for="(char, index) in currentNovel.description" :key="index">
              {{ char }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间分隔线 -->
    <div class="center-divider">
      <div class="divider-line"></div>
      <div class="divider-dots">
        <span 
          v-for="(novel, index) in novels" 
          :key="index"
          :class="{ active: currentIndex === index }"
          @click="switchNovel(index)"
        ></span>
      </div>
    </div>

    <!-- 右侧章节卡片区域 -->
    <div class="right-section">
      <div class="chapter-grid">
        <div 
          v-for="chapter in currentNovel.chapters" 
          :key="chapter.id"
          class="chapter-card"
          @click="openChapter(chapter)"
        >
          <div class="card-background">
            <div class="diagonal-lines"></div>
          </div>
          <div class="card-content">
            <div class="chapter-number">{{ chapter.number }}</div>
            <h3 class="chapter-title">{{ chapter.title }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- 导航按钮 -->
    <div class="nav-buttons">
      <button @click="prevNovel" class="nav-btn prev-btn">
        <span>←</span>
      </button>
      <button @click="nextNovel" class="nav-btn next-btn">
        <span>→</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 示例数据
const novels = ref([
  {
    id: 1,
    title: '白夜',
    subtitle: '~twilight time~',
    description: '信じて、',
    image: '/backgroundLeft.jpg',
    chapters: [
      { id: 1, number: 'H O 1', title: '人间不值' },
      { id: 2, number: 'H O 2', title: '思罪者' },
      { id: 3, number: 'H O 3', title: '夜色温柔' },
      { id: 4, number: 'H O 4', title: '月光曲' }
    ]
  },
  {
    id: 2,
    title: '命运',
    subtitle: '~fate night~',
    description: '運命の夜',
    image: '/backgroundRight2.png',
    chapters: [
      { id: 5, number: 'F T 1', title: '序章' },
      { id: 6, number: 'F T 2', title: '相遇' },
      { id: 7, number: 'F T 3', title: '抉择' },
      { id: 8, number: 'F T 4', title: '终章' }
    ]
  }
])

const currentIndex = ref(0)
const currentNovel = computed(() => novels.value[currentIndex.value])

const switchNovel = (index) => {
  currentIndex.value = index
}

const prevNovel = () => {
  currentIndex.value = (currentIndex.value - 1 + novels.value.length) % novels.value.length
}

const nextNovel = () => {
  currentIndex.value = (currentIndex.value + 1) % novels.value.length
}

const openChapter = (chapter) => {
  console.log('Opening chapter:', chapter)
  // router.push(`/chapter/${chapter.id}`)
}
</script>

<style scoped>
.novel-gallery-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  background: linear-gradient(135deg, #e8f0f7 0%, #f5f8fa 100%);
  overflow: hidden;
  position: relative;
}

/* 左侧区域 */
.left-section {
  flex: 0 0 45%;
  position: relative;
  overflow: hidden;
}

.main-visual {
  width: 100%;
  height: 100%;
  position: relative;
}

.main-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease;
}

.main-visual:hover img {
  transform: scale(1.05);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.3) 100%
  );
}

.title-area {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  z-index: 2;
}

.main-title {
  font-size: 5rem;
  font-weight: 300;
  letter-spacing: 0.5rem;
  margin: 0;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
  font-family: 'Noto Serif JP', serif;
}

.subtitle {
  font-size: 1.2rem;
  font-weight: 300;
  letter-spacing: 0.3rem;
  margin: 1rem 0 2rem;
  opacity: 0.9;
}

.vertical-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
  line-height: 2;
  font-family: 'Noto Serif JP', serif;
}

/* 中间分隔线 */
.center-divider {
  flex: 0 0 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 3;
}

.divider-line {
  width: 1px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    #999 10%,
    #999 90%,
    transparent 100%
  );
}

.divider-dots {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.divider-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ccc;
  cursor: pointer;
  transition: all 0.3s ease;
}

.divider-dots span.active {
  background: #666;
  transform: scale(1.3);
}

.divider-dots span:hover {
  background: #888;
  transform: scale(1.2);
}

/* 右侧区域 */
.right-section {
  flex: 1;
  padding: 4rem 3rem;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  max-width: 800px;
  width: 100%;
}

.chapter-card {
  aspect-ratio: 3/4;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.4s ease;
}

.chapter-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
}

.diagonal-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(0, 0, 0, 0.02) 10px,
    rgba(0, 0, 0, 0.02) 20px
  );
}

.card-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  z-index: 1;
}

.chapter-number {
  font-size: 1rem;
  letter-spacing: 0.5rem;
  color: #999;
  margin-bottom: 1rem;
  font-weight: 300;
}

.chapter-title {
  font-size: 1.8rem;
  font-weight: 400;
  color: #333;
  text-align: center;
  letter-spacing: 0.2rem;
  font-family: 'Noto Serif JP', serif;
}

/* 导航按钮 */
.nav-buttons {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2rem;
  z-index: 10;
}

.nav-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* 滚动条样式 */
.right-section::-webkit-scrollbar {
  width: 6px;
}

.right-section::-webkit-scrollbar-track {
  background: transparent;
}

.right-section::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.right-section::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .left-section {
    flex: 0 0 40%;
  }
  
  .chapter-grid {
    grid-template-columns: 1fr;
  }
  
  .main-title {
    font-size: 3.5rem;
  }
}

@media (max-width: 768px) {
  .novel-gallery-page {
    flex-direction: column;
  }
  
  .left-section {
    flex: 0 0 50vh;
  }
  
  .center-divider {
    flex: 0 0 40px;
    flex-direction: row;
  }
  
  .divider-line {
    width: 100%;
    height: 1px;
  }
  
  .divider-dots {
    flex-direction: row;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  
  .right-section {
    flex: 1;
    padding: 2rem 1.5rem;
  }
  
  .main-title {
    font-size: 2.5rem;
  }
}
</style>


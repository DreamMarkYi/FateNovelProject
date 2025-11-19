<template>
  <div class="chapter-page">

    <SowakaNavigation
        :mobile-menu-open="mobileMenuOpen"
        @toggle-mobile-menu="toggleMobileMenu"
        @scroll-to-section="scrollToSection"
    />

    <!-- 背景层 -->
    <div class="background-layer">
      <img src="/chapterBG.jpg"/>
    </div>
    
    <!-- 主容器 -->
    <div class="page-container">
      <!-- 顶部标题栏 -->
      <div class="page-header">
        <div class="header-title">花と蜜 - 章节阅读</div>
        <div class="header-subtitle">Henticity × Shibu</div>
      </div>
      
      <!-- 章节展示区 -->
      <div class="chapter-display">
        <!-- 上一章按钮 -->
        <button 
          class="nav-btn prev-btn" 
          @click="prevChapter"
          :disabled="currentChapter === 0"
          :class="{ disabled: currentChapter === 0 }"
        >
          ‹
        </button>
        
        <!-- 章节卡片 -->
        <ChapterCard :chapter="chapters[currentChapter]" :key="currentChapter" />
        
        <!-- 下一章按钮 -->
        <button 
          class="nav-btn next-btn" 
          @click="nextChapter"
          :disabled="currentChapter === chapters.length - 1"
          :class="{ disabled: currentChapter === chapters.length - 1 }"
        >
          ›
        </button>
      </div>
      
      <!-- 章节指示器 -->
      <div class="chapter-indicators">
        <div 
          v-for="(chapter, index) in chapters" 
          :key="index"
          class="indicator-dot"
          :class="{ active: index === currentChapter }"
          @click="goToChapter(index)"
        ></div>
      </div>
      
      <!-- 章节信息 -->
      <div class="chapter-info">
        {{ currentChapter + 1 }} / {{ chapters.length }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ChapterCard from '@/components/ChapterCard.vue'
import SowakaNavigation from "@/components/sowaka/SowakaNavigation.vue";

const currentChapter = ref(0)

// 章节数据
const chapters = [
  {
    number: 'CH.01',
    verticalTitle: '花<br>と<br>蜜',
    leftBackgroundImage:'/chapterLeftBackGround.png',
    bottomTitle: '蜜と花',
    leftSidebar: 'Promise of Beyond<br>Henticity x Shibu<br><span style="margin-top: 15px; display: block;">第一章 / Chapter 01</span>',
    gradient: 'linear-gradient(135deg, #b8a8d8 0%, #e8c8e8 40%, #f5d8c8 70%, #ffe8d8 100%)',
    englishTitle: 'FLOWER & HONEY',
    subTitle: '花与蜜的约定',
    content: [
      '今度は私が、毒のリンゴを食べさせてあげる。',
      '人里離れた森奥で、竜母の血由来と娘の寄生体を養らしている。',
      '雪容は幼い頃から、血由来に愛されようと必死だった。',
      '血由来は竜に宛てようと差し出し、注目を独占める雪容に対し、',
      '血由来はいらぬ者を嫌って、雪容をと著者にしようとするが……。'
    ],
    illustrationGradient: 'linear-gradient(135deg, #d8b8c8 0%, #e8c8d8 100%)',
    illustrationImage: './SubImage1.png', // 在这里添加图片路径，例如: '/images/chapter01.jpg'
    decorativeText: 'イラスト: あいだ / Written by あいだ',
    verticalAccent: 'W<br>H<br>I<br>T<br>E'
  },
  {
    number: 'CH.02',
    verticalTitle: '桜<br>の<br>雫',
    leftBackgroundImage:'',
    bottomTitle: '雫と桜',
    leftSidebar: 'Drops of Cherry Blossom<br><span style="margin-top: 15px; display: block;">第二章 / Chapter 02</span>',
    gradient: 'linear-gradient(135deg, #d8b8c8 0%, #f5d0e8 40%, #ffd8c8 70%, #fff0e8 100%)',
    englishTitle: 'SAKURA DROPS',
    subTitle: '樱花雨的记忆',
    content: [
      '桜の花びらが舞い散る中で、',
      '二人は初めて出会った。',
      '運命とも呼べる、偶然の邂逅。',
      'それは春の訪れとともに、',
      '新しい物語の始まりを告げていた。'
    ],
    illustrationGradient: 'linear-gradient(135deg, #f5d0e8 0%, #ffc8d8 100%)',
    illustrationImage: '', // 在这里添加图片路径，例如: '/images/chapter02.jpg'
    decorativeText: 'Spring - Presented by Eruu',
    verticalAccent: 'S<br>P<br>R<br>I<br>N<br>G'
  },
  {
    number: 'CH.03',
    verticalTitle: '月<br>と<br>星',
    leftBackgroundImage:'',
    bottomTitle: '星と月',
    leftSidebar: 'Moon and Stars<br><span style="margin-top: 15px; display: block;">第三章 / Chapter 03</span>',
    gradient: 'linear-gradient(135deg, #c8b8e8 0%, #e8c5d8 40%, #f5d0c8 70%, #ffe8d0 100%)',
    englishTitle: 'CELESTIAL',
    subTitle: '星月夜的誓言',
    content: [
      '夜空に輝く月と星のように、',
      '二人は互いを照らし合う。',
      '遠く離れていても、同じ空を見上げる。',
      '永遠に続く、この約束を胸に、',
      '明日へと歩み続ける。'
    ],
    illustrationGradient: 'linear-gradient(135deg, #c8b8e8 0%, #e8d5f0 100%)',
    illustrationImage: '', // 在这里添加图片路径，例如: '/images/chapter03.jpg'
    decorativeText: 'Night - Written by aida',
    verticalAccent: 'N<br>I<br>G<br>H<br>T'
  },
  {
    number: 'CH.04',
    verticalTitle: '風<br>と<br>雨',
    leftBackgroundImage:'',
    bottomTitle: '雨と風',
    leftSidebar: 'Wind and Rain<br><span style="margin-top: 15px; display: block;">第四章 / Chapter 04</span>',
    gradient: 'linear-gradient(135deg, #a8c8e8 0%, #d8c8e8 40%, #e8d0d8 70%, #f5e8e0 100%)',
    englishTitle: 'STORM',
    subTitle: '风雨交织的考验',
    content: [
      '嵐の中で二人は試される。',
      '吹き荒れる風、激しい雨。',
      'それでも手を離さず、',
      '互いを信じて進み続ける。',
      '試練を越えた先に、光が待っている。'
    ],
    illustrationGradient: 'linear-gradient(135deg, #a8c8e8 0%, #d8e0f0 100%)',
    illustrationImage: '', // 在这里添加图片路径，例如: '/images/chapter04.jpg'
    decorativeText: 'Storm - Presented by Eruu',
    verticalAccent: 'S<br>T<br>O<br>R<br>M'
  },
  {
    number: 'CH.05',
    verticalTitle: '夢<br>と<br>現',
    leftBackgroundImage:'',
    bottomTitle: '現と夢',
    leftSidebar: 'Dream and Reality<br><span style="margin-top: 15px; display: block;">第五章 / Chapter 05</span>',
    gradient: 'linear-gradient(135deg, #e8b8d8 0%, #f5c8e8 40%, #ffd8d8 70%, #fff0e8 100%)',
    englishTitle: 'REVERIE',
    subTitle: '梦与现实的边界',
    content: [
      '夢と現実の境界が曖昧になる。',
      '本当の幸せはどこにあるのか。',
      '目を閉じれば夢の世界、',
      '目を開ければ現実の世界。',
      'どちらも大切な、二人の物語。'
    ],
    illustrationGradient: 'linear-gradient(135deg, #e8b8d8 0%, #f5d8f0 100%)',
    illustrationImage: '', // 在这里添加图片路径，例如: '/images/chapter05.jpg'
    decorativeText: 'Dream - Written by aida',
    verticalAccent: 'D<br>R<br>E<br>A<br>M'
  },
  {
    number: 'CH.06',
    verticalTitle: '光<br>と<br>影',
    leftBackgroundImage:'',
    bottomTitle: '影と光',
    leftSidebar: 'Light and Shadow<br><span style="margin-top: 15px; display: block;">第六章 / Chapter 06</span>',
    gradient: 'linear-gradient(135deg, #c8a8b8 0%, #e8c0d0 40%, #f5d8d0 70%, #ffe8e0 100%)',
    englishTitle: 'CONTRAST',
    subTitle: '光与影的对比',
    content: [
      '光があれば影がある。',
      '表と裏、陽と陰。',
      '相反するものが共存する世界で、',
      '二人は互いの存在意義を見つける。',
      'どちらも欠かせない、運命の片割れ。'
    ],
    illustrationGradient: 'linear-gradient(135deg, #c8a8b8 0%, #e8d0e0 100%)',
    illustrationImage: '', // 在这里添加图片路径，例如: '/images/chapter06.jpg'
    decorativeText: 'Duality - Presented by Eruu',
    verticalAccent: 'D<br>U<br>A<br>L'
  },
  {
    number: 'CH.07',
    verticalTitle: '空<br>と<br>海',
    leftBackgroundImage:'',
    bottomTitle: '海と空',
    leftSidebar: 'Sky and Sea<br><span style="margin-top: 15px; display: block;">第七章 / Chapter 07</span>',
    gradient: 'linear-gradient(135deg, #b8d8e8 0%, #d0e8f0 40%, #e8f0f5 70%, #f5f8ff 100%)',
    englishTitle: 'HORIZON',
    subTitle: '海天一色的远方',
    content: [
      '水平線の彼方に見える未来。',
      '空と海が溶け合う場所で、',
      '二人は新しい世界を夢見る。',
      '果てしない広がりの中で、',
      '無限の可能性を感じながら。'
    ],
    illustrationGradient: 'linear-gradient(135deg, #b8d8e8 0%, #d0e8ff 100%)',
    illustrationImage: '', // 在这里添加图片路径，例如: '/images/chapter07.jpg'
    decorativeText: 'Horizon - Written by aida',
    verticalAccent: 'B<br>L<br>U<br>E'
  },
  {
    number: 'CH.08',
    verticalTitle: '終<br>と<br>始',
    leftBackgroundImage:'',
    bottomTitle: '始と終',
    leftSidebar: 'Beginning and End<br><span style="margin-top: 15px; display: block;">第八章 / Chapter 08</span>',
    gradient: 'linear-gradient(135deg, #d8b8e8 0%, #e8c8f0 40%, #f5d8e8 70%, #ffe8f5 100%)',
    englishTitle: 'ETERNITY',
    subTitle: '永恒的轮回',
    content: [
      '終わりは新しい始まり。',
      '円環する時の中で、',
      '二人は永遠を誓い合う。',
      '何度生まれ変わっても、',
      'また出会える、そう信じて。'
    ],
    illustrationGradient: 'linear-gradient(135deg, #d8b8e8 0%, #e8d8ff 100%)',
    illustrationImage: '', // 在这里添加图片路径，例如: '/images/chapter08.jpg'
    decorativeText: 'Eternity - Presented by Eruu',
    verticalAccent: 'E<br>N<br>D'
  }
]

// 切换到上一章
const prevChapter = () => {
  if (currentChapter.value > 0) {
    currentChapter.value--
  }
}

// 切换到下一章
const nextChapter = () => {
  if (currentChapter.value < chapters.length - 1) {
    currentChapter.value++
  }
}

// 跳转到指定章节
const goToChapter = (index) => {
  currentChapter.value = index
}

// 键盘导航
const handleKeydown = (e) => {
  if (e.key === 'ArrowLeft') {
    prevChapter()
  } else if (e.key === 'ArrowRight') {
    nextChapter()
  }
}

// 触摸滑动
let touchStartX = 0
let touchEndX = 0

const handleTouchStart = (e) => {
  touchStartX = e.changedTouches[0].screenX
}

const handleTouchEnd = (e) => {
  touchEndX = e.changedTouches[0].screenX
  handleSwipe()
}

const handleSwipe = () => {
  if (touchEndX < touchStartX - 50) {
    nextChapter()
  }
  if (touchEndX > touchStartX + 50) {
    prevChapter()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('touchstart', handleTouchStart)
  document.addEventListener('touchend', handleTouchEnd)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.chapter-page {
  font-family: 'Yu Mincho', 'YuMincho', 'Hiragino Mincho ProN', 'MS Mincho', 'Noto Serif JP', serif;
  min-height: 100vh;
  background: transparent;
  overflow-x: hidden;
  position: relative;
}

/* 背景层 */
.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #efefef 100%);
  z-index: -1;
}

.background-layer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 30%, rgba(184, 168, 216, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(232, 200, 232, 0.08) 0%, transparent 50%);
}

/* 主容器 */
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 100px 40px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
}

/* 顶部标题栏 */
.page-header {
  text-align: center;
  margin-bottom: 20px;
}

.header-title {
  font-size: 2rem;
  font-weight: 300;
  color: #666;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  margin-bottom: 10px;
}

.header-subtitle {
  font-size: 0.9rem;
  color: #999;
  letter-spacing: 0.2em;
  font-weight: 300;
}

/* 章节展示区 */
.chapter-display {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  width: 100%;
  padding: 0 20px;
}

/* 导航按钮 */
.nav-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(0, 0, 0, 0.1);
  color: #333;
  font-size: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  user-select: none;
  flex-shrink: 0;
}

.nav-btn:hover:not(.disabled) {
  background: white;
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.nav-btn:active:not(.disabled) {
  transform: scale(0.95);
}

.nav-btn.disabled {
  opacity: 0.2;
  cursor: not-allowed;
  pointer-events: none;
}

/* 章节指示器 */
.chapter-indicators {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator-dot:hover {
  background: rgba(0, 0, 0, 0.4);
}

.indicator-dot.active {
  background: rgba(0, 0, 0, 0.7);
  width: 35px;
  border-radius: 5px;
}

/* 章节信息 */
.chapter-info {
  text-align: center;
  font-size: 1.1rem;
  color: #999;
  letter-spacing: 0.3em;
  margin-top: 10px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .chapter-display {
    flex-direction: column;
    gap: 30px;
  }
  
  .nav-btn {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
  }
  
  .prev-btn {
    left: 20px;
  }
  
  .next-btn {
    right: 20px;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 40px 20px;
  }
  
  .header-title {
    font-size: 1.5rem;
  }
  
  .header-subtitle {
    font-size: 0.8rem;
  }
  
  .nav-btn {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
  
  .prev-btn {
    left: 10px;
  }
  
  .next-btn {
    right: 10px;
  }
  
  .chapter-indicators {
    gap: 8px;
  }
  
  .indicator-dot {
    width: 8px;
    height: 8px;
  }
  
  .indicator-dot.active {
    width: 25px;
  }
}
</style>


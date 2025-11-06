<template>
  <section class="unified-content-section fade-in">
    <div class="unified-content-container">
      <!-- First Part - Introduction Text -->
      <div class="content-block text-center-block">
        <p>「そわか」とは、サンスクリット語で「幸あれ」の意味。</p>
        <p>仏教の経典の最後にもしばしば用いられるこの祝福の言葉は</p>
        <p>耳に馴染みをして、そして新しく、仏教発祥の美しい響きとして皆様に届きます。</p>
        <p>エントランスをくぐり、打ち水のされた石畳を歩めばそこは、静けさに包まれた別世界。</p>
        <p>坪庭の緑に目を潤し、そよぐ風を感じながらお部屋で寛ぐ。</p>
      </div>

      <!-- Second Part - Main Story with Image -->
      <div class="content-block story-with-image-block">
        <div class="story-header-large">
          <h2>{{ sowakaStory.title }}</h2>
          <p class="subtitle">{{ sowakaStory.subtitle }}</p>
        </div>

        <div class="story-layout">
          <div class="story-image-left" @click="nextContent" :class="{ 'switching': isSwitching }">
            <transition name="image-fade" mode="out-in">
              <img 
                v-if="currentImage" 
                :key="currentIndex"
                :src="currentImage" 
                :alt="sowakaStory.title"
                @load="onImageLoad"
                @error="onImageError"
              />
            </transition>
            <!-- Loading indicator -->
            <div v-if="isImageLoading" class="image-loading">
              <div class="loading-spinner"></div>
            </div>
            <!-- Image placeholder when no image -->
          </div>

          <div class="story-text-right" @click="nextContent" :class="{ 'switching': isSwitching }">
            <transition name="text-slide" mode="out-in">
              <div :key="currentIndex" class="text-content">
                <p v-for="(paragraph, index) in currentTextArray" :key="index">
                  {{ paragraph }}
                </p>
              </div>
            </transition>
            <p class="author-signature">{{ sowakaStory.authorSignature }}</p>
          </div>
        </div>
        
        <!-- 内容指示器 -->
        <div v-if="totalContentCount > 1" class="content-indicators">
          <div 
            v-for="(item, index) in totalContentCount" 
            :key="index"
            class="indicator-dot"
            :class="{ 'active': index === currentIndex }"
            @click="switchToIndex(index)"
          ></div>
        </div>
      </div>

      <!-- Third Part - Closing Message -->
      <div class="content-block text-center-block-final">
        <p>恵まれたロケーションもさることながら、このホテルの最大の魅力は、</p>
        <p>古き良きものと新しきものが融合した贅沢な空間にあります。</p>
        <p>日本の旬を贅沢に堪能するレストラン祇園 ろかせ、自由で美しき和食の世界を味わう。</p>
        <p>皆さま人のように、フットワーク軽く街を歩く。</p>
        <p>訪れる方々に幸いあれ、祝福あれ。</p>
        <p>数多なる幸せを、「そわか」でこころゆくまでお楽しみください。</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// 如果使用 src/assets 中的图片，需要这样导入
// import defaultStoryImage from '@/assets/images/sowaka-story.jpg'

const props = defineProps({
  sowakaStory: {
    type: Object,
    required: true
  }
})

// 当前内容索引
const currentIndex = ref(0)

// 动画状态管理
const isSwitching = ref(false)
const isImageLoading = ref(false)

// 计算属性：当前显示的图片
const currentImage = computed(() => {
  if (!props.sowakaStory.storyImageLeft || !Array.isArray(props.sowakaStory.storyImageLeft)) {
    return props.sowakaStory.storyImageLeft || ''
  }
  return props.sowakaStory.storyImageLeft[currentIndex.value] || ''
})

// 计算属性：当前显示的文本数组
const currentTextArray = computed(() => {
  if (!props.sowakaStory.storyTextRight || !Array.isArray(props.sowakaStory.storyTextRight)) {
    return props.sowakaStory.storyTextRight || []
  }
  
  // 如果 storyTextRight 是二维数组（每个元素都是数组）
  if (Array.isArray(props.sowakaStory.storyTextRight[0])) {
    return props.sowakaStory.storyTextRight[currentIndex.value] || []
  }
  
  // 如果 storyTextRight 是一维数组，直接返回
  return props.sowakaStory.storyTextRight
})

// 计算属性：总内容数量
const totalContentCount = computed(() => {
  if (!props.sowakaStory.storyImageLeft || !Array.isArray(props.sowakaStory.storyImageLeft)) {
    return 0
  }
  return Math.max(
    props.sowakaStory.storyImageLeft?.length || 0,
    props.sowakaStory.storyTextRight?.length || 0
  )
})

// 切换到下一个内容
const nextContent = async () => {
  if (!props.sowakaStory.storyImageLeft || !Array.isArray(props.sowakaStory.storyImageLeft)) {
    return
  }
  
  // 防止快速连续点击
  if (isSwitching.value) {
    return
  }
  
  const maxLength = Math.max(
    props.sowakaStory.storyImageLeft?.length || 0,
    props.sowakaStory.storyTextRight?.length || 0
  )
  
  if (maxLength > 1) {
    isSwitching.value = true
    isImageLoading.value = true
    
    // 切换索引
    currentIndex.value = (currentIndex.value + 1) % maxLength
    
    // 动画完成后重置状态
    setTimeout(() => {
      isSwitching.value = false
    }, 600) // 与CSS动画时间保持一致
  }
}

// 图片加载完成处理
const onImageLoad = () => {
  isImageLoading.value = false
}

// 图片加载错误处理
const onImageError = () => {
  isImageLoading.value = false
  console.warn('图片加载失败:', currentImage.value)
}

// 切换到指定索引
const switchToIndex = (index) => {
  if (isSwitching.value || index === currentIndex.value) {
    return
  }
  
  if (index >= 0 && index < totalContentCount.value) {
    isSwitching.value = true
    isImageLoading.value = true
    currentIndex.value = index
    
    setTimeout(() => {
      isSwitching.value = false
    }, 600)
  }
}

// 监听 sowakaStory 变化，重置索引
watch(() => props.sowakaStory, () => {
  currentIndex.value = 0
}, { deep: true })
</script>

<style scoped>
/* Unified Content Section */
.unified-content-section {
  background-color: #faf9f7;
}

.unified-content-container {
  max-width: 1400px;
  margin: 0 auto;
}

.content-block {
  padding: 100px 50px;
}

/* Text Center Blocks */
.text-center-block,
.text-center-block-final {
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.text-center-block p,
.text-center-block-final p {
  font-size: 15px;
  line-height: 3;
  color: #555;
  margin-bottom: 10px;
  letter-spacing: 0.08em;
}

.text-center-block {
  background-color: #faf9f7;
}

.text-center-block-final {
  background-color: #faf9f7;
  padding-bottom: 120px;
}

/* Story with Image Block */
.story-with-image-block {
  background-color: #faf9f7 !important;
  padding: 120px 50px !important;
}

.story-header-large {
  text-align: center;
  margin-bottom: 100px;
}



.story-header-large h2 {
  font-size: 42px;
  font-weight: 300;
  letter-spacing: 8px;
  color: #555;
  margin-bottom: 20px;
}

.story-header-large .subtitle {
  font-size: 13px;
  letter-spacing: 3px;
  color: #999;
  text-transform: uppercase;
}

.story-layout {
  display: grid;
  grid-template-columns: 45% 55%;
  gap: 0;
  max-width: 1300px;
  margin: 0 auto;
}

.story-image-left {
  background: linear-gradient(135deg, #d4c5b0 0%, #c4b5a0 100%);
  min-height: 600px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.story-image-left:hover {
  transform: scale(1.02);
}

.story-image-left img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.story-image-left::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.05) 100%);
  z-index: 1;
}

.story-text-right {
  background-color: #fff;
  padding: 80px 70px;
  border-left: 3px solid #c9a96e;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.story-text-right:hover {
  background-color: #fafafa;
}

.story-text-right p {
  font-size: 14px;
  line-height: 2.5;
  color: #666;
  margin-bottom: 25px;
  letter-spacing: 0.05em;
}

.story-text-right .author-signature {
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-top: 50px;
  font-style: italic;
}

/* 动画样式 */
/* 图片淡入淡出动画 */
.image-fade-enter-active,
.image-fade-leave-active {
  transition: all 0.5s ease-in-out;
}

.image-fade-enter-from {
  opacity: 0;
  transform: scale(1.05);
}

.image-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 文字滑动动画 */
.text-slide-enter-active,
.text-slide-leave-active {
  transition: all 0.4s ease-in-out;
}

.text-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.text-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 切换状态样式 */
.story-image-left.switching {
  pointer-events: none;
}

.story-text-right.switching {
  pointer-events: none;
}

/* 加载动画 */
.image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #c9a96e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 文本内容容器 */
.text-content {
  width: 100%;
}

/* 增强的悬停效果 */
.story-image-left:not(.switching):hover {
  transform: scale(1.02);
  transition: transform 0.3s ease;
}

.story-text-right:not(.switching):hover {
  background-color: #fafafa;
  transition: background-color 0.3s ease;
}

/* 点击反馈效果 */
.story-image-left:active {
  transform: scale(0.98);
}

.story-text-right:active {
  background-color: #f5f5f5;
}

/* 内容指示器样式 */
.content-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 40px;
  padding: 20px;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ddd;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.indicator-dot:hover {
  background-color: #c9a96e;
  transform: scale(1.2);
}

.indicator-dot.active {
  background-color: #c9a96e;
  transform: scale(1.3);
  box-shadow: 0 0 10px rgba(201, 169, 110, 0.4);
}

.indicator-dot.active::after {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid #c9a96e;
  border-radius: 50%;
  opacity: 0.3;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.1;
  }
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
}

/* Scroll Animations */
.fade-in {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s, transform 0.8s;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
  .content-block {
    padding: 60px 20px;
  }

  .story-header-large h2 {
    font-size: 32px;
    letter-spacing: 4px;
  }

  .story-layout {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .story-text-right {
    padding: 40px 30px;
  }
  
  /* 移动端动画优化 */
  .image-fade-enter-active,
  .image-fade-leave-active {
    transition: all 0.3s ease-in-out;
  }
  
  .text-slide-enter-active,
  .text-slide-leave-active {
    transition: all 0.25s ease-in-out;
  }
  
  .text-slide-enter-from {
    transform: translateX(20px);
  }
  
  .text-slide-leave-to {
    transform: translateX(-20px);
  }
  
  /* 移动端指示器 */
  .content-indicators {
    margin-top: 20px;
    padding: 15px;
    gap: 10px;
  }
  
  .indicator-dot {
    width: 10px;
    height: 10px;
  }
  
  .loading-spinner {
    width: 30px;
    height: 30px;
    border-width: 2px;
  }
}
</style>

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
          <div class="story-image-left" @click="nextContent">
            <img v-if="currentImage" :src="currentImage" :alt="sowakaStory.title" />
            <!-- Image placeholder when no image -->
          </div>

          <div class="story-text-right" @click="nextContent">
            <p v-for="(paragraph, index) in currentTextArray" :key="index">
              {{ paragraph }}
            </p>
            <p class="author-signature">{{ sowakaStory.authorSignature }}</p>
          </div>
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

// 切换到下一个内容
const nextContent = () => {
  if (!props.sowakaStory.storyImageLeft || !Array.isArray(props.sowakaStory.storyImageLeft)) {
    return
  }
  
  const maxLength = Math.max(
    props.sowakaStory.storyImageLeft?.length || 0,
    props.sowakaStory.storyTextRight?.length || 0
  )
  
  if (maxLength > 1) {
    currentIndex.value = (currentIndex.value + 1) % maxLength
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
}
</style>

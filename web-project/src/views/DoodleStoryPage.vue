<template>
  <div class="container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-text">正在加载涂鸦故事...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-text">{{ error }}</div>
      <button @click="loadStories" class="retry-btn">重试</button>
    </div>

    <!-- 正常内容 -->
    <template v-else-if="stories.length > 0">
      <aside class="sidebar">
        <div class="sidebar-text">Sketchbook</div>

        <div class="nav-controls">
          <button
              class="nav-btn prev-btn"
              @click="prevPage"
              :disabled="currentIndex === 0"
              title="上一页"
          >
            ↑
          </button>
          <span class="page-indicator">{{ currentIndex + 1 }} / {{ stories.length }}</span>
          <button
              class="nav-btn next-btn"
              @click="nextPage"
              :disabled="currentIndex === stories.length - 1"
              title="下一页"
          >
            ↓
          </button>
        </div>
      </aside>

      <transition name="book-flip" mode="out-in">

        <div class="page-wrapper" :key="currentIndex">

          <section class="text-section">
            <div class="date-mark">{{ currentStory.dateMark }}</div>

            <h1>{{ currentStory.date }}</h1>

            <div class="content-body">
              <p v-for="(paragraph, index) in currentStory.content" :key="index">
                {{ paragraph }}
              </p>
            </div>

            <div class="signature">
              <div class="sign-name">{{ currentStory.signature }}</div>
            </div>
          </section>

          <section class="image-section">
            <div class="doodle-frame">
              <img :src="currentStory.image" :alt="currentStory.title">
            </div>
          </section>

        </div>
      </transition>
    </template>

    <!-- 空数据状态 -->
    <div v-else class="empty-container">
      <div class="empty-text">暂无涂鸦故事数据</div>
    </div>

  </div>
</template>

<script>
import doodleStoryApi from '@/api/doodleStoryApi'

export default {
  name: 'DoodleStoryPage',
  data() {
    return {
      currentIndex: 0,
      stories: [],
      loading: true,
      error: null
    }
  },
  computed: {
    currentStory() {
      return this.stories[this.currentIndex] || {};
    }
  },
  async mounted() {
    await this.loadStories();
  },
  methods: {
    async loadStories() {
      try {
        this.loading = true;
        this.error = null;
        
        console.log('📖 开始加载涂鸦故事数据...');
        const response = await doodleStoryApi.getActiveDoodleStories();
        
        if (response.success && response.data && response.data.length > 0) {
          // 将数据库中的数据映射到前端需要的格式
          this.stories = response.data.map(story => ({
            dateMark: story.dateMark || '',
            date: story.date || '',
            title: story.title || '',
            content: Array.isArray(story.content) ? story.content : [],
            signature: story.signature || '遥',
            image: story.image || ''
          }));
          
          console.log(`✅ 成功加载 ${this.stories.length} 个涂鸦故事`);
        } else {
          console.warn('⚠️ 涂鸦故事数据为空或加载失败');
          this.error = '暂无涂鸦故事数据';
          // 使用空数组作为后备
          this.stories = [];
        }
      } catch (err) {
        console.error('加载涂鸦故事失败:', err);
        this.error = '加载涂鸦故事失败，请确保后端服务器正在运行';
        // 使用空数组作为后备
        this.stories = [];
      } finally {
        this.loading = false;
      }
    },
    nextPage() {
      if (this.currentIndex < this.stories.length - 1) {
        this.currentIndex++;
      }
    },
    prevPage() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Zhi+Mang+Xing&display=swap');

/* --- 全局设置 --- */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  display: flex;
  height: 100vh;
  width: 100vw;
  font-family: 'Caveat', 'Zhi Mang Xing', cursive;
  color: #2c3e50;
  background-color: #fff; /* 这里的背景色作为书本底色 */
  overflow: hidden;
  /* 关键：为3D翻页增加透视感 */
  perspective: 2000px;
}

/* --- 左侧边栏 --- */
.sidebar {
  width: 12%; min-width: 100px;
  background-color: #fcfcfc;
  display: flex;
  flex-direction: column; /* 改为纵向排列以容纳按钮 */
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: inset -10px 0 20px -10px rgba(0,0,0,0.05);
  z-index: 10; /* 确保侧边栏在翻页层之上 */
  position: relative;
}

.sidebar-text {
  writing-mode: vertical-rl; text-orientation: upright;
  letter-spacing: 0.6em; font-size: 12px; color: #bbb;
  font-family: sans-serif; text-transform: uppercase;
  flex: 1; /* 占据剩余空间 */
  display: flex; justify-content: center; align-items: center;
}

/* 导航按钮样式 */
.nav-controls {
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.nav-btn {
  background: none;
  border: 2px solid #ddd;
  border-radius: 50%;
  width: 40px; height: 40px;
  cursor: pointer;
  font-family: 'Caveat', cursive;
  font-size: 1.2rem;
  color: #888;
  transition: all 0.3s ease;
}

.nav-btn:hover:not(:disabled) {
  border-color: #b85c5c;
  color: #b85c5c;
  transform: scale(1.1);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 0.9rem;
  color: #bbb;
  font-family: 'Caveat', cursive;
}

/* --- 翻页包裹容器 --- */
/* 这个容器包裹 Text 和 Image 两个 section，模拟一张完整的纸 */
.page-wrapper {
  flex: 1;
  display: flex;
  height: 100%;
  width: 100%;
  background-color: #fff;
  /* 关键：设置旋转原点在左侧，模拟书脊 */
  transform-origin: left center;
  box-shadow: -5px 0 15px rgba(0,0,0,0.05);
}

/* --- 动画定义: 书本翻页效果 --- */
.book-flip-enter-active {
  transition: all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
}
.book-flip-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* 进入时：从右侧像翻书一样盖过来，或者像新纸张展开 */
.book-flip-enter-from {
  transform: rotateY(-20deg); /* 稍微折叠 */
  opacity: 0;
  filter: blur(2px);
}

/* 离开时：向左翻过去，或者像旧纸张被掀开 */
.book-flip-leave-to {
  transform: rotateY(-15deg) translateX(-20px);
  opacity: 0;
}

/* 确保进入和离开状态是平展的 */
.book-flip-enter-to, .book-flip-leave-from {
  transform: rotateY(0deg);
  opacity: 1;
  filter: blur(0);
}


/* --- 中间文字区 (原有样式微调) --- */
.text-section {
  width: 45%;
  padding: 0 8%;
  display: flex; flex-direction: column; justify-content: center;
  background-color: #ffffff;
  z-index: 2;
}
.date-mark {
  margin-top: 80px;
  font-size: 1.2rem;
  color: #999;
  text-align: right;
  transform: rotate(-2deg);
  font-family: 'Caveat', 'Zhi Mang Xing', cursive;
}
h1 {
  font-size: 3.5rem;
  font-weight: 500;
  margin-bottom: 50px;
  line-height: 1.2;
  color: #000;
  transform: rotate(-1deg);
  font-family: 'Caveat', 'Zhi Mang Xing', cursive;
}
.content-body {
  font-size: 1.5rem;
  line-height: 1.8;
  color: #34495e;
  margin-bottom: 60px;
  font-family: 'Caveat', 'Zhi Mang Xing', cursive;
}

.content-body p {
  margin: 0 0 0.5em 0;
  text-indent: 2em;
}
.signature {
  margin-top: auto;
  text-align: right;
  padding-bottom: 40px;
}
.sign-name {
  font-size: 3rem;
  color: #b85c5c;
  font-weight: lighter;
  transform: rotate(-3deg);
  display: inline-block;
  font-family: 'Caveat', 'Zhi Mang Xing', cursive;
}

/* --- 右侧区域 --- */
.image-section {
  flex: 1;
  height: 100%;
  background-color: #ffffff;
  margin-left: -180px;
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  position: relative;
  overflow: hidden;
}

/* ... (保留 ::before 和 ::after 装饰元素不变) ... */

/* 图片的外框容器 */
.doodle-frame {
  /* 1. 改为填满父容器，作为一个巨大的画布 */
  width: 100%;
  height: 100%;

  /* 2. 使用 Flexbox 确保图片始终居中 */
  display: flex;
  align-items: center;
  justify-content: center;

  background: transparent;

  /* 3. 保留之前的旋转风格，但去掉了 left: 100px 的硬偏移，
        改用 justify-content 控制，或者在这里微调 */
  transform: rotate(4deg) translateX(50px);
  position: relative;
}

/* 图片本体 */
.doodle-frame img {
  /* 核心修改：不再强制 width: 60% */

  /* 4. 让宽高自适应，保持原图比例 */
  width: auto;
  height: auto;
  /* 5. 限制最大尺寸：既不能太宽，也不能太高 */
  /* 限制宽度不超过父容器的 70% */
  max-width: 80%;
  /* 关键点：限制高度不超过屏幕高度的 60% (避免长图撑爆) */
  max-height: 80vh;

  object-fit: contain;

  /* 保持原来的滤镜效果 */
  mix-blend-mode: multiply;
  opacity: 0.9;
  transition: transform 1s ease;

  /* 增加一个轻微的阴影，增加纸张剪贴感 */
  filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.1));
}

/* --- 加载和错误状态 --- */
.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  font-family: 'Caveat', 'Zhi Mang Xing', cursive;
  color: #2c3e50;
}

.loading-text,
.error-text,
.empty-text {
  font-size: 1.5rem;
  color: #888;
  margin-bottom: 20px;
}

.error-text {
  color: #b85c5c;
}

.retry-btn {
  padding: 10px 20px;
  background-color: #b85c5c;
  color: white;
  border: none;
  border-radius: 5px;
  font-family: 'Caveat', cursive;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.retry-btn:hover {
  background-color: #a04949;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
    overflow-y: auto;
    perspective: none; /* 移动端取消3D透视，避免滚动问题 */
  }
  .page-wrapper {
    flex-direction: column;
    transform: none !important; /* 移动端取消3D旋转 */
    opacity: 1 !important;
  }
  .sidebar {
    width: 100%;
    height: auto;
    padding: 10px;
    flex-direction: row; /* 移动端横向排列 */
    justify-content: space-between;
  }
  .sidebar-text {
    writing-mode: horizontal-tb;
    font-size: 14px;
    flex: 0;
  }
  .nav-controls {
    flex-direction: row;
    margin-bottom: 0;
  }
  .text-section {
    width: 100%;
    padding: 60px 30px;
  }
  .image-section {
    width: 100%;
    min-height: 500px;
    padding: 40px 0;
    margin-left: 0;
  }
  .doodle-frame {
    width: 85%;
    left: 0;
  }
  .image-section::after {
    display: none;
  }

  /* 移动端改为简单的淡入淡出 */
  .book-flip-enter-active, .book-flip-leave-active {
    transition: opacity 0.3s ease;
  }
  .book-flip-enter-from, .book-flip-leave-to {
    transform: none;
    opacity: 0;
  }
}
</style>
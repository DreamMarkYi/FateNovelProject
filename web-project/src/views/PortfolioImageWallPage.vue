<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { portfolioProjects } from '@/data/portfolioData'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'

const POLL_INTERVAL_MS = 5000
const COLUMN_COUNT = 6
const ROW_COUNT = 3
const PAGE_SIZE = COLUMN_COUNT * ROW_COUNT

const remoteArticles = ref([])
const lastSyncText = ref('未同步')
const syncError = ref('')

let pollTimer = null

function normalizeRemoteProject(article, index) {
  const typeIndex = (index % 3) + 1
  const tags = article.tags || 'UNTAGGED'
  const summary = article.summary || '暂无摘要'

  return {
    id: article.id,
    number: String(index + 1).padStart(2, '0'),
    typeClass: `card-type-${typeIndex}`,
    title: article.title || '未命名项目',
    description: summary,
    tags,
    image: article.coverImage || '',
    showInGallery: article.showInGallery !== false,
  }
}

async function loadRemoteArticles() {
  try {
    const response = await portfolioArticleApi.listArticles()
    const list = Array.isArray(response?.data) ? response.data : []
    remoteArticles.value = list.map(normalizeRemoteProject)
    lastSyncText.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    syncError.value = ''
  } catch (error) {
    syncError.value = '文件夹同步失败，当前展示本地示例数据'
  }
}

const displayedProjects = computed(() => {
  if (remoteArticles.value.length > 0) {
    return remoteArticles.value.filter((item) => item.showInGallery !== false)
  }
  return portfolioProjects.filter((item) => item.showInGallery !== false)
})
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(displayedProjects.value.length / PAGE_SIZE)))
const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return displayedProjects.value.slice(start, end)
})
const pageNumbers = computed(() =>
    Array.from({ length: totalPages.value }, (_, index) => index + 1)
)

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages
  }
})

function setPage(page) {
  if (page < 1 || page > totalPages.value) {
    return
  }
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  await loadRemoteArticles()
  pollTimer = window.setInterval(loadRemoteArticles, POLL_INTERVAL_MS)
})

onUnmounted(() => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
  }
})
</script>

<template>
  <div class="portfolio-image-wall-page">
    <nav>
      <div class="container nav-inner">
        <router-link to="/portfolio" class="logo">COLLECTION</router-link>
        <ul class="nav-links">
          <li><router-link to="/portfolio/catalog">CATALOG</router-link></li>
          <li><router-link to="/portfolio-config">WORKSPACE</router-link></li>
        </ul>
      </div>
    </nav>

    <section class="section">
      <div class="container heading-wrap">
        <!-- 新增：背景水印，填补大面积空白 -->
        <div class="watermark-bg">GALLERY</div>

        <div class="heading-content">
          <h1>图床画廊</h1>
          <span class="en-title">IMAGE WALL DIRECTORY</span>

          <!-- 新增：视觉过渡文案 -->
          <p class="intro-desc">
            探索光影与色彩的交错，记录每一个闪烁的视觉碎片与灵感瞬间。
          </p>

          <!-- 优化：将同步信息重构为具有细节感的元数据栏 -->
          <div class="meta-bar">
            <span class="meta-item">
              <span class="meta-icon">⟳</span>
              {{ syncError || `自动同步中 · ${lastSyncText}` }}
            </span>
            <span class="meta-divider"></span>
            <span class="meta-item">
              <span class="meta-icon">⚏</span>
              共 {{ displayedProjects.length }} 项作品
            </span>
          </div>
        </div>
      </div>

      <div class="wall-grid-wrap">
        <div class="wall-grid-decor top"><span>✧</span></div>
        <div class="wall-grid">
          <router-link
              v-for="project in pagedProjects"
              :key="project.id"
              :to="`/portfolio/${project.id}`"
              class="wall-tile"
          >
            <img v-if="project.image" :src="project.image" :alt="project.title" loading="lazy" />
            <div v-else class="tile-placeholder">{{ project.number }}</div>
            <div class="tile-overlay">
              <p class="tile-title">{{ project.title }}</p>
            </div>
          </router-link>
        </div>
        <div class="wall-grid-decor bottom"><span>✧</span></div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button
            type="button"
            class="page-btn page-nav"
            :disabled="currentPage === 1"
            @click="setPage(currentPage - 1)"
        >
          PREV
        </button>

        <button
            v-for="page in pageNumbers"
            :key="page"
            type="button"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="setPage(page)"
        >
          {{ String(page).padStart(2, '0') }}
        </button>

        <button
            type="button"
            class="page-btn page-nav"
            :disabled="currentPage === totalPages"
            @click="setPage(currentPage + 1)"
        >
          NEXT
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+SC:wght@300;500;700&display=swap');

.portfolio-image-wall-page {
  --bg-color: #fdfdfd;
  --text-main: #2c3e50;
  --text-sub: #8e9aa3;
  --text-lighter: #a0aab2;
  --accent-ice: #a8d0e6;
  --accent-red: #c85a5a;
  font-family: 'Noto Serif SC', 'Cinzel', serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  min-height: 100vh;
}

a {
  text-decoration: none;
  color: inherit;
}

ul {
  list-style: none;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}

nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 20px 0;
  background: rgba(253, 253, 253, 0.9);
  backdrop-filter: blur(10px);
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.nav-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.2rem;
  letter-spacing: 0.1em;
  font-weight: 700;
  font-family: 'Cinzel', serif;
}

.nav-links {
  display: flex;
  gap: 30px;
  font-size: 0.9rem;
  color: var(--text-sub);
  font-family: 'Cinzel', serif;
}

.nav-links a {
  transition: 0.3s;
  letter-spacing: 0.05em;
}

.nav-links a:hover {
  color: var(--accent-red);
}

.section {
  padding: 130px 0 40px;
}

/* ================= 头部区域优化 ================= */
.heading-wrap {
  text-align: center;
  padding: 20px 0 40px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 水印背景：打破绝对的空白 */
.watermark-bg {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(5rem, 12vw, 10rem);
  font-family: 'Cinzel', serif;
  font-weight: 700;
  color: rgba(168, 208, 230, 0.07); /* 极淡的冰蓝色 */
  white-space: nowrap;
  pointer-events: none;
  z-index: 0;
  user-select: none;
  letter-spacing: 0.1em;
}

.heading-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 800px;
}

.heading-content h1 {
  font-size: 2.4rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  position: relative;
  display: inline-block;
  margin: 0;
  color: var(--text-main);
}

/* 优化主标题两侧的装饰线，更具设计感 */
.heading-content h1::before,
.heading-content h1::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 6vw;
  max-width: 120px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(142, 154, 163, 0.5), transparent);
}

.heading-content h1::before {
  right: 100%;
  margin-right: 30px;
}

.heading-content h1::after {
  left: 100%;
  margin-left: 30px;
}

.en-title {
  display: block;
  margin-top: 12px;
  font-family: 'Cinzel', serif;
  color: var(--accent-ice);
  font-size: 0.9rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
}

/* 增加描述文案，承上启下 */
.intro-desc {
  margin: 24px auto 0;
  font-size: 0.95rem;
  color: var(--text-sub);
  line-height: 1.8;
  letter-spacing: 0.08em;
  max-width: 500px;
  font-weight: 300;
}

/* 元数据栏：将单薄的提示语变得专业化 */
.meta-bar {
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 0.8rem;
  color: var(--text-lighter);
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(168, 208, 230, 0.3);
  padding: 6px 20px;
  border-radius: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.01);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.05em;
}

.meta-icon {
  font-size: 0.9rem;
  opacity: 0.7;
}

.meta-divider {
  width: 4px;
  height: 4px;
  background-color: var(--accent-ice);
  border-radius: 50%;
  opacity: 0.6;
}

/* ================= 栅格区域 ================= */
.wall-grid-wrap {
  position: relative;
  margin: 30px clamp(8px, 2vw, 24px) 0;
  padding: 10px;
  background: #f8f9fa; /* 稍微加深底色，衬托白底 */
  box-shadow: inset 0 0 0 1px #fff, 0 8px 30px rgba(0, 0, 0, 0.03);
  border-radius: 2px;
}

.wall-grid-wrap::before,
.wall-grid-wrap::after {
  content: '';
  position: absolute;
  left: 6px;
  right: 6px;
  height: 4px;
  border-left: 1px solid rgba(168, 208, 230, 0.6);
  border-right: 1px solid rgba(168, 208, 230, 0.6);
  pointer-events: none;
}

.wall-grid-wrap::before {
  top: -4px;
}

.wall-grid-wrap::after {
  bottom: -4px;
}

.wall-grid-decor {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

.wall-grid-decor::before,
.wall-grid-decor::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(168, 208, 230, 0.5);
}

.wall-grid-decor span {
  padding: 0 20px;
  color: var(--accent-ice);
  font-size: 14px;
  font-family: 'Cinzel', serif;
  line-height: 1;
}

.wall-grid-decor.top {
  top: 0;
  transform: translateY(-50%);
}

.wall-grid-decor.bottom {
  bottom: 0;
  transform: translateY(50%);
}

.wall-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 3px; /* 稍微增加一点间隙，让图片呼吸感更强 */
}

.wall-tile {
  position: relative;
  aspect-ratio: 1 / 1;
  background: var(--bg-color);
  overflow: hidden;
  border-radius: 2px; /* 边角稍微硬朗一些，配合画廊质感 */
  animation: tileFadeIn 0.6s ease-out forwards;
  opacity: 0;
}

/* 为图片加载添加一点交错动画效果 */
.wall-tile:nth-child(1) { animation-delay: 0.05s; }
.wall-tile:nth-child(2) { animation-delay: 0.1s; }
.wall-tile:nth-child(3) { animation-delay: 0.15s; }
.wall-tile:nth-child(4) { animation-delay: 0.2s; }
.wall-tile:nth-child(5) { animation-delay: 0.25s; }
.wall-tile:nth-child(6) { animation-delay: 0.3s; }

@keyframes tileFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wall-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: inherit;
}

.wall-tile:hover img {
  transform: scale(1.08);
}

.tile-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  color: #b7c0c8;
  font-size: 1.5rem;
  letter-spacing: 0.12em;
  background: #f0f3f6;
}

.tile-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px 10px 10px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 0 0 2px 2px;
}

.wall-tile:hover .tile-overlay {
  opacity: 1;
}

.tile-title {
  font-size: 0.8rem;
  color: #fff;
  line-height: 1.4;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.05em;
  font-weight: 300;
}

/* ================= 分页器 ================= */
.pagination {
  margin-top: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.page-btn {
  min-width: 42px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(168, 208, 230, 0.4);
  background: #fff;
  color: var(--text-sub);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--text-main);
  color: var(--text-main);
}

.page-btn.active {
  border-color: var(--text-main);
  background: var(--text-main);
  color: #fff;
}

.page-nav {
  min-width: 70px;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: rgba(0, 0, 0, 0.1);
}

@media (max-width: 900px) {
  .nav-links {
    display: none;
  }

  .watermark-bg {
    font-size: 4rem;
  }

  .heading-content h1::before,
  .heading-content h1::after {
    display: none;
  }

  .wall-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .wall-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(9, minmax(0, 1fr));
  }
}
</style>
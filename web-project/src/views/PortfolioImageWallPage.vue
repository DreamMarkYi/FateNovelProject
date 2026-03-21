<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { portfolioProjects } from '@/data/portfolioData'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import {
  applyOrderByIds,
  loadPortfolioOrderConfig,
  reindexPortfolioCards,
} from '@/utils/portfolioOrderConfig'
import PortfolioSiteNav from '@/components/PortfolioSiteNav.vue'

const POLL_INTERVAL_MS = 5000

const remoteArticles = ref([])
const lastSyncText = ref('未同步')
const syncError = ref('')
const orderConfig = ref({
  homeRecentOrder: [],
  catalogOrder: [],
  wallOrder: [],
})

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
  const source =
    remoteArticles.value.length > 0
      ? remoteArticles.value.filter((item) => item.showInGallery !== false)
      : portfolioProjects.filter((item) => item.showInGallery !== false)

  const ordered = applyOrderByIds(source, orderConfig.value.wallOrder)
  return reindexPortfolioCards(ordered)
})

onMounted(async () => {
  await Promise.all([loadRemoteArticles(), loadPortfolioOrderConfig().then((config) => (orderConfig.value = config))])
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
    <!-- 背景古典文字水印 -->
    <div class="bg-watermark">AESTHETICS</div>


    <PortfolioSiteNav inner-max-width="1400px" />

    <!-- 主体非对称布局 -->
    <div class="page-layout container">

      <!-- 左侧：悬浮信息栏 -->
      <aside class="info-sidebar">
        <div class="sidebar-inner">
          <div class="heading-group">
            <span class="en-title">GALLERY</span>
            <h1>画廊</h1>
          </div>

          <p class="intro-desc">
            全部为自己的练习作品，渲染的软件为Blender、UE5等，各位大佬看个乐就好。
          </p>

          <div class="meta-block">
            <div class="meta-item">
              <span class="meta-label">STATUS</span>
              <span class="meta-value">{{ syncError || `SYNC · ${lastSyncText}` }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">WORKS</span>
              <span class="meta-value">{{ displayedProjects.length }} PIECES</span>
            </div>
          </div>

          <div class="sidebar-decor"></div>
        </div>
      </aside>

      <!-- 右侧：规整网格画廊 -->
      <main class="gallery-content">
        <div class="gallery-grid">
          <router-link
              v-for="(project, index) in displayedProjects"
              :key="project.id"
              :to="`/portfolio/${project.id}`"
              class="gallery-item"
              :style="{ animationDelay: `${(index % 6) * 0.1}s` }"
          >
            <!-- 统一比例图片容器 -->
            <div class="img-wrap">
              <img v-if="project.image" :src="project.image" :alt="project.title" loading="lazy" />
              <div v-else class="tile-placeholder">{{ project.number }}</div>
            </div>

            <div class="item-info">
              <h3 class="item-title">{{ project.title }}</h3>
              <span class="item-tags">{{ project.tags }}</span>
            </div>
          </router-link>
        </div>
      </main>

    </div>

    <!-- 底部收尾 -->
    <footer class="site-footer">
      <div class="container footer-inner">
        <p>© {{ new Date().getFullYear() }} Collection Portfolio. All visual fragments reserved.</p>
        <div class="footer-decor">✦</div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700&family=Noto+Serif+SC:wght@300;400;500;700&display=swap');

.portfolio-image-wall-page {
  --bg-color: #fdfdfd;
  --text-main: #1a1a1a;
  --text-sub: #5a5a5a;
  --text-light: #999999;
  --border-color: #e5e3de;
  --accent-color: #3b4249;

  font-family: 'Noto Serif SC', 'Cinzel', serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  text-decoration: none;
  color: inherit;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
}

.bg-watermark {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: 'Cinzel', serif;
  font-size: 18vw;
  color: rgba(26, 26, 26, 0.02);
  z-index: 0;
  pointer-events: none;
  letter-spacing: 0.1em;
  user-select: none;
  white-space: nowrap;
  line-height: 1;
}


/* ================= 宏观布局 ================= */
.page-layout {
  display: flex;
  align-items: flex-start;
  gap: 8vw;
  padding-top: 140px;
  padding-bottom: 80px;
  flex: 1;
}

/* ================= 左侧：固定信息栏 ================= */
.info-sidebar {
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 160px;
}

.heading-group {
  margin-bottom: 30px;
}

.en-title {
  display: block;
  font-family: 'Cinzel', serif;
  color: var(--text-light);
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.heading-group h1 {
  font-size: 3.2rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  margin: 0;
  color: var(--text-main);
  line-height: 1.2;
}

.intro-desc {
  font-size: 0.95rem;
  color: var(--text-sub);
  line-height: 2;
  letter-spacing: 0.05em;
  font-weight: 300;
  margin-bottom: 40px;
}

.meta-block {
  border-top: 1px solid var(--border-color);
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.05em;
}

.meta-label {
  color: var(--text-light);
}

.meta-value {
  color: var(--text-main);
  font-family: monospace;
  font-size: 0.75rem;
}

.sidebar-decor {
  margin-top: 50px;
  display: flex;
  justify-content: flex-start;
  width: auto;
  height: auto;
  background-color: transparent;
}

/* ================= 右侧：规整网格画廊 ================= */
.gallery-content {
  flex: 1;
  min-width: 0;
}

/* 采用标准网格布局，确保水平绝对对齐 */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 依然保留双列的高级感 */
  gap: 60px 40px; /* 行间距60px，列间距40px */
}

.gallery-item {
  display: flex;
  flex-direction: column;
  opacity: 0;
  animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  cursor: pointer;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 统一图片比例容器 */
.img-wrap {
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #ebeae6;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.4s ease;
  aspect-ratio: 4 / 3; /* 【重点】在这里强制所有图片统一为 4:3 比例 */
}

.img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保证图片填满容器不拉伸变形 */
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: block;
}

.tile-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  color: #c9c7c1;
  font-size: 2rem;
  letter-spacing: 0.1em;
}

/* 悬停交互 */
.gallery-item:hover .img-wrap {
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1), 0 8px 20px rgba(0, 0, 0, 0.04); /* 强化：悬停时阴影大幅扩散加深 */
}

.gallery-item:hover img {
  transform: scale(1.05);
}

/* 底部说明文字 */
.item-info {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-title {
  font-size: 1.05rem;
  font-weight: 400;
  margin: 0;
  color: var(--text-main);
  line-height: 1.4;
  letter-spacing: 0.03em;
  transition: color 0.3s;
}

.item-tags {
  font-size: 0.75rem;
  color: var(--text-light);
  font-family: 'Cinzel', serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.gallery-item:hover .item-title {
  color: var(--text-sub);
}

/* ================= 页脚 ================= */
.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  padding: 40px 0;
  background: transparent;
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--text-light);
  letter-spacing: 0.05em;
}

.footer-decor {
  font-size: 1rem;
  color: var(--border-color);
}

/* ================= 响应式调整 ================= */
@media (max-width: 1024px) {
  .page-layout {
    gap: 4vw;
  }
  .info-sidebar {
    width: 260px;
  }
}

@media (max-width: 860px) {
  .page-layout {
    flex-direction: column;
    padding-top: 100px;
    gap: 60px;
  }

  .info-sidebar {
    width: 100%;
    position: relative;
    top: 0;
  }

  .sidebar-inner {
    max-width: 600px;
  }

  .sidebar-decor {
    display: none;
  }
}

@media (max-width: 600px) {
  .container {
    padding: 0 20px;
  }
  .heading-group h1 {
    font-size: 2.4rem;
  }
  .gallery-grid {
    grid-template-columns: 1fr; /* 手机端单列 */
    gap: 40px;
  }
}
</style>
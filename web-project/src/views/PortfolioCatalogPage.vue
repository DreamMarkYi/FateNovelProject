<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { portfolioProjects } from '@/data/portfolioData'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import {
  applyOrderByIds,
  loadPortfolioOrderConfig,
  reindexPortfolioCards,
} from '@/utils/portfolioOrderConfig'

const PAGE_SIZE = 10

const remoteArticles = ref([])
const lastSyncText = ref('未同步')
const syncError = ref('')
const isRefreshing = ref(false)
const showEditor = ref(false)
const orderConfig = ref({
  homeRecentOrder: [],
  catalogOrder: [],
  wallOrder: [],
})

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
    showInCatalog: article.showInCatalog !== false,
  }
}

async function loadRemoteArticles() {
  isRefreshing.value = true
  try {
    const response = await portfolioArticleApi.listArticles()
    const list = Array.isArray(response?.data) ? response.data : []
    remoteArticles.value = list.map(normalizeRemoteProject)
    lastSyncText.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    syncError.value = ''
  } catch (error) {
    syncError.value = '文件夹同步失败，当前展示本地示例数据'
  } finally {
    isRefreshing.value = false
  }
}

const allProjects = computed(() => {
  const source =
    remoteArticles.value.length > 0
      ? remoteArticles.value.filter((item) => item.showInCatalog !== false)
      : portfolioProjects.filter((item) => item.showInCatalog !== false)

  const ordered = applyOrderByIds(source, orderConfig.value.catalogOrder)
  return reindexPortfolioCards(ordered)
})
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(allProjects.value.length / PAGE_SIZE)))
const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return allProjects.value.slice(start, end)
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
  await Promise.all([loadRemoteArticles(), loadPortfolioOrderConfig().then((config) => (orderConfig.value = config))])
  const isDev = import.meta.env.DEV
  const hasDebugParam = new URLSearchParams(window.location.search).has('debug')
  showEditor.value = isDev || hasDebugParam
})
</script>

<template>
  <div class="portfolio-catalog-page">
    <nav>
      <div class="container nav-inner">
        <router-link to="/portfolio" class="logo">HOMEPAGE</router-link>
        <ul class="nav-links">
          <li><router-link to="/portfolio/catalog">ARTICLES</router-link></li>
          <li><router-link to="/portfolio/wall">GALLERY</router-link></li>
          <li><router-link to="/portfolio-novel-select">NOVEL</router-link></li>
          <li><router-link to="/portfolio-memo">MEM0</router-link></li>
        </ul>
      </div>
    </nav>

    <section class="section">
      <div class="container">
        <div class="section-title">
          <h1>全部文章目录</h1>
          <span>ALL PROJECT ARTICLES</span>
          <p class="count-tip">总文章数：{{ allProjects.length }}</p>
          <p class="sync-tip" :class="{ 'sync-tip-error': syncError }">
            {{ syncError || `最新同步时间：${lastSyncText}` }}
          </p>
        </div>

        <div class="directory-grid">
          <article
            v-for="project in pagedProjects"
            :key="project.id"
            class="directory-card"
            :class="project.typeClass"
          >
            <div class="card-cover">
              <img v-if="project.image" :src="project.image" :alt="project.title" />
              <span v-else class="cover-placeholder">NO COVER IMAGE</span>
            </div>
            <div class="card-head">
              <span class="card-no">{{ project.number }}</span>
              <span class="card-tags">{{ project.tags }}</span>
            </div>
            <h2 class="card-title">{{ project.title }}</h2>
            <p class="card-desc">{{ project.description }}</p>
            <div class="card-actions">
              <router-link :to="`/portfolio/${project.id}`" class="card-link">VIEW DETAIL</router-link>
              <router-link
                v-if="showEditor"
                :to="{ path: '/portfolio-config', query: { id: project.id } }"
                class="card-link card-edit-link"
              >
                EDIT
              </router-link>
            </div>
          </article>
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
      </div>
    </section>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+SC:wght@300;500;700&display=swap');

.portfolio-catalog-page {
  --bg-color: #fdfdfd;
  --text-main: #2c3e50;
  --text-sub: #8e9aa3;
  --accent-ice: #a8d0e6;
  --accent-red: #c85a5a;
  --card-shadow: 0 15px 40px rgba(0, 0, 0, 0.06);
  font-family: 'Noto Serif SC', 'Cinzel', serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  min-height: 100vh;
}

a {
  text-decoration: none;
  color: inherit;
  transition: 0.3s;
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
}

.nav-links {
  display: flex;
  gap: 30px;
  font-size: 0.9rem;
  color: var(--text-sub);
}

.nav-links a:hover {
  color: var(--accent-red);
}

.section {
  padding: 130px 0 90px;
}

.section-title {
  text-align: center;
  margin-bottom: 40px;
}

.section-title h1 {
  font-size: 2.2rem;
  font-weight: 300;
  letter-spacing: 0.1em;
}

.section-title span {
  display: block;
  margin-top: 10px;
  font-family: 'Cinzel', serif;
  color: var(--accent-ice);
  font-size: 0.85rem;
  letter-spacing: 0.3em;
}

.sync-tip {
  margin-top: 14px;
  font-size: 0.85rem;
  color: var(--text-sub);
}

.sync-tip-error {
  color: var(--accent-red);
}

.refresh-btn {
  margin-top: 12px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  background: #fff;
  color: var(--text-main);
  font-family: 'Cinzel', serif;
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  padding: 8px 14px;
  cursor: pointer;
  transition: 0.25s;
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--accent-red);
  color: var(--accent-red);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.count-tip {
  margin-top: 6px;
  font-size: 0.82rem;
  color: var(--text-sub);
}

.directory-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.directory-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  padding: 18px 18px 24px;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  transition: 0.35s ease;
}

.directory-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow);
}

.card-type-1 {
  --accent-sub: var(--accent-red);
}

.card-type-2 {
  --accent-sub: var(--accent-ice);
}

.card-type-3 {
  --accent-sub: var(--text-main);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px 0 14px;
}

.card-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f4f5f7;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.directory-card:hover .card-cover img {
  transform: scale(1.04);
}

.cover-placeholder {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  color: #b5bdc3;
}

.card-no {
  font-family: 'Cinzel', serif;
  color: var(--accent-sub);
  letter-spacing: 0.1em;
}

.card-tags {
  font-size: 0.75rem;
  color: var(--text-sub);
  letter-spacing: 0.08em;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 500;
  margin-bottom: 12px;
}

.card-desc {
  color: var(--text-sub);
  line-height: 1.8;
  margin-bottom: 18px;
  flex: 1;
}

.card-link {
  width: fit-content;
  border-bottom: 1px solid var(--accent-sub);
  color: var(--accent-sub);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 1px;
}

.card-actions {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 14px;
}

.card-edit-link {
  border-bottom-style: dashed;
}

.pagination {
  margin-top: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.page-btn {
  min-width: 40px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  background: #fff;
  color: var(--text-main);
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: 0.25s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--accent-red);
  color: var(--accent-red);
}

.page-btn.active {
  border-color: var(--accent-red);
  background: var(--accent-red);
  color: #fff;
}

.page-nav {
  min-width: 64px;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .directory-grid {
    grid-template-columns: 1fr;
  }

  .nav-links {
    display: none;
  }
}
</style>

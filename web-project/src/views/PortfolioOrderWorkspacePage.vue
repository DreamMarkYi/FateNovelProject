<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { portfolioProjects } from '@/data/portfolioData'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import {
  applyOrderByIds,
  loadPortfolioOrderConfig,
} from '@/utils/portfolioOrderConfig'

const router = useRouter()

const loading = ref(false)
const loadError = ref('')
const remoteArticles = ref([])

const homeItems = ref([])
const catalogItems = ref([])
const wallItems = ref([])

const sourceCatalog = computed(() => {
  if (remoteArticles.value.length > 0) {
    return remoteArticles.value.filter((item) => item.showInCatalog !== false)
  }
  return portfolioProjects.filter((item) => item.showInCatalog !== false)
})

const sourceWall = computed(() => {
  if (remoteArticles.value.length > 0) {
    return remoteArticles.value.filter((item) => item.showInGallery !== false)
  }
  return portfolioProjects.filter((item) => item.showInGallery !== false)
})

function normalizeRemoteArticle(article) {
  return {
    id: article.id,
    title: article.title || '未命名文章',
    showInCatalog: article.showInCatalog !== false,
    showInGallery: article.showInGallery !== false,
  }
}

function toDisplayList(source, orderIds) {
  const ordered = applyOrderByIds(source, orderIds)
  return ordered.map((item) => ({
    id: item.id,
    title: item.title || '未命名文章',
  }))
}

function getListRef(section) {
  if (section === 'home') {
    return homeItems
  }
  if (section === 'catalog') {
    return catalogItems
  }
  return wallItems
}

function moveItem(section, index, direction) {
  const listRef = getListRef(section)
  const list = listRef.value.slice()
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= list.length) {
    return
  }

  const temp = list[index]
  list[index] = list[targetIndex]
  list[targetIndex] = temp
  listRef.value = list
}

function exportOrderJson() {
  const payload = {
    homeRecentOrder: homeItems.value.map((item) => item.id),
    catalogOrder: catalogItems.value.map((item) => item.id),
    wallOrder: wallItems.value.map((item) => item.id),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'portfolio-order.json'
  a.click()
  URL.revokeObjectURL(url)
}

async function loadData() {
  try {
    loading.value = true
    loadError.value = ''

    const [articlesResponse, orderConfig] = await Promise.all([
      portfolioArticleApi.listArticles(),
      loadPortfolioOrderConfig(),
    ])

    const remote = Array.isArray(articlesResponse?.data) ? articlesResponse.data : []
    remoteArticles.value = remote.map(normalizeRemoteArticle)

    homeItems.value = toDisplayList(sourceCatalog.value, orderConfig.homeRecentOrder)
    catalogItems.value = toDisplayList(sourceCatalog.value, orderConfig.catalogOrder)
    wallItems.value = toDisplayList(sourceWall.value, orderConfig.wallOrder)
  } catch (error) {
    loadError.value = '加载文章或排序配置失败，请确认前后端服务已启动。'
    homeItems.value = toDisplayList(sourceCatalog.value, [])
    catalogItems.value = toDisplayList(sourceCatalog.value, [])
    wallItems.value = toDisplayList(sourceWall.value, [])
  } finally {
    loading.value = false
  }
}

function resetFromCurrentArticles() {
  homeItems.value = toDisplayList(sourceCatalog.value, [])
  catalogItems.value = toDisplayList(sourceCatalog.value, [])
  wallItems.value = toDisplayList(sourceWall.value, [])
}

onMounted(loadData)
</script>

<template>
  <div class="portfolio-order-workspace">
    <header class="page-header">
      <h1>文章排序工作台</h1>
      <div class="header-actions">
        <button type="button" @click="router.push('/portfolio')">返回首页</button>
        <button type="button" @click="resetFromCurrentArticles">重置顺序</button>
        <button type="button" class="primary" @click="exportOrderJson">导出 JSON</button>
      </div>
    </header>

    <p v-if="loading" class="state-tip">正在加载文章与排序配置...</p>
    <p v-else-if="loadError" class="state-tip error">{{ loadError }}</p>
    <p v-else class="state-tip">
      调整后点击“导出 JSON”，将下载的 `portfolio-order.json` 覆盖到 `web-project/public/portfolio-order.json`。
    </p>

    <main class="workspace-grid">
      <section class="panel">
        <h2>首页最近文章顺序</h2>
        <ul>
          <li v-for="(item, index) in homeItems" :key="`home-${item.id}`">
            <span class="title">{{ index + 1 }}. {{ item.title }}</span>
            <div class="actions">
              <button type="button" @click="moveItem('home', index, 'up')">上移</button>
              <button type="button" @click="moveItem('home', index, 'down')">下移</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="panel">
        <h2>Catalog 页面顺序</h2>
        <ul>
          <li v-for="(item, index) in catalogItems" :key="`catalog-${item.id}`">
            <span class="title">{{ index + 1 }}. {{ item.title }}</span>
            <div class="actions">
              <button type="button" @click="moveItem('catalog', index, 'up')">上移</button>
              <button type="button" @click="moveItem('catalog', index, 'down')">下移</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="panel">
        <h2>Wall 页面顺序</h2>
        <ul>
          <li v-for="(item, index) in wallItems" :key="`wall-${item.id}`">
            <span class="title">{{ index + 1 }}. {{ item.title }}</span>
            <div class="actions">
              <button type="button" @click="moveItem('wall', index, 'up')">上移</button>
              <button type="button" @click="moveItem('wall', index, 'down')">下移</button>
            </div>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
.portfolio-order-workspace {
  min-height: 100vh;
  padding: 32px;
  background: #f7f8fb;
  color: #1f2937;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

button {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  padding: 6px 12px;
  cursor: pointer;
}

button.primary {
  background: #111827;
  color: #fff;
}

.state-tip {
  margin: 16px 0 20px;
  color: #4b5563;
}

.state-tip.error {
  color: #b91c1c;
}

.workspace-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.panel {
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 14px;
}

.panel h2 {
  margin: 0 0 10px;
  font-size: 1rem;
}

.panel ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.panel li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.title {
  flex: 1;
  font-size: 0.92rem;
}

.actions {
  display: flex;
  gap: 6px;
}

@media (max-width: 1100px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}
</style>

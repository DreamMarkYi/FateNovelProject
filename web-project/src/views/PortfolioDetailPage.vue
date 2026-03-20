<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPortfolioProjectById } from '@/data/portfolioData'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import { renderMarkdown } from '@/utils/markdownRenderer'
import {
  hydrateArticleReferences,
  prepareMarkdownWithArticleRefs,
} from '@/utils/articleReferenceRenderer'

const route = useRoute()
const router = useRouter()

const remoteArticle = ref(null)
const loading = ref(false)
const referenceArticles = ref([])

const project = computed(() => {
  if (remoteArticle.value) {
    return {
      id: remoteArticle.value.id,
      title: remoteArticle.value.title,
      tags: remoteArticle.value.tags || 'UNTAGGED',
      detail: {
        date: remoteArticle.value.updatedAt
          ? remoteArticle.value.updatedAt.slice(0, 10).replaceAll('-', '.')
          : 'UNKNOWN',
        author: remoteArticle.value.author || 'SYSTEM',
        coverImage: remoteArticle.value.coverImage || '',
          galleryImages: Array.isArray(remoteArticle.value.galleryImages)
            ? remoteArticle.value.galleryImages
            : [],
        markdown: remoteArticle.value.markdown || '',
      },
    }
  }

  return getPortfolioProjectById(route.params.id)
})

const referenceArticleMap = computed(() => {
  const map = new Map()
  referenceArticles.value.forEach((item) => {
    if (item?.id) {
      map.set(item.id, item)
    }
  })
  return map
})

const markdownHtml = computed(() => {
  const markdown = prepareMarkdownWithArticleRefs(project.value?.detail?.markdown || '')
  const rawHtml = renderMarkdown(markdown)
  return hydrateArticleReferences(rawHtml, referenceArticleMap.value)
})
const galleryImages = computed(() => {
  const detail = project.value?.detail || {}
  const list = Array.isArray(detail.galleryImages) ? detail.galleryImages : []
  if (list.length > 0) {
    return list
  }
  return detail.coverImage ? [detail.coverImage] : []
})
const galleryColumns = computed(() => Math.min(Math.max(galleryImages.value.length, 1), 4))
const lightboxImage = ref('')
const activeMarkdownImage = ref(null)

async function loadRemoteDetail(id) {
  if (!id) {
    remoteArticle.value = null
    return
  }

  try {
    loading.value = true
    const response = await portfolioArticleApi.getArticleById(id)
    remoteArticle.value = response?.data || null
  } catch (error) {
    remoteArticle.value = null
  } finally {
    loading.value = false
  }
}

async function loadReferenceArticles() {
  try {
    const response = await portfolioArticleApi.listArticles()
    referenceArticles.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    referenceArticles.value = []
  }
}

watch(
  () => route.params.id,
  (id) => {
    loadRemoteDetail(id)
  },
  { immediate: true }
)

function openLightbox(url) {
  lightboxImage.value = url
}

function closeLightbox() {
  lightboxImage.value = ''
}

function onMarkdownBodyClick(event) {
  const target = event.target
  const referenceLink = target instanceof Element ? target.closest('.article-reference-card') : null
  if (referenceLink instanceof HTMLAnchorElement) {
    event.preventDefault()
    const href = referenceLink.getAttribute('href') || ''
    const articleId = href.replace('/portfolio/', '').trim()
    if (articleId) {
      router.push(`/portfolio/${articleId}`)
    }
    return
  }

  if (!(target instanceof HTMLImageElement)) {
    if (activeMarkdownImage.value) {
      activeMarkdownImage.value.classList.remove('is-fullsize')
      activeMarkdownImage.value = null
    }
    return
  }

  if (activeMarkdownImage.value && activeMarkdownImage.value !== target) {
    activeMarkdownImage.value.classList.remove('is-fullsize')
  }

  const isSameImage = activeMarkdownImage.value === target
  target.classList.toggle('is-fullsize', !isSameImage)
  activeMarkdownImage.value = isSameImage ? null : target
}

function onDocumentClick(event) {
  if (!activeMarkdownImage.value) {
    return
  }

  const target = event.target
  if (target === activeMarkdownImage.value) {
    return
  }

  activeMarkdownImage.value.classList.remove('is-fullsize')
  activeMarkdownImage.value = null
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    closeLightbox()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('click', onDocumentClick, true)
  loadReferenceArticles()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onDocumentClick, true)
  if (activeMarkdownImage.value) {
    activeMarkdownImage.value.classList.remove('is-fullsize')
    activeMarkdownImage.value = null
  }
})
</script>

<template>
  <div class="portfolio-detail-page">
    <nav>
      <div class="nav-inner">
        <router-link to="/portfolio" class="logo">HOMEPAGE</router-link>
        <ul class="nav-links">
          <li><router-link to="/portfolio/catalog">ARTICLES</router-link></li>
          <li><router-link to="/portfolio/wall">GALLERY</router-link></li>
          <li><router-link to="/portfolio-novel-select">NOVEL</router-link></li>
          <li><router-link to="/portfolio-memo">MEM0</router-link></li>
        </ul>
      </div>
    </nav>

    <article v-if="project && project.detail">
      <header class="article-hero">
        <h1 class="article-title">{{ project.title }}</h1>
      </header>

      <div
        v-if="galleryImages.length"
        class="article-gallery-wrap"
        :style="{ '--gallery-columns': galleryColumns }"
      >
        <div class="article-gallery">
          <button
            v-for="(image, index) in galleryImages"
            :key="`${image}-${index}`"
            type="button"
            class="article-gallery-item"
            @click="openLightbox(image)"
          >
            <img :src="image" :alt="`${project.title}-图片-${index + 1}`" />
          </button>
        </div>
      </div>

      <div class="markdown-body" v-html="markdownHtml" @click="onMarkdownBodyClick"></div>
    </article>

    <section v-else class="empty-state">
      <p v-if="loading">加载中...</p>
      <h2>项目不存在</h2>
      <p>未找到对应的项目详情，请返回列表页。</p>
      <router-link to="/portfolio" class="back-link">返回作品集</router-link>
    </section>

    <footer>
      <p>&copy; 2026 Your Name. All Rights Reserved.</p>
      <p class="footer-sub">ENGINEERED WITH PRECISION</p>
    </footer>

    <div v-if="lightboxImage" class="lightbox" @click.self="closeLightbox">
      <button type="button" class="lightbox-close" @click="closeLightbox">×</button>
      <img :src="lightboxImage" alt="完整图片" />
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+SC:wght@300;500;700&display=swap');

.portfolio-detail-page {
  --bg-color: #fdfdfd;
  --text-main: #2c3e50;
  --text-sub: #8e9aa3;
  --accent-red: #c85a5a;
  --code-bg: #f4f5f7;
  font-family: 'Noto Serif SC', 'Cinzel', serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  line-height: 1.8;
  overflow-x: hidden;
  min-height: 100vh;
}

a {
  text-decoration: none;
  color: inherit;
  transition: 0.3s;
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
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
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
  gap: 40px;
  font-size: 0.9rem;
  color: var(--text-sub);
  list-style: none;
}

.nav-links a:hover {
  color: var(--accent-red);
}

.article-hero {
  margin-top: 70px;
  padding: 60px 20px 0;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.article-title {
  font-size: 2.5rem;
  font-weight: 500;
  margin-bottom: 40px;
}

.article-gallery-wrap {
  max-width: 760px;
  margin: 10px auto 0;
  padding: 0 20px;
}

.article-gallery {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - (var(--gallery-columns, 1) - 1) * 14px) / var(--gallery-columns, 1));
  gap: 14px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  padding-bottom: 10px;
}

.article-gallery-item {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #f0f0f0;
  width: 100%;
  padding: 0;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  cursor: zoom-in;
}

.article-gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(0.94);
  transition: transform 0.3s ease;
}

.article-gallery-item:hover img {
  transform: scale(1.04);
}

.markdown-body {
  max-width: 760px;
  margin: 60px auto 100px;
  padding: 0 20px;
  text-align: justify;
  font-size: 1.05rem;
  color: #334;
}

:deep(.markdown-body h2) {
  font-size: 1.8rem;
  font-weight: 500;
  margin: 50px 0 20px;
  position: relative;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.markdown-body h3) {
  font-size: 1.4rem;
  font-weight: 500;
  margin: 30px 0 15px;
}

:deep(.markdown-body p) {
  margin-bottom: 25px;
}

:deep(.markdown-body blockquote) {
  border-left: 3px solid var(--accent-red);
  margin: 30px 0;
  color: var(--text-sub);
  font-style: italic;
  background: #fafafa;
  padding: 15px 20px;
}

:deep(.markdown-body img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 40px auto;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: zoom-in;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

:deep(.markdown-body img.is-fullsize) {
  width: auto;
  max-width: min(1400px, 95vw);
  margin-left: -20%;

  position: relative;
  z-index: 2;
  cursor: zoom-out;
  border-color: rgba(200, 90, 90, 0.3);
  box-shadow:
    0 0 0 100vmax rgba(0, 0, 0, 0.45),
    0 10px 30px rgba(20, 31, 47, 0.16);
  transform: none;
}

:deep(.markdown-body code) {
  background-color: var(--code-bg);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

:deep(.markdown-body pre) {
  background-color: #eef1f4;
  color: #2f3b45;
  padding: 20px;
  overflow-x: auto;
  margin: 30px 0;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

:deep(.markdown-body pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  margin-bottom: 25px;
  padding-left: 20px;
}

:deep(.markdown-body li) {
  margin-bottom: 10px;
}

:deep(.markdown-body .article-reference-block) {
  margin: 18px 0 28px;
}

:deep(.markdown-body .article-reference-card) {
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 12px;
  align-items: center;
  background: #f2f3f6;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 10px;
  color: inherit;
}

:deep(.markdown-body .article-reference-card:hover) {
  border-color: rgba(200, 90, 90, 0.4);
  background: #eceef3;
}

:deep(.markdown-body .article-reference-thumb) {
  width: 78px;
  height: 58px;
  border-radius: 6px;
  object-fit: cover;
  display: block;
}

:deep(.markdown-body .article-reference-thumb-empty) {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  letter-spacing: 1px;
  color: #6f7b86;
  background: #dfe3ea;
}

:deep(.markdown-body .article-reference-title) {
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
}

:deep(.markdown-body .article-reference-meta) {
  margin: 4px 0 2px;
  color: #738293;
  font-size: 0.78rem;
}

:deep(.markdown-body .article-reference-tag) {
  font-size: 0.72rem;
  color: #66717c;
}

.empty-state {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
}

.back-link {
  color: var(--accent-red);
  border-bottom: 1px solid var(--accent-red);
}

footer {
  padding: 40px 0;
  text-align: center;
  background: #fafafa;
  font-size: 0.85rem;
  color: var(--text-sub);
}

.footer-sub {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  opacity: 0.5;
  margin-top: 10px;
}

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.lightbox img {
  max-width: min(1200px, 95vw);
  max-height: 90vh;
  object-fit: contain;
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 24px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 1.6rem;
  cursor: pointer;
}
</style>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderMarkdown } from '@/utils/markdownRenderer'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import PortfolioSiteNav from '@/components/PortfolioSiteNav.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const chapterList = ref([])
const DEFAULT_VOLUME_NAME = '第一卷：已发布章节'

function volumeNameOrDefault(value) {
  const s = String(value ?? '').trim()
  return s || DEFAULT_VOLUME_NAME
}

const novelData = ref({
  id: 'portfolio-novel',
  title: '雪坠银链时 ~Imaginary White~',
  chapter: '第一章：雨中的交错',
  author: 'Illusion\'s DrM',
  wordCount: 3240,
  updateDate: '2026.03.14',
  volumeName: DEFAULT_VOLUME_NAME,
  coverImage: 'https://images.unsplash.com/photo-1518382473480-1a657cba32a7?q=80&w=1600&auto=format&fit=crop', // 占位图
  // 这里是一段模拟的小说 Markdown 内容
  markdown: `
> “在这个世界上，有些相遇就像是两束光在真空中的交汇，没有任何声音，却能照亮彼此的宇宙。”

细雨笼罩着清晨的街道。白鸟遥撑着一把透明的雨伞，停在了十字路口。她的目光越过熙熙攘攘的人群，落在不远处的花店橱窗上。

呼吸在微凉的空气中化作一团白雾。此时的交通灯恰好变成了红色，她静静地注视着街道对面。

“那是……”

神代琉璃正站在花团锦簇中，低头整理着沾着露水的白百合。听见门头的风铃声响起，她抬起头，安静的眼眸里倒映出灰蒙蒙的天空，以及站在雨帘外的白鸟遥。

两人的视线在略显嘈杂的雨声中交汇。

秋山魂曾经说过，命运的齿轮往往在最不经意的瞬间开始转动。直到今天，白鸟遥才真正理解这句话的含义。

### 破碎的倒影

水洼中倒映着城市的霓虹。

* 第一，不要试图改变过去的既定事实。
* 第二，永远不要在雨天凝视那面镜子。

这些规则一直刻在她的脑海里，但此时此刻，所有的理智似乎都在逐渐瓦解。她向前迈出了一步，水花溅湿了她的裙摆。
`
})
const loadError = ref('')

const markdownHtml = computed(() => renderMarkdown(novelData.value.markdown || ''))
const displayVolumeName = computed(() => volumeNameOrDefault(novelData.value.volumeName))
const currentChapterIndex = computed(() =>
  chapterList.value.findIndex((item) => item.id === novelData.value.id)
)

function buildAccessTokenKey(chapterId) {
  return `portfolio-novel-access-token:${chapterId}`
}

function formatDate(value) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

function calcWordCount(text) {
  const cleaned = String(text || '').trim()
  if (!cleaned) {
    return 0
  }
  return cleaned.replace(/\s+/g, '').length
}

async function loadNovelData(chapterId = '') {
  try {
    loading.value = true
    loadError.value = ''

    const [novelResponse, chaptersResponse] = await Promise.all([
      portfolioArticleApi.getNovelConfig(),
      portfolioArticleApi.listNovelChapters(),
    ])

    const baseNovel = novelResponse?.data || {}
    const articles = Array.isArray(chaptersResponse?.data) ? chaptersResponse.data : []

    chapterList.value = articles
      .filter((item) => item && item.showInCatalog !== false)
      .slice()
      .sort((a, b) => {
        const ta = new Date(a.createdAt || a.updatedAt || 0).getTime()
        const tb = new Date(b.createdAt || b.updatedAt || 0).getTime()
        return ta - tb
      })

    if (chapterId) {
      const accessToken = sessionStorage.getItem(buildAccessTokenKey(chapterId)) || ''
      const chapterResponse = await portfolioArticleApi.getNovelChapterById(chapterId, accessToken)
      const chapter = chapterResponse?.data

      if (chapter) {
        novelData.value = {
          ...novelData.value,
          ...baseNovel,
          id: chapter.id,
          chapter: chapter.title || baseNovel.chapter || '未命名章节',
          author: chapter.author || baseNovel.author || 'SYSTEM',
          coverImage: chapter.coverImage || baseNovel.coverImage || '',
          markdown: chapter.markdown || '',
          updateDate: formatDate(chapter.updatedAt || chapter.createdAt || baseNovel.updateDate),
          wordCount: calcWordCount(chapter.markdown),
          volumeName: volumeNameOrDefault(chapter.volumeName ?? baseNovel.volumeName),
        }
        return
      }
    }

    novelData.value = {
      ...novelData.value,
      ...baseNovel,
      id: baseNovel.id || 'portfolio-novel',
      volumeName: volumeNameOrDefault(baseNovel.volumeName),
    }
  } catch (error) {
    if (error?.response?.status === 403) {
      loadError.value = '章节访问验证未通过或已过期，请返回目录页重新输入姓名验证。'
      return
    }
    loadError.value = '加载失败，当前展示默认内容。'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/portfolio-novel-select')
}

function nextChapter() {
  const currentIndex = currentChapterIndex.value
  if (currentIndex < 0 || currentIndex >= chapterList.value.length - 1) {
    return
  }

  const target = chapterList.value[currentIndex + 1]
  router.push({
    path: '/portfolio-Novel',
    query: { id: target.id },
  })
}

function prevChapter() {
  const currentIndex = currentChapterIndex.value
  if (currentIndex <= 0) {
    return
  }

  const target = chapterList.value[currentIndex - 1]
  router.push({
    path: '/portfolio-Novel',
    query: { id: target.id },
  })
}

watch(
  () => route.query.id,
  (id) => {
    const chapterId = typeof id === 'string' ? id.trim() : ''
    loadNovelData(chapterId)
  },
  { immediate: true }
)
</script>

<template>
  <div class="novel-reader-page">
    <PortfolioSiteNav />

    <main class="reader-main" v-if="novelData">
      <p v-if="loading" class="state-tip">正在加载最新小说内容...</p>
      <p v-else-if="loadError" class="state-tip state-tip-error">{{ loadError }}</p>

      <header class="novel-header">
        <div class="novel-book-title">{{ novelData.title }}</div>
        <p class="novel-volume-line">{{ displayVolumeName }}</p>
        <h1 class="chapter-title">{{ novelData.chapter }}</h1>

        <div class="novel-meta">
          <span class="meta-item">AUTHOR. <b>{{ novelData.author }}</b></span>
          <span class="meta-item divider">/</span>
          <span class="meta-item">WORDS. <b>{{ novelData.wordCount }}</b></span>
          <span class="meta-item divider">/</span>
          <span class="meta-item">UPDATED. <b>{{ novelData.updateDate }}</b></span>
        </div>
      </header>

      <div v-if="novelData.coverImage" class="novel-cover-wrap">
        <img :src="novelData.coverImage" :alt="novelData.title" class="novel-cover" />
      </div>

      <article class="markdown-body novel-body" v-html="markdownHtml"></article>

      <nav class="chapter-navigation">
        <button class="nav-btn prev" :disabled="currentChapterIndex <= 0" @click="prevChapter">
          <span class="btn-icon">←</span>
          <span class="btn-text">PREV CHAPTER</span>
        </button>
        <button class="nav-btn index" @click="goBack">
          TABLE OF CONTENTS
        </button>
        <button
          class="nav-btn next"
          :disabled="currentChapterIndex < 0 || currentChapterIndex >= chapterList.length - 1"
          @click="nextChapter"
        >
          <span class="btn-text">NEXT CHAPTER</span>
          <span class="btn-icon">→</span>
        </button>
      </nav>
    </main>

    <section v-else class="empty-state">
      <p v-if="loading">Loading Chapter...</p>
      <h2>未找到内容</h2>
      <p>章节数据可能已损坏或丢失。</p>
      <router-link to="/portfolio" class="back-link">返回目录</router-link>
    </section>

    <footer>
      <p>&copy; 2026 Illusion's drm. All Rights Reserved.</p>
      <p class="footer-sub">ENGINEERED WITH PRECISION</p>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+SC:wght@300;400;500;700&display=swap');

.novel-reader-page {
  /* 继承你原有的色彩系统，微调背景使其更像纸张 */
  --bg-color: #fcfcfc;
  --text-main: #253342;
  --text-sub: #7a8b99;
  --accent-red: #c85a5a;
  --accent-ice: #a8d0e6;

  font-family: 'Noto Serif SC', 'Cinzel', serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  min-height: 100vh;
  overflow-x: hidden;
  /* 增加页面顶部的呼吸感 */
  padding-top: 80px;
}

a {
  text-decoration: none;
  color: inherit;
  transition: 0.3s;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 页面主体内容限制宽度，打造沉浸式阅读 */
.reader-main {
  max-width: 720px; /* 720px 是最适合人眼阅读长文的跨度 */
  margin: 0 auto;
  padding: 40px 20px 80px;
}

.state-tip {
  font-size: 0.85rem;
  color: var(--text-sub);
  text-align: center;
  margin-bottom: 16px;
}

.state-tip-error {
  color: var(--accent-red);
}

/* 头部排版 */
.novel-header {
  text-align: center;
  margin-bottom: 50px;
  margin-top: 40px;
}

.novel-book-title {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  letter-spacing: 0.3em;
  color: var(--accent-ice);
  margin-bottom: 20px;
  text-transform: uppercase;
}

.novel-volume-line {
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  color: var(--text-sub);
  margin: -6px 0 18px;
}

.chapter-title {
  font-size: 2.2rem;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 30px;
  line-height: 1.4;
}

.novel-meta {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--text-sub);
  letter-spacing: 0.1em;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.meta-item b {
  color: var(--text-main);
  font-weight: 500;
  margin-left: 5px;
}

.divider {
  opacity: 0.3;
}

/* 封面/氛围图 */
.novel-cover-wrap {
  width: 100%;
  aspect-ratio: 21 / 9; /* 电影画幅，增加高级感 */
  overflow: hidden;
  margin-bottom: 60px;
  background: #f4f5f7;
  position: relative;
}

.novel-cover-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid rgba(0,0,0,0.05);
  pointer-events: none;
}

.novel-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(20%) contrast(110%); /* 微调色调使其偏向文学感 */
}

/* -------------------------------------
   专门为小说优化的 Markdown 样式
---------------------------------------- */
.novel-body {
  font-size: 1.12rem; /* 字号略大于技术文档，减轻视疲劳 */
  line-height: 2.1;   /* 增加行高，提升呼吸感 */
  color: #2c3640;
  text-align: justify;
  letter-spacing: 0.02em;
}

/* 题记/引言样式（使用 blockquote 渲染） */
:deep(.novel-body blockquote) {
  margin: 0 0 50px 0;
  padding: 25px 40px;
  background: transparent;
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-style: italic;
  font-weight: 300;
  color: var(--text-sub);
  text-align: center;
}

/* 正文段落 */
:deep(.novel-body p) {
  margin-bottom: 1.8em; /* 段间距取代首行缩进，更具现代感 */
}

/* 场景分割线（使用 hr 渲染，例如 *** ） */
:deep(.novel-body hr) {
  border: none;
  margin: 60px 0;
  text-align: center;
}
:deep(.novel-body hr::after) {
  content: '◇  ◇  ◇'; /* 优雅的菱形分割 */
  letter-spacing: 2em;
  padding-left: 2em;
  color: var(--accent-ice);
  font-size: 0.8rem;
}

/* 章节内小标题 */
:deep(.novel-body h3) {
  font-size: 1.3rem;
  font-weight: 500;
  text-align: center;
  margin: 60px 0 40px;
  position: relative;
}

:deep(.novel-body ul), :deep(.novel-body ol) {
  padding-left: 40px;
  margin-bottom: 2em;
  background: rgba(0,0,0,0.01);
  padding: 20px 20px 20px 50px;
  border-radius: 4px;
}

:deep(.novel-body li) {
  margin-bottom: 10px;
}

/* 底部章节导航 */
.chapter-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 80px;
  padding-top: 40px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.nav-btn {
  background: transparent;
  border: none;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  color: var(--text-sub);
  letter-spacing: 0.15em;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: color 0.3s ease;
  padding: 10px 0;
}

.nav-btn:hover {
  color: var(--accent-red);
}

.nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.nav-btn.index {
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  border-bottom: 1px solid transparent;
}
.nav-btn.index:hover {
  border-bottom-color: var(--accent-red);
}

/* 空白状态与底部 */
.empty-state {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.back-link {
  color: var(--accent-red);
  border-bottom: 1px solid var(--accent-red);
  margin-top: 15px;
}

footer {
  padding: 40px 0;
  text-align: center;
  background: #fafafa;
  font-size: 0.85rem;
  color: var(--text-sub);
  border-top: 1px solid rgba(0, 0, 0, 0.03);
}

.footer-sub {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  opacity: 0.5;
  margin-top: 10px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .reader-main {
    padding: 20px 20px 60px;
  }
  .chapter-title {
    font-size: 1.8rem;
  }
  .novel-meta {
    flex-direction: column;
    gap: 8px;
  }
  .meta-item.divider {
    display: none;
  }
  .novel-body {
    font-size: 1.05rem;
  }
  :deep(.novel-body blockquote) {
    padding: 20px;
  }
  .chapter-navigation {
    flex-direction: column;
    gap: 20px;
  }
}
</style>
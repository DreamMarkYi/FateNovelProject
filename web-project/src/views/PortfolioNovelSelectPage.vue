<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import PortfolioSiteNav from '@/components/PortfolioSiteNav.vue'

const router = useRouter()

const bookData = ref({
  id: 'novel-01',
  title: '雪坠银链时',
  subtitle: ' ~Imaginary White~',
  author: "Illusion's DrM",
  status: '连载中',
  tags: ['雪', '视觉小说', '时空交错'],
  summary: '2016年，高中毕业前夕的最后一个圣诞节，白鸟遥强行将如同行尸走肉的那个人拽入了喧嚣的平安夜。从出生以来，白鸟遥第一次不相信自己的眼睛，即使她已经看穿了所有的残酷。最后一次，白鸟遥决定再确认一次他的心意。',
  coverImage: 'https://images.unsplash.com/photo-1518382473480-1a657cba32a7?q=80&w=1600&auto=format&fit=crop',
})

const chapters = ref([])
const loading = ref(false)
const loadError = ref('')
const isAccessModalVisible = ref(false)
const pendingChapter = ref(null)
const guardianNameInput = ref('')
const verifyLoading = ref(false)
const verifyError = ref('')

const DEFAULT_VOLUME_NAME = '第一卷：已发布章节'

/** 卷名完全一致（去首尾空格后）的章节归入同一卷；空卷名与默认卷名视为同一组 */
function volumeGroupKey(name) {
  const s = String(name ?? '').trim()
  return s || DEFAULT_VOLUME_NAME
}

const volumes = computed(() => {
  const keyOrder = []
  const map = new Map()
  for (const ch of chapters.value) {
    const key = volumeGroupKey(ch.volumeName)
    if (!map.has(key)) {
      map.set(key, [])
      keyOrder.push(key)
    }
    map.get(key).push(ch)
  }
  return keyOrder.map((key, idx) => {
    const list = map
      .get(key)
      .slice()
      .sort((a, b) => {
        const ta = new Date(a.sortTime || 0).getTime()
        const tb = new Date(b.sortTime || 0).getTime()
        return ta - tb
      })
    return {
      id: `vol-${idx}`,
      title: key,
      englishTitle: key.toUpperCase(),
      chapters: list.map((c, cIdx) => ({
        ...c,
        number: String(cIdx + 1).padStart(2, '0'),
      })),
    }
  })
})

const firstChapter = computed(() => chapters.value[0] || null)
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

async function loadChapters() {
  try {
    loading.value = true
    loadError.value = ''

    const response = await portfolioArticleApi.listNovelChapters()
    const source = (Array.isArray(response?.data) ? response.data : [])
      .slice()
      .sort((a, b) => {
        const ta = new Date(a.createdAt || a.updatedAt || 0).getTime()
        const tb = new Date(b.createdAt || b.updatedAt || 0).getTime()
        return ta - tb
      })

    chapters.value = source.map((item, index) => {
      const updatedAt = item.updatedAt || item.createdAt
      const daysFromNow = updatedAt
        ? Math.abs(Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        : Number.POSITIVE_INFINITY

      return {
        id: item.id,
        number: String(index + 1).padStart(2, '0'),
        title: item.title || `章节 ${index + 1}`,
        date: formatDate(updatedAt),
        isNew: daysFromNow <= 7,
        isLocked: false,
        volumeName: item.volumeName,
        sortTime: updatedAt,
      }
    })
  } catch (error) {
    loadError.value = '章节目录加载失败，请检查后端服务是否已启动。'
    chapters.value = []
  } finally {
    loading.value = false
  }
}

function buildAccessTokenKey(chapterId) {
  return `portfolio-novel-access-token:${chapterId}`
}

function openAccessModal(chapter) {
  if (!chapter || !chapter.id || chapter.isLocked) {
    return
  }

  pendingChapter.value = chapter
  guardianNameInput.value = ''
  verifyError.value = ''
  isAccessModalVisible.value = true
}

function closeAccessModal() {
  if (verifyLoading.value) {
    return
  }
  isAccessModalVisible.value = false
  pendingChapter.value = null
  guardianNameInput.value = ''
  verifyError.value = ''
}

async function submitAccessVerification() {
  if (verifyLoading.value || !pendingChapter.value?.id) {
    return
  }

  const inputName = guardianNameInput.value.trim()
  if (!inputName) {
    verifyError.value = '请输入姓名后再验证'
    return
  }

  try {
    verifyLoading.value = true
    verifyError.value = ''
    const response = await portfolioArticleApi.verifyNovelChapterAccess(pendingChapter.value.id, inputName)
    const accessToken = response?.data?.accessToken
    if (!accessToken) {
      verifyError.value = '验证失败，请稍后重试'
      return
    }

    sessionStorage.setItem(buildAccessTokenKey(pendingChapter.value.id), accessToken)
    isAccessModalVisible.value = false
    const chapterId = pendingChapter.value.id
    pendingChapter.value = null
    guardianNameInput.value = ''

    router.push({
      path: '/portfolio-Novel',
      query: { id: chapterId },
    })
  } catch (error) {
    verifyError.value =
      error?.response?.data?.message || '姓名验证失败，请确认输入无误后重试'
  } finally {
    verifyLoading.value = false
  }
}

function goToChapter(chapter) {
  openAccessModal(chapter)
}

function onModalMaskClick(event) {
  if (event.target === event.currentTarget) {
    closeAccessModal()
  }
}

function onModalKeydown(event) {
  if (event.key === 'Escape') {
    closeAccessModal()
  }
  if (event.key === 'Enter') {
    submitAccessVerification()
  }
}

function openFirstChapter() {
  if (!firstChapter.value) {
    return
  }
  openAccessModal(firstChapter.value)
}

function onModalInput() {
  if (verifyError.value) {
    verifyError.value = ''
  }
}

onMounted(loadChapters)
</script>

<template>
  <div class="novel-index-page">
    <PortfolioSiteNav />

    <!-- 顶部视觉与信息区 -->
    <header class="book-hero">
      <div class="book-cover-bg" :style="{ backgroundImage: `url(${bookData.coverImage})` }"></div>
      <div class="book-hero-content container">
        <div class="book-info-card">
          <div class="book-tags">
            <span v-for="tag in bookData.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <h1 class="book-title">{{ bookData.title }}</h1>
          <p class="book-subtitle">{{ bookData.subtitle }}</p>

          <div class="book-meta">
            <span>AUTHOR. <b>{{ bookData.author }}</b></span>
            <span class="divider">/</span>
            <span>STATUS. <b>{{ bookData.status }}</b></span>
          </div>

          <p class="book-summary">{{ bookData.summary }}</p>

          <div class="hero-actions">
            <button class="btn-read" :disabled="!firstChapter" @click="openFirstChapter">
              START READING
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 目录列表区 -->
    <main class="toc-main container">
      <div class="section-title">
        <h2>目录</h2>
        <span>TABLE OF CONTENTS</span>
      </div>
      <p v-if="loading" class="state-tip">正在加载章节目录...</p>
      <p v-else-if="loadError" class="state-tip state-tip-error">{{ loadError }}</p>
      <p v-else-if="!chapters.length" class="state-tip">暂无可阅读章节</p>

      <div class="toc-list">
        <div
            v-for="(volume, vIndex) in volumes"
            :key="volume.id"
            class="volume-group"
        >
          <!-- 卷标题 -->
          <div class="volume-header">
            <h3 class="volume-title">{{ volume.title }}</h3>
            <span class="volume-en">{{ volume.englishTitle }}</span>
          </div>

          <!-- 章节列表 -->
          <ul class="chapter-list">
            <li
                v-for="(chapter, cIndex) in volume.chapters"
                :key="chapter.id"
                class="chapter-item"
                :class="{ 'is-locked': chapter.isLocked }"
                @click="goToChapter(chapter)"
            >
              <div class="chapter-num">{{ chapter.number }}</div>
              <div class="chapter-info">
                <span class="chapter-name">{{ chapter.title }}</span>
                <span v-if="chapter.isNew" class="badge-new">NEW</span>
                <span v-if="chapter.isLocked" class="badge-lock">LOCKED</span>
              </div>
              <div class="chapter-date">{{ chapter.date }}</div>

              <!-- Hover时的装饰箭头 -->
              <div class="hover-arrow">→</div>
            </li>
          </ul>
        </div>
      </div>
    </main>

    <div
      v-if="isAccessModalVisible"
      class="access-modal-mask"
      role="dialog"
      aria-modal="true"
      @click="onModalMaskClick"
      @keydown="onModalKeydown"
    >
      <div class="access-modal">
        <h3>叩响门扉</h3>
        <p class="access-modal-desc">
          在窥探这段记忆之前，您是正确的人吗：
        </p>
        <input
          v-model="guardianNameInput"
          class="access-modal-input"
          type="text"
          placeholder="请输入姓名"
          autofocus
          @input="onModalInput"
        />
        <p v-if="verifyError" class="access-modal-error">{{ verifyError }}</p>
        <div class="access-modal-actions">
          <button type="button" class="btn-cancel" :disabled="verifyLoading" @click="closeAccessModal">
            转身离去
          </button>
          <button type="button" class="btn-confirm" :disabled="verifyLoading" @click="submitAccessVerification">
            {{ verifyLoading ? '于记忆中搜索...' : '推开门扉' }}
          </button>
        </div>
      </div>
    </div>

    <footer>
      <p>&copy; 2026 Illusion's drm. All Rights Reserved.</p>
      <p class="footer-sub">ENGINEERED WITH PRECISION</p>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700&family=Noto+Serif+SC:wght@300;400;500;700&display=swap');

.novel-index-page {
  --bg-color: #fcfcfc;
  --text-main: #2c3e50;
  --text-sub: #8e9aa3;
  --accent-red: #c85a5a;
  --accent-ice: #a8d0e6;
  --border-color: rgba(0, 0, 0, 0.06);

  font-family: 'Noto Serif SC', 'Cinzel', serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  min-height: 100vh;
  overflow-x: hidden;
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

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 顶部信息区 (Hero) */
.book-hero {
  position: relative;
  padding: 120px 0 80px;
  min-height: 50vh;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.book-cover-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center 30%;
  opacity: 0.1; /* 极低的透明度作为背景质感 */
  pointer-events: none;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
}

.book-hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
}

.book-info-card {
  text-align: center;
  max-width: 700px;
}

.book-tags {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 25px;
}

.tag {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  padding: 4px 12px;
  border: 1px solid var(--border-color);
  color: var(--text-sub);
  letter-spacing: 0.15em;
  border-radius: 20px;
  background: #fff;
}

.book-title {
  font-size: 2.8rem;
  font-weight: 500;
  margin-bottom: 5px;
  color: var(--text-main);
  letter-spacing: 0.05em;
}

.book-subtitle {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  color: var(--accent-ice);
  letter-spacing: 0.3em;
  margin-bottom: 30px;
}

.book-meta {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--text-sub);
  letter-spacing: 0.1em;
  margin-bottom: 30px;
}

.book-meta b {
  color: var(--text-main);
  font-weight: 500;
}

.book-meta .divider {
  margin: 0 15px;
  opacity: 0.3;
}

.book-summary {
  font-size: 0.95rem;
  color: var(--text-sub);
  line-height: 2;
  text-align: justify;
  text-align-last: center;
  margin-bottom: 40px;
  padding: 0 20px;
}

.btn-read {
  display: inline-block;
  padding: 14px 40px;
  background: var(--text-main);
  color: #fff;
  border: 1px solid var(--text-main);
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  cursor: pointer;
  transition: all 0.4s ease;
}

.btn-read:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-read:hover {
  background: #fff;
  color: var(--text-main);
}

/* 目录区 */
.toc-main {
  padding: 80px 20px 100px;
}

.state-tip {
  text-align: center;
  color: var(--text-sub);
  font-size: 0.9rem;
  margin: -30px 0 40px;
}

.state-tip-error {
  color: var(--accent-red);
}

.section-title {
  text-align: center;
  margin-bottom: 70px;
}

.section-title h2 {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 0.1em;
}

.section-title span {
  display: block;
  margin-top: 10px;
  font-family: 'Cinzel', serif;
  color: var(--accent-ice);
  font-size: 0.8rem;
  letter-spacing: 0.3em;
}

.volume-group {
  margin-bottom: 60px;
}

.volume-header {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--text-main);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.volume-title {
  font-size: 1.3rem;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.volume-en {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--text-sub);
  letter-spacing: 0.15em;
}

.chapter-list {
  display: flex;
  flex-direction: column;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 20px 10px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  background: transparent;
}

.chapter-item:hover:not(.is-locked) {
  background: rgba(0, 0, 0, 0.02);
  transform: translateX(5px);
  border-bottom-color: var(--accent-red);
}

.chapter-num {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  color: var(--text-sub);
  width: 50px;
  opacity: 0.6;
}

.chapter-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}

.chapter-name {
  font-size: 1.05rem;
  color: var(--text-main);
  transition: color 0.3s ease;
}

.chapter-item:hover:not(.is-locked) .chapter-name {
  color: var(--accent-red);
}

.badge-new {
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  padding: 2px 6px;
  background: var(--accent-red);
  color: #fff;
  border-radius: 2px;
  letter-spacing: 0.1em;
}

.badge-lock {
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  padding: 2px 6px;
  border: 1px solid var(--text-sub);
  color: var(--text-sub);
  border-radius: 2px;
  letter-spacing: 0.1em;
}

.chapter-date {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  color: var(--text-sub);
  opacity: 0.7;
}

.hover-arrow {
  position: absolute;
  right: -20px;
  opacity: 0;
  color: var(--accent-red);
  transition: all 0.3s ease;
}

.chapter-item:hover:not(.is-locked) .hover-arrow {
  opacity: 1;
  right: 15px;
}

/* 锁定章节的样式 */
.chapter-item.is-locked {
  cursor: not-allowed;
  opacity: 0.6;
}

.chapter-item.is-locked .chapter-name {
  color: var(--text-sub);
}

.access-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(16, 22, 30, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.access-modal {
  width: min(92vw, 460px);
  background: #fff;
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 60px rgba(16, 22, 30, 0.18);
  padding: 26px 24px;
}

.access-modal h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.06em;
}

.access-modal-desc {
  margin: 12px 0 16px;
  color: var(--text-sub);
  font-size: 0.9rem;
  line-height: 1.8;
}

.access-modal-input {
  width: 100%;
  border: 1px solid var(--border-color);
  padding: 10px 12px;
  font-size: 0.95rem;
  font-family: 'Noto Serif SC', serif;
  outline: none;
  transition: border-color 0.2s ease;
}

.access-modal-input:focus {
  border-color: var(--accent-red);
}

.access-modal-error {
  margin-top: 10px;
  color: var(--accent-red);
  font-size: 0.85rem;
}

.access-modal-actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.access-modal-actions button {
  border: 1px solid var(--text-main);
  background: transparent;
  color: var(--text-main);
  padding: 8px 14px;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.access-modal-actions .btn-confirm {
  background: var(--text-main);
  color: #fff;
}

footer {
  padding: 50px 0;
  text-align: center;
  background: #fafafa;
  font-size: 0.85rem;
  color: var(--text-sub);
  border-top: 1px solid var(--border-color);
}

.footer-sub {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  opacity: 0.5;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .book-hero {
    padding: 100px 0 50px;
  }
  .book-title {
    font-size: 2.2rem;
  }
  .volume-header {
    flex-direction: column;
    gap: 5px;
  }
  .chapter-item {
    padding: 15px 5px;
  }
  .chapter-date {
    display: none; /* 移动端空间小，隐藏日期 */
  }
  .chapter-item:hover:not(.is-locked) {
    transform: translateX(0); /* 移动端取消位移 */
  }
  .hover-arrow {
    display: none;
  }
}
</style>
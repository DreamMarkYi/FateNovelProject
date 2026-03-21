<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import { renderMemoRichText } from '@/utils/memoRichText'
import PortfolioSiteNav from '@/components/PortfolioSiteNav.vue'

/** 与 Vite 一致：仅本地开发构建为 true，生产包中不可编辑置顶 */
const isDevUi = import.meta.env.DEV

const MEMO_ACCESS_TOKEN_KEY = 'portfolio-memo-access-token'

const pageInfo = ref({
  title: '匣',
  subtitle: 'FRAGMENTS & WHISPERS',
  author: "Illusion's DrM",
  summary: '主要记录一些零散的想法，平时因为种种原因没法实现的东西记录在这里，或许有一天去做了。',
})

const memos = ref([])
const loadingMemos = ref(false)
const loadError = ref('')

const isWriteModalVisible = ref(false)
const isSubmitting = ref(false)
const newMemoContent = ref('')
const newMemoTags = ref('')
const submitError = ref('')

const isAccessModalVisible = ref(false)
const accessNameInput = ref('')
const accessVerifyLoading = ref(false)
const accessVerifyError = ref('')

/** 当前查看详情的便签（点击列表项打开） */
const detailMemo = ref(null)

const devEditPinned = ref(false)
const devFlagsSaving = ref(false)
const devFlagsError = ref('')

watch(detailMemo, (m) => {
  if (m) {
    devEditPinned.value = Boolean(m.pinned)
    devFlagsError.value = ''
  }
})

const sortedMemos = computed(() =>
  [...memos.value].sort((a, b) => {
    const pa = a.pinned ? 1 : 0
    const pb = b.pinned ? 1 : 0
    if (pa !== pb) {
      return pb - pa
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
)

function getMemoAccessToken() {
  return sessionStorage.getItem(MEMO_ACCESS_TOKEN_KEY) || ''
}

function setMemoAccessToken(token) {
  sessionStorage.setItem(MEMO_ACCESS_TOKEN_KEY, String(token || '').trim())
}

function clearMemoAccessToken() {
  sessionStorage.removeItem(MEMO_ACCESS_TOKEN_KEY)
}

async function loadMemos() {
  try {
    loadingMemos.value = true
    loadError.value = ''
    const response = await portfolioArticleApi.listMemos()
    memos.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    memos.value = []
    loadError.value = error?.response?.data?.message || '读取便签失败，请检查后端服务是否启动'
  } finally {
    loadingMemos.value = false
  }
}

function formatMemoDate(dateString) {
  const date = new Date(dateString)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

  return {
    day: String(date.getDate()).padStart(2, '0'),
    monthYear: `${months[date.getMonth()]}, ${date.getFullYear()}`,
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
  }
}

function openAccessModal() {
  accessNameInput.value = ''
  accessVerifyError.value = ''
  isAccessModalVisible.value = true
}

function closeAccessModal() {
  if (accessVerifyLoading.value) return
  isAccessModalVisible.value = false
}

async function submitAccessVerification() {
  const accessName = accessNameInput.value.trim()
  if (!accessName) {
    accessVerifyError.value = '请输入姓名后再验证'
    return
  }

  try {
    accessVerifyLoading.value = true
    accessVerifyError.value = ''
    const response = await portfolioArticleApi.verifyMemoAccess(accessName)
    const token = response?.data?.accessToken
    if (!token) {
      accessVerifyError.value = '验证失败，请重试'
      return
    }

    setMemoAccessToken(token)
    isAccessModalVisible.value = false
    openWriteModal()
  } catch (error) {
    accessVerifyError.value = error?.response?.data?.message || '姓名验证失败，请确认后重试'
  } finally {
    accessVerifyLoading.value = false
  }
}

function openWriteModal() {
  detailMemo.value = null
  if (!getMemoAccessToken()) {
    openAccessModal()
    return
  }

  newMemoContent.value = ''
  newMemoTags.value = ''
  submitError.value = ''
  isWriteModalVisible.value = true
}

function openMemoDetail(memo) {
  detailMemo.value = memo
}

function closeMemoDetail() {
  detailMemo.value = null
}

async function applyMemoDevFlags() {
  if (!isDevUi || !detailMemo.value?.id) {
    return
  }

  devFlagsSaving.value = true
  devFlagsError.value = ''

  try {
    const response = await portfolioArticleApi.updateMemoDevFlags(detailMemo.value.id, {
      pinned: devEditPinned.value,
    })
    const updated = response?.data
    if (updated) {
      const idx = memos.value.findIndex((x) => x.id === updated.id)
      if (idx >= 0) {
        memos.value[idx] = { ...memos.value[idx], ...updated }
      }
      detailMemo.value = { ...detailMemo.value, ...updated }
    }
  } catch (error) {
    devFlagsError.value =
      error?.response?.data?.message || error?.message || '保存失败'
  } finally {
    devFlagsSaving.value = false
  }
}

function onDetailModalMaskClick(event) {
  if (event.target === event.currentTarget) {
    closeMemoDetail()
  }
}

function onDetailModalKeydown(event) {
  if (event.key === 'Escape') {
    closeMemoDetail()
  }
}

function closeWriteModal() {
  if (isSubmitting.value) return
  isWriteModalVisible.value = false
}

async function submitMemo() {
  if (!newMemoContent.value.trim()) {
    submitError.value = '写点什么再保存吧...'
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    const tagsArray = newMemoTags.value
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean)

    const response = await portfolioArticleApi.saveMemo(
      {
        content: newMemoContent.value,
        tags: tagsArray,
      },
      getMemoAccessToken()
    )

    if (response?.data) {
      memos.value.unshift(response.data)
    }

    // 先结束提交态，否则 closeWriteModal 会因 isSubmitting 为 true 而直接 return
    isSubmitting.value = false
    closeWriteModal()
  } catch (error) {
    if (error?.response?.status === 403) {
      clearMemoAccessToken()
      submitError.value = '写入权限已失效，请重新输入姓名验证'
      return
    }
    submitError.value = error?.response?.data?.message || '保存失败，请重试。'
  } finally {
    isSubmitting.value = false
  }
}

function onModalMaskClick(event) {
  if (event.target === event.currentTarget) {
    closeWriteModal()
  }
}

function onModalKeydown(event) {
  if (event.key === 'Escape') {
    closeWriteModal()
  }
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    submitMemo()
  }
}

function onAccessModalMaskClick(event) {
  if (event.target === event.currentTarget) {
    closeAccessModal()
  }
}

function onAccessModalKeydown(event) {
  if (event.key === 'Escape') {
    closeAccessModal()
  }
  if (event.key === 'Enter') {
    submitAccessVerification()
  }
}

onMounted(loadMemos)
</script>

<template>
  <div class="memo-index-page">
    <PortfolioSiteNav />

    <!-- 顶部视觉与信息区 -->
    <header class="page-hero">
      <div class="hero-content container">
        <div class="info-card">
          <h1 class="page-title">{{ pageInfo.title }}</h1>
          <p class="page-subtitle">{{ pageInfo.subtitle }}</p>

          <div class="page-meta">
            <span>RECORDER. <b>{{ pageInfo.author }}</b></span>
          </div>

          <p class="page-summary">{{ pageInfo.summary }}</p>

          <div class="hero-actions">
            <button class="btn-primary" @click="openWriteModal">
              RECORD THOUGHT
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 便签列表区 -->
    <main class="memos-main container">
      <div class="section-title">
        <h2>时间切片</h2>
        <span>TIMELINE OF MINDS</span>
      </div>

      <p v-if="loadingMemos" class="state-tip">正在读取便签...</p>
      <p v-else-if="loadError" class="state-tip state-tip-error">{{ loadError }}</p>

      <div class="memos-list">
        <div
            v-for="memo in sortedMemos"
            :key="memo.id"
            class="memo-item"
            :class="{ 'memo-item--pinned': memo.pinned }"
            role="button"
            tabindex="0"
            :aria-label="'查看便签 ' + (memo.id || '')"
            @click="openMemoDetail(memo)"
            @keydown.enter.prevent="openMemoDetail(memo)"
            @keydown.space.prevent="openMemoDetail(memo)"
        >
          <!-- 左侧：复古日期排版 -->
          <div class="memo-date-block">
            <span class="date-day">{{ formatMemoDate(memo.createdAt).day }}</span>
            <div class="date-sub">
              <span class="date-my">{{ formatMemoDate(memo.createdAt).monthYear }}</span>
              <span class="date-time">{{ formatMemoDate(memo.createdAt).time }}</span>
            </div>
          </div>

          <!-- 右侧：便签内容 -->
          <div class="memo-content-block">
            <span v-if="memo.pinned" class="memo-pin-badge">置顶</span>
            <div
              class="memo-text memo-text-rich"
              v-html="renderMemoRichText(memo.content)"
            ></div>
            <div class="memo-footer" v-if="memo.tags && memo.tags.length">
              <span v-for="tag in memo.tags" :key="tag" class="memo-tag">
                # {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="!loadingMemos && !loadError && memos.length === 0" class="empty-state">
          尚未记录任何思绪。
        </div>
      </div>
    </main>

    <div
      v-if="isAccessModalVisible"
      class="access-modal-mask"
      role="dialog"
      aria-modal="true"
      @click="onAccessModalMaskClick"
      @keydown="onAccessModalKeydown"
    >
      <div class="access-verify-modal">
        <h3>身份验证</h3>
        <p class="modal-desc">记录便签前，请先输入预设姓名进行验证。</p>
        <input
          v-model="accessNameInput"
          class="modal-input"
          type="text"
          placeholder="请输入姓名"
          autofocus
        />
        <p v-if="accessVerifyError" class="modal-error">{{ accessVerifyError }}</p>
        <div class="modal-actions">
          <span class="shortcut-tip">Press Enter to verify</span>
          <div class="actions-right">
            <button type="button" class="btn-cancel" :disabled="accessVerifyLoading" @click="closeAccessModal">
              取消
            </button>
            <button type="button" class="btn-confirm" :disabled="accessVerifyLoading" @click="submitAccessVerification">
              {{ accessVerifyLoading ? '验证中...' : '验证并继续' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 写入便签弹窗 -->
    <Transition name="write-modal">
      <div
        v-if="isWriteModalVisible"
        class="access-modal-mask write-modal-mask"
        role="dialog"
        aria-modal="true"
        @click="onModalMaskClick"
        @keydown="onModalKeydown"
      >
      <div class="write-modal">
        <h3>记录此刻</h3>
        <p class="modal-desc">捕捉一闪而过的灵感，或是一段平凡的日常。</p>

        <textarea
            v-model="newMemoContent"
            class="modal-textarea"
            placeholder="写下你的想法... 用 **文字** 包裹需要加粗的部分"
            rows="6"
            autofocus
        ></textarea>

        <input
            v-model="newMemoTags"
            class="modal-input"
            type="text"
            placeholder="添加标签 (用逗号分隔，可选)"
        />

        <p v-if="submitError" class="modal-error">{{ submitError }}</p>
        <div class="modal-actions">
          <span class="shortcut-tip">Ctrl + Enter to save</span>
          <div class="actions-right">
            <button type="button" class="btn-cancel" :disabled="isSubmitting" @click="closeWriteModal">
              取消
            </button>
            <button type="button" class="btn-confirm" :disabled="isSubmitting" @click="submitMemo">
              {{ isSubmitting ? '保存中...' : '封存入匣' }}
            </button>
          </div>
        </div>
      </div>
      </div>
    </Transition>

    <!-- 便签详情（点击列表卡片） -->
    <Transition name="write-modal">
      <div
        v-if="detailMemo"
        class="access-modal-mask write-modal-mask memo-detail-mask"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-detail-title"
        @click="onDetailModalMaskClick"
        @keydown="onDetailModalKeydown"
      >
        <div class="write-modal memo-detail-modal">
          <h3 id="memo-detail-title">匣中片段</h3>
          <p v-if="detailMemo.createdAt" class="memo-detail-when">
            <span class="memo-detail-when-day">{{ formatMemoDate(detailMemo.createdAt).day }}</span>
            <span class="memo-detail-when-rest">
              {{ formatMemoDate(detailMemo.createdAt).monthYear }}
              <span class="memo-detail-when-sep">·</span>
              {{ formatMemoDate(detailMemo.createdAt).time }}
            </span>
          </p>
          <div
            class="memo-detail-body memo-detail-body-rich"
            v-html="renderMemoRichText(detailMemo.content)"
          ></div>
          <div v-if="detailMemo.tags && detailMemo.tags.length" class="memo-detail-footer">
            <span v-for="tag in detailMemo.tags" :key="tag" class="memo-tag"># {{ tag }}</span>
          </div>

          <div v-if="isDevUi" class="memo-dev-flags">
            <p class="memo-dev-flags-title">开发者模式 · 置顶</p>
            <p class="memo-dev-flags-hint">
              仅在本地开发（Vite dev）且后端 NODE_ENV=development 时可保存。加粗请在正文中使用 **文字**。
            </p>
            <label class="memo-dev-checkbox">
              <input v-model="devEditPinned" type="checkbox" />
              置顶（列表优先展示）
            </label>
            <p v-if="devFlagsError" class="modal-error">{{ devFlagsError }}</p>
            <button
              type="button"
              class="btn-confirm memo-dev-save"
              :disabled="devFlagsSaving"
              @click.stop="applyMemoDevFlags"
            >
              {{ devFlagsSaving ? '保存中…' : '保存版式设置' }}
            </button>
          </div>

          <div class="modal-actions memo-detail-actions">
            <span class="shortcut-tip">Esc 关闭</span>
            <div class="actions-right">
              <button type="button" class="btn-confirm" @click="closeMemoDetail">
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <footer>
      <p>&copy; 2026 Your Name. All Rights Reserved.</p>
      <p class="footer-sub">ENGINEERED WITH PRECISION</p>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700&family=Noto+Serif+SC:wght@300;400;500;700&display=swap');

.memo-index-page {
  --bg-color: #fcfcfc;
  --text-main: #2c3e50;
  --text-sub: #8e9aa3;
  --text-light: #b0bcc4;
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
  max-width: 800px; /* 比小说页稍窄，更适合阅读短文本 */
  margin: 0 auto;
  padding: 0 20px;
}

/* 顶部信息区 (Hero) */
.page-hero {
  position: relative;
  padding: 140px 0 60px;
  display: flex;
  align-items: center;
}

.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  width: 100%;
}

.info-card {
  text-align: center;
  max-width: 650px;
}

.page-title {
  font-size: 2.6rem;
  font-weight: 400;
  margin-bottom: 5px;
  color: var(--text-main);
  letter-spacing: 0.08em;
}

.page-subtitle {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--text-sub);
  letter-spacing: 0.3em;
  margin-bottom: 25px;
}

.page-meta {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--text-sub);
  letter-spacing: 0.1em;
  margin-bottom: 35px;
}

.page-meta b {
  color: var(--text-main);
  font-weight: 500;
}

.page-summary {
  font-size: 0.95rem;
  color: var(--text-sub);
  line-height: 2.2;
  text-align: justify;
  text-align-last: center;
  margin-bottom: 40px;
}

.btn-primary {
  display: inline-block;
  padding: 12px 36px;
  background: transparent;
  color: var(--text-main);
  border: 1px solid var(--text-main);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.4s ease;
}

.btn-primary:hover {
  background: var(--text-main);
  color: #fff;
}

/* 列表区 */
.memos-main {
  padding: 40px 20px 100px;
}

.section-title {
  text-align: center;
  margin-bottom: 70px;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 1px;
  background-color: var(--border-color);
}

.section-title h2 {
  font-size: 1.8rem;
  font-weight: 300;
  letter-spacing: 0.1em;
}

.section-title span {
  display: block;
  margin-top: 8px;
  font-family: 'Cinzel', serif;
  color: var(--text-sub);
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  opacity: 0.7;
}

.memos-list {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.memo-item {
  display: flex;
  gap: 30px;
  width: 100%;
  box-sizing: border-box;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  transition: all 0.4s ease;
  cursor: pointer;
  text-align: left;
  border-radius: 2px;
}

/* v-html 内的 strong 等节点会拦截点击；统一穿透到整条便签，保证任意位置可打开详情 */
.memo-item * {
  pointer-events: none;
}

.memo-item:focus {
  outline: none;
}

.memo-item:focus-visible {
  outline: 2px solid rgba(200, 90, 90, 0.45);
  outline-offset: 4px;
}

/* 侧边装饰线 */
.memo-item::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 10px;
  bottom: 50px;
  width: 2px;
  background: var(--accent-red);
  opacity: 0;
  transform: scaleY(0);
  transform-origin: top;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  pointer-events: none;
}

.memo-item:hover::before {
  opacity: 0.6;
  transform: scaleY(1);
}

.memo-item--pinned {
  border-left: 3px solid var(--accent-red);
  padding-left: 12px;
  margin-left: -4px;
}

.memo-pin-badge {
  display: inline-block;
  font-family: 'Cinzel', serif;
  font-size: 0.58rem;
  letter-spacing: 0.12em;
  color: var(--accent-red);
  border: 1px solid rgba(200, 90, 90, 0.45);
  padding: 2px 8px;
  margin-bottom: 10px;
  align-self: flex-start;
}

.memo-date-block {
  flex-shrink: 0;
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-family: 'Cinzel', serif;
  color: var(--text-sub);
  padding-top: 5px;
}

.date-day {
  font-size: 2.8rem;
  font-weight: 400;
  color: var(--text-main);
  line-height: 1;
  margin-bottom: 8px;
}

.date-sub {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
}

.date-time {
  opacity: 0.6;
}

.memo-content-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.memo-text {
  font-size: 1.05rem;
  line-height: 2.1;
  color: var(--text-main);
  margin: 0 0 20px 0;
  text-align: justify;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
  line-clamp: 6;
  overflow: hidden;
}

.memo-text-rich :deep(strong) {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.memo-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.memo-tag {
  font-size: 0.75rem;
  color: var(--text-sub);
  letter-spacing: 0.05em;
  transition: color 0.3s;
}

.memo-item:hover .memo-tag {
  color: var(--accent-red);
  opacity: 0.8;
}

.empty-state {
  text-align: center;
  color: var(--text-sub);
  padding: 60px 0;
  font-style: italic;
}

.state-tip {
  text-align: center;
  color: var(--text-sub);
  margin: -20px 0 26px;
  font-size: 0.9rem;
}

.state-tip-error {
  color: var(--accent-red);
}

/* 弹窗样式 */
.access-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(252, 252, 252, 0.85);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.memo-detail-mask {
  z-index: 3010;
}

.memo-detail-modal .modal-actions {
  margin-top: 28px;
}

.memo-detail-when {
  margin: 6px 0 22px;
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  color: var(--text-sub);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 10px;
}

.memo-detail-when-day {
  font-size: 1.35rem;
  font-weight: 400;
  color: var(--text-main);
  letter-spacing: 0.06em;
}

.memo-detail-when-sep {
  opacity: 0.45;
  padding: 0 0.15em;
}

.memo-detail-body {
  font-size: 0.98rem;
  line-height: 2.05;
  color: var(--text-main);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: min(52vh, 440px);
  overflow-y: auto;
  padding-right: 4px;
  margin: 0;
  text-align: justify;
}

.memo-detail-body-rich :deep(strong) {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.memo-dev-flags {
  margin-top: 22px;
  padding: 16px 18px;
  border: 1px dashed rgba(200, 90, 90, 0.35);
  background: rgba(200, 90, 90, 0.04);
}

.memo-dev-flags-title {
  margin: 0 0 6px;
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  color: var(--accent-red);
}

.memo-dev-flags-hint {
  margin: 0 0 14px;
  font-size: 0.78rem;
  color: var(--text-sub);
  line-height: 1.6;
}

.memo-dev-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  color: var(--text-main);
  margin-bottom: 10px;
  cursor: pointer;
}

.memo-dev-checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-red);
}

.memo-dev-save {
  margin-top: 12px;
  width: 100%;
}

.memo-detail-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.memo-detail-modal .memo-tag {
  font-size: 0.78rem;
}

/* 写入弹窗：打开 / 关闭（封存入匣、取消、点遮罩） */
.write-modal-enter-active,
.write-modal-leave-active {
  transition: opacity 1.15s cubic-bezier(0.22, 1, 0.36, 1);
}

.write-modal-enter-active .write-modal,
.write-modal-leave-active .write-modal {
  transition:
    transform 1.2s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 1.05s ease;
}

.write-modal-enter-from,
.write-modal-leave-to {
  opacity: 0;
}

.write-modal-enter-from .write-modal,
.write-modal-leave-to .write-modal {
  transform: translateY(14px) scale(0.97);
  opacity: 0;
}

.write-modal {
  width: min(92vw, 560px);
  background: #fff;
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 60px rgba(16, 22, 30, 0.08);
  padding: 35px 30px;
  display: flex;
  flex-direction: column;
}

.access-verify-modal {
  width: min(92vw, 460px);
  background: #fff;
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 60px rgba(16, 22, 30, 0.08);
  padding: 30px 26px;
  display: flex;
  flex-direction: column;
}

.access-verify-modal h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--text-main);
}

.write-modal h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--text-main);
}

.modal-desc {
  margin: 10px 0 20px;
  color: var(--text-sub);
  font-size: 0.85rem;
}

.modal-textarea,
.modal-input {
  width: 100%;
  border: 1px solid var(--border-color);
  background: #fafafa;
  padding: 15px;
  font-size: 0.95rem;
  font-family: 'Noto Serif SC', serif;
  line-height: 1.8;
  color: var(--text-main);
  outline: none;
  transition: border-color 0.3s ease, background 0.3s;
  box-sizing: border-box;
}

.modal-textarea {
  resize: vertical;
  min-height: 120px;
  margin-bottom: 15px;
}

.modal-textarea:focus,
.modal-input:focus {
  border-color: var(--text-sub);
  background: #fff;
}

.modal-error {
  margin-top: 15px;
  color: var(--accent-red);
  font-size: 0.85rem;
}

.modal-actions {
  margin-top: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shortcut-tip {
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  color: var(--text-light);
  letter-spacing: 0.1em;
}

.actions-right {
  display: flex;
  gap: 12px;
}

.actions-right button {
  border: 1px solid var(--text-main);
  background: transparent;
  color: var(--text-main);
  padding: 8px 18px;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s;
}

.actions-right .btn-cancel {
  border-color: var(--border-color);
  color: var(--text-sub);
}

.actions-right .btn-cancel:hover {
  border-color: var(--text-main);
  color: var(--text-main);
}

.actions-right .btn-confirm {
  background: var(--text-main);
  color: #fff;
}

.actions-right .btn-confirm:hover {
  background: #000;
}

.actions-right button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  letter-spacing: 0.1em;
}

@media (max-width: 768px) {
  .memo-item {
    flex-direction: column;
    gap: 15px;
  }

  .memo-date-block {
    flex-direction: row;
    align-items: baseline;
    gap: 15px;
    width: auto;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
  }

  .date-day {
    font-size: 1.8rem;
    margin: 0;
  }

  .date-sub {
    flex-direction: row;
    gap: 10px;
  }

  .memo-item::before {
    left: -10px;
  }
}
</style>
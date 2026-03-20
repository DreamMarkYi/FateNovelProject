<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import { renderMarkdown } from '@/utils/markdownRenderer'
import {
  hydrateArticleReferences,
  prepareMarkdownWithArticleRefs,
} from '@/utils/articleReferenceRenderer'

const route = useRoute()
const router = useRouter()

const form = reactive({
  id: '',
  title: '',
  chapter: '',
  author: '',
  wordCount: 0,
  updateDate: '',
  coverImage: '',
  markdown: '',
})

const isLoading = ref(false)
const isSaving = ref(false)
const loadError = ref('')
const markdownTextareaRef = ref(null)
const referenceArticles = ref([])
const selectedReferenceId = ref('')
const referenceLoading = ref(false)

const referenceArticleMap = computed(() => {
  const map = new Map()
  referenceArticles.value.forEach((item) => {
    if (item?.id) {
      map.set(item.id, item)
    }
  })
  return map
})

const previewHtml = computed(() => {
  const markdown = prepareMarkdownWithArticleRefs(form.markdown || '')
  const rawHtml = renderMarkdown(markdown)
  return hydrateArticleReferences(rawHtml, referenceArticleMap.value)
})
const previewTitle = computed(() => form.title.trim() || '未命名小说')
const previewChapter = computed(() => form.chapter.trim() || '未命名章节')
const previewAuthor = computed(() => form.author.trim() || 'SYSTEM')
const previewWordCount = computed(() => Number(form.wordCount) || 0)
const previewUpdateDate = computed(() => form.updateDate.trim() || '--')

function applyNovelData(data = {}) {
  form.id = String(data.id || '')
  form.title = String(data.title || '')
  form.chapter = String(data.chapter || '')
  form.author = String(data.author || '')
  form.wordCount = Number(data.wordCount) || 0
  form.updateDate = String(data.updateDate || '')
  form.coverImage = String(data.coverImage || '')
  form.markdown = String(data.markdown || '')
}

async function loadNovel() {
  const chapterId = typeof route.query.id === 'string' ? route.query.id.trim() : ''
  try {
    isLoading.value = true
    loadError.value = ''

    if (chapterId) {
      const response = await portfolioArticleApi.getNovelChapterById(chapterId)
      applyNovelData(response?.data)
      return
    }

    const response = await portfolioArticleApi.getNovelConfig()
    applyNovelData({
      ...response?.data,
      id: response?.data?.id || 'chapter-01',
    })
  } catch (error) {
    loadError.value = '加载小说配置失败，请检查后端服务是否已启动。'
  } finally {
    isLoading.value = false
  }
}

async function loadReferenceArticles() {
  try {
    referenceLoading.value = true
    const response = await portfolioArticleApi.listArticles()
    referenceArticles.value = Array.isArray(response?.data) ? response.data : []
    if (!selectedReferenceId.value && referenceArticles.value.length) {
      selectedReferenceId.value = referenceArticles.value[0].id
    }
  } catch (error) {
    referenceArticles.value = []
  } finally {
    referenceLoading.value = false
  }
}

function insertReferenceSnippet() {
  const id = String(selectedReferenceId.value || '').trim()
  if (!id) {
    return
  }

  const snippet = `\n<article-ref id="${id}"></article-ref>\n`
  const textarea = markdownTextareaRef.value

  if (!textarea) {
    form.markdown += snippet
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const source = form.markdown || ''
  form.markdown = `${source.slice(0, start)}${snippet}${source.slice(end)}`

  requestAnimationFrame(() => {
    const nextPos = start + snippet.length
    textarea.focus()
    textarea.setSelectionRange(nextPos, nextPos)
  })
}

async function onSave() {
  if (isSaving.value) {
    return
  }

  try {
    isSaving.value = true
    const response = await portfolioArticleApi.saveNovelChapter({
      id: form.id,
      title: form.chapter || form.title,
      chapter: form.chapter || form.title,
      author: form.author,
      tags: 'Novel',
      coverImage: form.coverImage,
      markdown: form.markdown,
    })
    const savedId = response?.data?.id
    if (savedId) {
      form.id = savedId
    }
    window.alert('小说章节已保存到 backend/portfolio-Novel 文件夹')
  } catch (error) {
    const message = error?.response?.data?.message || '保存失败，请检查后端服务是否已启动。'
    window.alert(message)
  } finally {
    isSaving.value = false
  }
}

function onCancel() {
  router.push('/portfolio-novel-select')
}

watch(
  () => route.query.id,
  () => {
    loadNovel()
    loadReferenceArticles()
  },
  { immediate: true }
)
</script>

<template>
  <div class="portfolio-workspace-page">
    <header>
      <div class="logo">NOVEL WORKSPACE</div>
      <div class="actions">
        <button :disabled="isSaving" @click="onCancel">PREVIEW</button>
        <button class="primary" :disabled="isSaving" @click="onSave">
          {{ isSaving ? 'SAVING...' : 'SAVE' }}
        </button>
      </div>
    </header>

    <div class="workspace">
      <div class="editor-pane">
        <p v-if="isLoading" class="editor-status">正在加载小说配置...</p>
        <p v-else-if="loadError" class="editor-status editor-status-error">{{ loadError }}</p>

        <div class="input-group">
          <label>CHAPTER ID</label>
          <input v-model="form.id" type="text" placeholder="例如：chapter-01（可选）" />
        </div>

        <div class="input-group">
          <label>BOOK TITLE</label>
          <input v-model="form.title" type="text" placeholder="输入小说名称" />
        </div>

        <div class="input-group">
          <label>CHAPTER TITLE</label>
          <input v-model="form.chapter" type="text" placeholder="输入当前章节名称" />
        </div>

        <div class="inline-group">
          <div class="input-group">
            <label>AUTHOR</label>
            <input v-model="form.author" type="text" placeholder="作者名" />
          </div>
          <div class="input-group">
            <label>WORD COUNT</label>
            <input v-model.number="form.wordCount" type="number" min="0" placeholder="字数" />
          </div>
          <div class="input-group">
            <label>UPDATE DATE</label>
            <input v-model="form.updateDate" type="text" placeholder="例如：2026.03.16" />
          </div>
        </div>

        <div class="input-group">
          <label>COVER IMAGE URL</label>
          <input v-model="form.coverImage" type="text" placeholder="输入封面图 URL" />
        </div>

        <div class="reference-helper">
          <label>ARTICLE REFERENCE (站内文章引用)</label>
          <div class="reference-row">
            <select v-model="selectedReferenceId" :disabled="referenceLoading || !referenceArticles.length">
              <option v-for="item in referenceArticles" :key="item.id" :value="item.id">
                {{ item.title }} ({{ item.id }})
              </option>
            </select>
            <button type="button" @click="insertReferenceSnippet">插入引用</button>
          </div>
          <p class="reference-tip">也可手动输入：`[[article:文章id]]`</p>
        </div>

        <label class="md-label">NOVEL MARKDOWN CONTENT</label>
        <textarea
          ref="markdownTextareaRef"
          v-model="form.markdown"
          class="md-textarea"
          placeholder="在此编辑小说正文（支持 Markdown）..."
        ></textarea>
      </div>

      <div class="preview-pane">
        <div class="preview-header">LIVE PREVIEW</div>
        <div class="preview-content">
          <div class="novel-book-title">{{ previewTitle }}</div>
          <h1 class="chapter-title">{{ previewChapter }}</h1>

          <div class="novel-meta">
            <span class="meta-item">AUTHOR. <b>{{ previewAuthor }}</b></span>
            <span class="meta-item divider">/</span>
            <span class="meta-item">WORDS. <b>{{ previewWordCount }}</b></span>
            <span class="meta-item divider">/</span>
            <span class="meta-item">UPDATED. <b>{{ previewUpdateDate }}</b></span>
          </div>

          <div v-if="form.coverImage.trim()" class="preview-cover-wrap">
            <img :src="form.coverImage.trim()" :alt="previewTitle" class="preview-cover" />
          </div>

          <article class="markdown-body novel-body" v-html="previewHtml"></article>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+SC:wght@300;500;700&display=swap');

.portfolio-workspace-page {
  --bg-color: #fdfdfd;
  --text-main: #2c3e50;
  --text-sub: #8e9aa3;
  --accent-red: #c85a5a;
  --border-color: rgba(0, 0, 0, 0.08);
  font-family: 'Noto Serif SC', serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

header {
  height: 60px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  background: #fff;
  z-index: 100;
}

.logo {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  letter-spacing: 2px;
  font-size: 1.1rem;
}

.actions button {
  background: none;
  border: 1px solid var(--text-main);
  color: var(--text-main);
  padding: 6px 20px;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: 0.3s;
  margin-left: 10px;
}

.actions button.primary {
  background: #eef1f4;
  color: #2f3b45;
}

.actions button:hover {
  background: var(--accent-red);
  color: #fff;
  border-color: var(--accent-red);
}

.actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background: #fff;
  padding: 40px;
  overflow-y: auto;
}

.editor-status {
  margin-bottom: 18px;
  font-size: 0.85rem;
  color: var(--text-sub);
}

.editor-status-error {
  color: var(--accent-red);
}

.inline-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.input-group {
  margin-bottom: 24px;
}

.reference-helper {
  margin-bottom: 16px;
}

.reference-helper label {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--text-sub);
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}

.reference-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.reference-row select {
  flex: 1;
  border: 1px solid var(--border-color);
  padding: 8px 10px;
  font-family: inherit;
  background: #fff;
}

.reference-row button {
  border: 1px solid var(--text-main);
  background: #fff;
  color: var(--text-main);
  padding: 8px 12px;
  cursor: pointer;
}

.reference-tip {
  margin: 6px 0 0;
  font-size: 0.78rem;
  color: var(--text-sub);
}

.input-group label,
.md-label {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--text-sub);
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}

.input-group input {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--border-color);
  padding: 10px 0;
  font-family: inherit;
  font-size: 1rem;
  outline: none;
  transition: 0.3s;
  color: var(--text-main);
  background: transparent;
}

.input-group input:focus {
  border-bottom-color: var(--accent-red);
}

.md-textarea {
  flex: 1;
  width: 100%;
  border: 1px solid var(--border-color);
  outline: none;
  resize: none;
  font-family: monospace;
  font-size: 1rem;
  line-height: 1.8;
  color: #444;
  margin-top: 10px;
  padding: 12px;
  min-height: 320px;
}

.md-textarea:focus {
  border-color: var(--accent-red);
}

.preview-pane {
  flex: 1;
  background: #fafafa;
  overflow-y: auto;
}

.preview-header {
  position: sticky;
  top: 0;
  background: rgba(250, 250, 250, 0.9);
  backdrop-filter: blur(5px);
  padding: 10px 30px;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--text-sub);
  border-bottom: 1px dashed var(--border-color);
  z-index: 10;
  letter-spacing: 2px;
}

.preview-content {
  padding: 40px;
  max-width: 760px;
  margin: 0 auto;
}

.novel-book-title {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  letter-spacing: 0.3em;
  color: #a8d0e6;
  margin-bottom: 20px;
  text-transform: uppercase;
  text-align: center;
}

.chapter-title {
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 24px;
  line-height: 1.4;
  text-align: center;
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
  margin-bottom: 30px;
}

.meta-item b {
  color: var(--text-main);
  font-weight: 500;
  margin-left: 5px;
}

.divider {
  opacity: 0.3;
}

.preview-cover-wrap {
  width: 100%;
  aspect-ratio: 21 / 9;
  overflow: hidden;
  margin-bottom: 40px;
  background: #f4f5f7;
}

.preview-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.novel-body {
  font-size: 1.05rem;
  line-height: 1.9;
  color: #2c3640;
}

:deep(.novel-body .article-reference-block) {
  margin: 18px 0 28px;
}

:deep(.novel-body .article-reference-card) {
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

:deep(.novel-body .article-reference-thumb) {
  width: 78px;
  height: 58px;
  border-radius: 6px;
  object-fit: cover;
  display: block;
}

:deep(.novel-body .article-reference-thumb-empty) {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  letter-spacing: 1px;
  color: #6f7b86;
  background: #dfe3ea;
}

:deep(.novel-body .article-reference-title) {
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
}

:deep(.novel-body .article-reference-meta) {
  margin: 4px 0 2px;
  color: #738293;
  font-size: 0.78rem;
}

:deep(.novel-body .article-reference-tag) {
  font-size: 0.72rem;
  color: #66717c;
}

@media (max-width: 900px) {
  .workspace {
    flex-direction: column;
    overflow: auto;
  }

  .inline-group {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .editor-pane,
  .preview-pane {
    flex: none;
    min-height: 60vh;
    overflow-y: visible;
  }
}
</style>

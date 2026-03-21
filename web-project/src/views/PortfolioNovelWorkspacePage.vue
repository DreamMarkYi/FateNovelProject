<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import { renderMarkdown } from '@/utils/markdownRenderer'

const route = useRoute()
const router = useRouter()

const DEFAULT_VOLUME_NAME = '第一卷：已发布章节'

const form = reactive({
  id: '',
  title: '',
  chapter: '',
  author: '',
  wordCount: 0,
  updateDate: '',
  coverImage: '',
  markdown: '',
  volumeName: DEFAULT_VOLUME_NAME,
})

const isLoading = ref(false)
const isSaving = ref(false)
const loadError = ref('')
const previewHtml = computed(() => renderMarkdown(form.markdown || ''))
const previewTitle = computed(() => form.title.trim() || '未命名小说')
const previewChapter = computed(() => form.chapter.trim() || '未命名章节')
const previewAuthor = computed(() => form.author.trim() || 'SYSTEM')
const previewWordCount = computed(() => Number(form.wordCount) || 0)
const previewUpdateDate = computed(() => form.updateDate.trim() || '--')
const previewVolumeName = computed(() => {
  const s = String(form.volumeName || '').trim()
  return s || DEFAULT_VOLUME_NAME
})

function applyNovelData(data = {}) {
  form.id = String(data.id || '')
  form.title = String(data.title || '')
  form.chapter = String(data.chapter || '')
  form.author = String(data.author || '')
  form.wordCount = Number(data.wordCount) || 0
  form.updateDate = String(data.updateDate || '')
  form.coverImage = String(data.coverImage || '')
  form.markdown = String(data.markdown || '')
  const vn = String(data.volumeName || '').trim()
  form.volumeName = vn || DEFAULT_VOLUME_NAME
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
      volumeName: String(form.volumeName || '').trim() || DEFAULT_VOLUME_NAME,
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

        <div class="input-group">
          <label>VOLUME NAME（卷名）</label>
          <input
            v-model="form.volumeName"
            type="text"
            class="volume-name-input"
            placeholder="例如：第一卷：已发布章节、第二卷：雨与边界"
          />
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

        <label class="md-label">NOVEL MARKDOWN CONTENT</label>
        <textarea
          v-model="form.markdown"
          class="md-textarea"
          placeholder="在此编辑小说正文（支持 Markdown）..."
        ></textarea>
      </div>

      <div class="preview-pane">
        <div class="preview-header">LIVE PREVIEW</div>
        <div class="preview-content">
          <div class="novel-book-title">{{ previewTitle }}</div>
          <p class="preview-volume-label">{{ previewVolumeName }}</p>
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

.volume-name-input {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--border-color);
  padding: 10px 0;
  font-family: inherit;
  font-size: 1rem;
  outline: none;
  background: transparent;
  color: var(--text-main);
}

.volume-name-input:focus {
  border-bottom-color: var(--accent-red);
}

.preview-volume-label {
  text-align: center;
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  color: var(--text-sub);
  margin: -8px 0 16px;
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

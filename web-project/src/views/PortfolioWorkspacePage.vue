<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { defaultWorkspaceDraft } from '@/data/portfolioData'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import { renderMarkdown } from '@/utils/markdownRenderer'
import {
  hydrateArticleReferences,
  prepareMarkdownWithArticleRefs,
} from '@/utils/articleReferenceRenderer'

const router = useRouter()
const route = useRoute()

const form = reactive({
  id: '',
  title: defaultWorkspaceDraft.title,
  tags: defaultWorkspaceDraft.tags,
  coverImage: defaultWorkspaceDraft.coverImage,
  galleryImagesText: (defaultWorkspaceDraft.galleryImages || []).join('\n'),
  markdown: defaultWorkspaceDraft.markdown,
  showInGallery: defaultWorkspaceDraft.showInGallery ?? true,
  showInCatalog: defaultWorkspaceDraft.showInCatalog ?? true,
})

const isSaving = ref(false)
const isLoadingArticle = ref(false)
const loadArticleError = ref('')
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

function applyDraftToForm(draft = {}) {
  form.id = draft.id || ''
  form.title = draft.title || ''
  form.tags = draft.tags || ''
  form.coverImage = draft.coverImage || ''
  form.galleryImagesText = Array.isArray(draft.galleryImages) ? draft.galleryImages.join('\n') : ''
  form.markdown = draft.markdown || ''
  form.showInGallery = draft.showInGallery !== false
  form.showInCatalog = draft.showInCatalog !== false
}

async function loadArticleForEditing(id) {
  if (!id) {
    loadArticleError.value = ''
    applyDraftToForm(defaultWorkspaceDraft)
    return
  }

  try {
    isLoadingArticle.value = true
    loadArticleError.value = ''
    const response = await portfolioArticleApi.getArticleById(id)
    const article = response?.data

    if (!article) {
      loadArticleError.value = '未找到对应文章，已切换为新建模式。'
      applyDraftToForm(defaultWorkspaceDraft)
      return
    }

    applyDraftToForm(article)
  } catch (error) {
    loadArticleError.value = '加载文章失败，请检查后端服务是否已启动。'
    applyDraftToForm(defaultWorkspaceDraft)
  } finally {
    isLoadingArticle.value = false
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

watch(
  () => route.query.id,
  (id) => {
    const articleId = typeof id === 'string' ? id.trim() : ''
    loadArticleForEditing(articleId)
    loadReferenceArticles()
  },
  { immediate: true }
)

const previewTitle = computed(() => form.title.trim() || '未命名项目')
const previewTags = computed(() => form.tags.trim() || 'NO TAGS')
const previewCover = computed(() => form.coverImage.trim())
const previewGalleryImages = computed(() =>
  form.galleryImagesText
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
)
const previewGalleryColumns = computed(() => Math.min(Math.max(previewGalleryImages.value.length, 1), 4))
const previewHtml = computed(() => {
  const markdown = prepareMarkdownWithArticleRefs(form.markdown || '')
  const rawHtml = renderMarkdown(markdown)
  return hydrateArticleReferences(rawHtml, referenceArticleMap.value)
})
const previewLightboxImage = ref('')

function onCancel() {
  router.push('/portfolio')
}

async function onPublish() {
  if (isSaving.value) {
    return
  }

  try {
    isSaving.value = true
    const response = await portfolioArticleApi.saveArticle({
      id: form.id,
      title: form.title,
      tags: form.tags,
      coverImage: form.coverImage,
      galleryImages: previewGalleryImages.value,
      markdown: form.markdown,
      author: 'SYSTEM',
      showInGallery: form.showInGallery,
      showInCatalog: form.showInCatalog,
    })

    const savedId = response?.data?.id
    window.alert('项目数据已保存到文章文件夹。')
    if (savedId) {
      router.push(`/portfolio/${savedId}`)
    } else {
      router.push('/portfolio')
    }
  } catch (error) {
    const message = error?.response?.data?.message || '保存失败，请检查后端服务是否已启动。'
    window.alert(message)
  } finally {
    isSaving.value = false
  }
}

function openPreviewImage(url) {
  previewLightboxImage.value = url
}

function closePreviewImage() {
  previewLightboxImage.value = ''
}
</script>

<template>
  <div class="portfolio-workspace-page">
    <header>
      <div class="logo">WORKSPACE</div>
      <div class="actions">
        <button :disabled="isSaving" @click="onCancel">CANCEL</button>
        <button class="primary" :disabled="isSaving" @click="onPublish">
          {{ isSaving ? 'SAVING...' : 'PUBLISH' }}
        </button>
      </div>
    </header>

    <div class="workspace">
      <div class="editor-pane">
        <p v-if="isLoadingArticle" class="editor-status">正在加载文章数据...</p>
        <p v-else-if="loadArticleError" class="editor-status editor-status-error">{{ loadArticleError }}</p>

        <div class="input-group">
          <label>ARTICLE ID (可选，留空将按标题自动生成)</label>
          <input v-model="form.id" type="text" placeholder="例如：graphrag-multi-agent" />
        </div>

        <div class="input-group">
          <label>PROJECT TITLE</label>
          <input v-model="form.title" type="text" class="title-input" placeholder="输入文章标题..." />
        </div>

        <div class="input-group">
          <label>CATEGORY / TAGS</label>
          <input v-model="form.tags" type="text" placeholder="例如：GRAPHICS / C# / UNITY" />
        </div>

        <div class="input-group">
          <label>COVER IMAGE URL</label>
          <input
            v-model="form.coverImage"
            type="text"
            placeholder="输入作品卡片封面图 URL（列表页使用）"
          />
        </div>

        <div class="input-group">
          <label>GALLERY IMAGE URLS (每行一个)</label>
          <textarea
            v-model="form.galleryImagesText"
            class="gallery-textarea"
            placeholder="输入详情页标题下方图片栏链接，一行一张图片"
          ></textarea>
        </div>

        <div class="input-group">
          <label>DISPLAY OPTIONS</label>
          <div class="display-options">
            <label class="toggle-option">
              <input v-model="form.showInGallery" type="checkbox" />
              <span>显示到图床画廊（Image Wall）</span>
            </label>
            <label class="toggle-option">
              <input v-model="form.showInCatalog" type="checkbox" />
              <span>显示到文章列表（Catalog / Home）</span>
            </label>
          </div>
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
          <p class="reference-tip">也可手动输入：<code>[[article:文章id]]</code></p>
        </div>

        <label class="md-label">MARKDOWN CONTENT</label>
        <textarea
          ref="markdownTextareaRef"
          v-model="form.markdown"
          class="md-textarea"
          placeholder="在此开始撰写正文 (支持 Markdown 语法)..."
        ></textarea>
      </div>

      <div class="preview-pane">
        <div class="preview-header">LIVE PREVIEW (所见即所得)</div>

        <div class="preview-content">
          <span class="preview-tags">{{ previewTags }}</span>
          <h1 class="preview-title">{{ previewTitle }}</h1>
          <div
            v-if="previewGalleryImages.length"
            class="preview-gallery"
            :style="{ '--gallery-columns': previewGalleryColumns }"
          >
            <button
              v-for="(image, index) in previewGalleryImages"
              :key="`${image}-${index}`"
              type="button"
              class="preview-gallery-item"
              @click="openPreviewImage(image)"
            >
              <img :src="image" :alt="`${previewTitle}-图片-${index + 1}`" />
            </button>
          </div>
          <div
            v-else-if="previewCover"
            class="preview-cover"
            :style="{ backgroundImage: `url('${previewCover}')` }"
          ></div>
          <div class="markdown-body" v-html="previewHtml"></div>
        </div>
      </div>
    </div>

    <div v-if="previewLightboxImage" class="preview-lightbox" @click.self="closePreviewImage">
      <button type="button" class="preview-lightbox-close" @click="closePreviewImage">×</button>
      <img :src="previewLightboxImage" alt="预览大图" />
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
  --code-bg: #f4f5f7;
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

.input-group {
  margin-bottom: 30px;
}

.input-group label {
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
  font-size: 1.1rem;
  outline: none;
  transition: 0.3s;
  color: var(--text-main);
  background: transparent;
}

.input-group input:focus {
  border-bottom-color: var(--accent-red);
}

.input-group input.title-input {
  font-size: 1.8rem;
  font-weight: 500;
}

.gallery-textarea {
  width: 100%;
  min-height: 140px;
  border: 1px solid var(--border-color);
  padding: 10px 12px;
  font-family: monospace;
  font-size: 0.95rem;
  line-height: 1.6;
  outline: none;
  resize: vertical;
  background: #fff;
}

.gallery-textarea:focus {
  border-color: var(--accent-red);
}

.display-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 0;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.92rem;
  color: var(--text-main);
}

.toggle-option input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-red);
  cursor: pointer;
}

.reference-helper {
  margin-bottom: 20px;
}

.reference-helper > label {
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
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.reference-tip {
  margin: 8px 0 0;
  font-size: 0.78rem;
  color: var(--text-sub);
}

.reference-tip code {
  font-family: monospace;
  font-size: 0.85em;
  background: var(--code-bg);
  padding: 1px 5px;
  border-radius: 3px;
}

.md-label {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--text-sub);
  letter-spacing: 1.5px;
  margin-top: 10px;
  display: block;
}

.md-textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: monospace;
  font-size: 1.05rem;
  line-height: 1.8;
  color: #444;
  margin-top: 10px;
  background: transparent;
}

.preview-pane {
  flex: 1;
  background: #fafafa;
  overflow-y: auto;
  position: relative;
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
  padding: 50px;
  max-width: 800px;
  margin: 0 auto;
}

.preview-cover {
  width: 100%;
  height: 300px;
  background-color: #eee;
  background-size: cover;
  background-position: center;
  margin-bottom: 40px;
  border: 1px solid var(--border-color);
}

.preview-gallery {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - (var(--gallery-columns, 1) - 1) * 14px) / var(--gallery-columns, 1));
  gap: 14px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  padding-bottom: 8px;
  margin-bottom: 36px;
}

.preview-gallery-item {
  border: 1px solid var(--border-color);
  background: #f4f5f7;
  padding: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  cursor: zoom-in;
}

.preview-gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(0.94);
  transition: transform 0.3s ease;
}

.preview-gallery-item:hover img {
  transform: scale(1.03);
}

.preview-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.preview-lightbox img {
  max-width: min(1200px, 95vw);
  max-height: 90vh;
  object-fit: contain;
}

.preview-lightbox-close {
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

.preview-tags {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  color: var(--accent-red);
  letter-spacing: 2px;
  margin-bottom: 15px;
  display: block;
}

.preview-title {
  font-size: 2.2rem;
  font-weight: 500;
  margin-bottom: 40px;
  line-height: 1.3;
}

.markdown-body {
  font-size: 1.05rem;
  line-height: 1.9;
  text-align: justify;
  color: #333;
}

:deep(.markdown-body h2) {
  font-size: 1.6rem;
  font-weight: 500;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
  margin: 40px 0 20px;
}

:deep(.markdown-body h3) {
  font-size: 1.2rem;
  font-weight: 500;
  margin: 30px 0 15px;
}

:deep(.markdown-body p) {
  margin-bottom: 25px;
}

:deep(.markdown-body img) {
  max-width: 100%;
  height: auto;
  margin: 30px 0;
  border: 1px solid var(--border-color);
}

:deep(.markdown-body blockquote) {
  border-left: 3px solid var(--accent-red);
  color: var(--text-sub);
  background: #fff;
  padding: 15px 20px;
  font-style: italic;
  margin: 30px 0;
}

:deep(.markdown-body pre) {
  background: var(--text-main);
  color: #fff;
  padding: 20px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.9rem;
  margin: 30px 0;
}

:deep(.markdown-body code) {
  background: var(--code-bg);
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.9em;
  color: var(--accent-red);
}

:deep(.markdown-body .katex) {
  font-size: 1.02em;
}

:deep(.markdown-body .katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.35rem 0;
}

:deep(.markdown-body pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  margin-bottom: 25px;
  padding-left: 20px;
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

@media (max-width: 900px) {
  .workspace {
    flex-direction: column;
    overflow: auto;
  }

  .editor-pane,
  .preview-pane {
    flex: none;
    height: auto;
    min-height: 60vh;
    overflow-y: visible;
  }
}
</style>

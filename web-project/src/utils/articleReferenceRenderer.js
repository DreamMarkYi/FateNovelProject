function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const ARTICLE_REF_TOKEN_REGEX = /\[\[\s*article\s*:\s*([a-zA-Z0-9\u4e00-\u9fa5-_]+)\s*\]\]/g

export function prepareMarkdownWithArticleRefs(markdown = '') {
  const source = String(markdown || '')
  return source.replace(ARTICLE_REF_TOKEN_REGEX, (_all, id) => `<article-ref id="${id}"></article-ref>`)
}

function createReferenceCardHtml(article) {
  const safeId = escapeHtml(article?.id || '')
  const safeTitle = escapeHtml(article?.title || '未找到文章')
  const safeCover = escapeHtml(article?.coverImage || '')
  const safeTags = escapeHtml(article?.tags || '文章')
  const safeMeta = escapeHtml(article?.meta || '本站文章')

  const thumbHtml = safeCover
    ? `<img src="${safeCover}" alt="${safeTitle}" class="article-reference-thumb" />`
    : `<div class="article-reference-thumb article-reference-thumb-empty">ARTICLE</div>`

  return `
    <a class="article-reference-card" href="/portfolio/${safeId}">
      <div class="article-reference-left">
        ${thumbHtml}
      </div>
      <div class="article-reference-right">
        <p class="article-reference-title">${safeTitle}</p>
        <p class="article-reference-meta">${safeMeta}</p>
        <span class="article-reference-tag">${safeTags}</span>
      </div>
    </a>
  `
}

export function hydrateArticleReferences(html = '', articleMap = new Map()) {
  const container = document.createElement('div')
  container.innerHTML = String(html || '')

  const refNodes = container.querySelectorAll('article-ref[id]')
  refNodes.forEach((node) => {
    const id = node.getAttribute('id') || ''
    const article = articleMap.get(id)
    const metaText = article?.updatedAt
      ? `${String(article.updatedAt).slice(0, 10).replaceAll('-', '.')} · 本站文章`
      : '本站文章'

    const wrapper = document.createElement('div')
    wrapper.className = 'article-reference-block'
    wrapper.innerHTML = createReferenceCardHtml({
      id,
      title: article?.title || `未找到文章：${id}`,
      coverImage: article?.coverImage || '',
      tags: article?.tags || 'Article',
      meta: metaText,
    })
    node.replaceWith(wrapper)
  })

  return container.innerHTML
}

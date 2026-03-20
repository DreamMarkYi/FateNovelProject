<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { portfolioProjects } from '@/data/portfolioData'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'
import {
  applyOrderByIds,
  loadPortfolioOrderConfig,
  reindexPortfolioCards,
} from '@/utils/portfolioOrderConfig'

const remoteArticles = ref([])
const lastSyncText = ref('未同步')
const syncError = ref('')
const isRefreshing = ref(false)
const isSidebarExpanded = ref(false)
const heroBackgroundImages = ref([])
const orderConfig = ref({
  homeRecentOrder: [],
  catalogOrder: [],
  wallOrder: [],
})
const profileAvatarImage = ref('https://mini-story-bg.oss-cn-shanghai.aliyuncs.com/%E5%A4%B4%E5%83%8F.jpg')
const avatarImageFailed = ref(false)
const contactEmail = ref('wsbhsbd1314@gmail.com')
const copyFeedback = ref('')
let copyFeedbackTimer = null
const recentSectionMode = ref('articles')

// 新增：用于获取“最近文章”区域的 DOM 引用
const recentSectionRef = ref(null)

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
    showInGallery: article.showInGallery !== false,
    detail: {
      date: article.updatedAt ? article.updatedAt.slice(0, 10).replaceAll('-', '.') : 'UNKNOWN',
      author: article.author || 'SYSTEM',
      coverImage: article.coverImage || '',
      galleryImages: Array.isArray(article.galleryImages) ? article.galleryImages : [],
      markdown: article.markdown || '',
    },
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

async function loadDisplayConfig() {
  try {
    const response = await portfolioArticleApi.getDisplayConfig()
    const config = response?.data || {}
    const images = Array.isArray(config.heroBackgroundImages)
        ? config.heroBackgroundImages.map((item) => String(item || '').trim()).filter(Boolean)
        : []

    heroBackgroundImages.value = images
    if (config.profileAvatarImage) {
      profileAvatarImage.value = String(config.profileAvatarImage).trim()
    }
    if (config.contactEmail) {
      contactEmail.value = String(config.contactEmail).trim()
    }
    avatarImageFailed.value = false
  } catch (error) {
    heroBackgroundImages.value = []
    // 不在这里清空 profileAvatarImage，以便保留默认值
    avatarImageFailed.value = false
  }
}

function showCopyFeedback(message) {
  copyFeedback.value = message
  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer)
  }
  copyFeedbackTimer = window.setTimeout(() => {
    copyFeedback.value = ''
  }, 2200)
}

async function copyContactEmail() {
  const email = String(contactEmail.value || '').trim()
  if (!email) {
    showCopyFeedback('邮箱为空，无法复制')
    return
  }

  try {
    await navigator.clipboard.writeText(email)
    showCopyFeedback('邮箱已复制到剪切板')
    return
  } catch (error) {
    // 兼容非安全上下文或浏览器权限限制
  }

  const fallbackInput = document.createElement('textarea')
  fallbackInput.value = email
  fallbackInput.setAttribute('readonly', '')
  fallbackInput.style.position = 'fixed'
  fallbackInput.style.top = '-9999px'
  document.body.appendChild(fallbackInput)
  fallbackInput.select()

  const copied = document.execCommand('copy')
  document.body.removeChild(fallbackInput)
  showCopyFeedback(copied ? '邮箱已复制到剪切板' : '复制失败，请手动复制邮箱')
}

const displayedProjects = computed(() => {
  const source =
      remoteArticles.value.length > 0
          ? remoteArticles.value.filter((item) => item.showInCatalog !== false)
          : portfolioProjects.filter((item) => item.showInCatalog !== false)

  const ordered = applyOrderByIds(source, orderConfig.value.catalogOrder)
  return reindexPortfolioCards(ordered)
})
const featuredProjects = computed(() => {
  const ordered = applyOrderByIds(displayedProjects.value, orderConfig.value.homeRecentOrder)
  return reindexPortfolioCards(ordered).slice(0, 5)
})
const featuredWorks = computed(() => {
  const source =
      remoteArticles.value.length > 0
          ? remoteArticles.value.filter((item) => item.showInGallery !== false)
          : portfolioProjects.filter((item) => item.showInGallery !== false)

  const ordered = applyOrderByIds(source, orderConfig.value.wallOrder)
  return reindexPortfolioCards(ordered).slice(0, 5)
})
const activeRecentProjects = computed(() =>
    recentSectionMode.value === 'articles' ? featuredProjects.value : featuredWorks.value
)
const recentViewMoreRoute = computed(() =>
    recentSectionMode.value === 'articles' ? '/portfolio/catalog' : '/portfolio/wall'
)
const heroStaticImages = computed(() => {
  if (heroBackgroundImages.value.length === 0) {
    return []
  }
  return Array.from({ length: 5 }, (_, index) => {
    return heroBackgroundImages.value[index % heroBackgroundImages.value.length]
  })
})

async function loadOrderConfig() {
  orderConfig.value = await loadPortfolioOrderConfig()
}

function toggleSidebar() {
  isSidebarExpanded.value = !isSidebarExpanded.value
}

function onAvatarImageError() {
  avatarImageFailed.value = true
}

// 跳轉时页面滚动到顶部的辅助函数
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'auto'
  })
}

// 点击 VIEW GALLERY 后切到“最近文章”并滚动到该区域
const scrollToRecent = async () => {
  recentSectionMode.value = 'articles'
  await nextTick()

  const targetElement =
    recentSectionRef.value || document.getElementById('works')

  if (!targetElement) {
    return
  }

  // 先用原生锚点滚动，再做顶部偏移修正，兼容性更稳
  targetElement.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })

  window.setTimeout(() => {
    window.scrollBy({
      top: -88,
      left: 0,
      behavior: 'smooth',
    })
  }, 180)
}

onMounted(async () => {
  await Promise.all([loadRemoteArticles(), loadDisplayConfig(), loadOrderConfig()])
})

onBeforeUnmount(() => {
  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer)
  }
})
</script>

<template>
  <div class="portfolio-home-page">
    <nav>
      <div class="container nav-inner">
        <router-link to="/portfolio" class="logo" @click="scrollToTop">HOMEPAGE</router-link>
        <ul class="nav-links">
          <li class="primary-nav-item"><router-link to="/portfolio/catalog" @click="scrollToTop">ARTICLES</router-link></li>
          <li class="primary-nav-item"><router-link to="/portfolio/wall" @click="scrollToTop">GALLERY</router-link></li>
          <li class="primary-nav-item"><router-link to="/portfolio-novel-select" @click="scrollToTop">NOVEL</router-link></li>
          <li class="primary-nav-item"><router-link to="/portfolio-memo" @click="scrollToTop">MEM0</router-link></li>
        </ul>
      </div>
    </nav>

    <section class="hero">
      <div
          v-if="heroStaticImages.length"
          class="hero-bg-grid"
          aria-hidden="true"
      >
        <div v-for="(image, index) in heroStaticImages" :key="`${image}-${index}`" class="hero-bg-item">
          <img :src="image" :alt="`hero-bg-${index}`" />
        </div>
      </div>
      <div class="container hero-content">
        <h1>Illusions Intersect Dreams</h1>
        <p class="hero-slogan">ARTIST / ILLUSION / DREAM</p>
        <p class="sub-title">Build World & Rendering Realities</p>
        <br />
        <!-- 修改：使用 @click.prevent 绑定自定义跳转方法 -->
        <a href="#" class="btn-scroll" @click.prevent="scrollToRecent">VIEW GALLERY</a>
      </div>

    </section>

    <section id="works" class="section works-with-sidebar">
      <aside class="left-sidebar" :class="{ 'is-expanded': isSidebarExpanded }">
        <button
            type="button"
            class="sidebar-toggle"
            :aria-expanded="isSidebarExpanded"
            :aria-label="isSidebarExpanded ? '收起侧栏' : '展开侧栏'"
            @click="toggleSidebar"
        >
          <div class="mini-avatar-ring" v-show="!isSidebarExpanded">
            <div class="toggle-avatar-mini">
              <img
                  v-if="profileAvatarImage && !avatarImageFailed"
                  :src="profileAvatarImage"
                  alt="mini avatar"
                  class="avatar-image"
                  @error="onAvatarImageError"
              />
              <span v-else class="mini-initial">D</span>
            </div>
          </div>
          <span class="toggle-label" v-show="isSidebarExpanded">CLOSE PROFILE</span>
          <div class="toggle-icon-wrap" v-show="isSidebarExpanded">
            <i class="line-top"></i>
            <i class="line-bottom"></i>
          </div>
        </button>

        <div class="sidebar-panel">
          <div class="profile-card">
            <div class="profile-header">
              <div class="avatar-ring">
                <div class="avatar-inner">
                  <img
                      v-if="profileAvatarImage && !avatarImageFailed"
                      :src="profileAvatarImage"
                      alt="Profile avatar"
                      class="avatar-image"
                      @error="onAvatarImageError"
                  />
                  <span v-else>DrM</span>
                </div>
              </div>
              <h2 class="profile-name">Illusion's DrM</h2>
              <h2 class="profile-name">(王钧艺)</h2>
              <p class="profile-title">TECHNICAL ARTIST </p>
            </div>

            <div class="profile-body">
              <p class="bio-text">
                月厨、杉菜水姬粉丝，喜欢剧情向Galgame以及仁王、如龙、轨迹系列。梦想是有一天能做自己的游戏。
              </p>

              <div class="skill-tags">
                <span>GAME DEVELOPER</span>
                <span>GRAPH RENDERING</span>
                <span>SCENE ARTIST</span>
              </div>
            </div>

            <div class="profile-footer">
              <p class="contact-note">于是春去秋来，四季轮回</p>
              <button type="button" class="btn-elegant" @click="copyContactEmail">GET IN TOUCH</button>
              <p v-if="copyFeedback" class="copy-feedback">{{ copyFeedback }}</p>
            </div>
          </div>
        </div>
      </aside>

      <div class="container works-main">

        <!-- 修改：添加 ref="recentSectionRef" 以便精准定位 -->
        <div class="merged-section-title" ref="recentSectionRef">
          <button
              type="button"
              class="tab-header-btn"
              :class="{ active: recentSectionMode === 'articles' }"
              @click="recentSectionMode = 'articles'"
          >
            <h2>最近文章</h2>
            <span>RECENT ARTICLES</span>
          </button>

          <div class="title-divider"></div>

          <button
              type="button"
              class="tab-header-btn"
              :class="{ active: recentSectionMode === 'works' }"
              @click="recentSectionMode = 'works'"
          >
            <h2>最近作品</h2>
            <span>RECENT WORKS</span>
          </button>
        </div>


        <div class="portfolio-list">
          <router-link
              v-for="project in activeRecentProjects"
              :key="project.id"
              :to="`/portfolio/${project.id}`"
              class="project-row"
              :class="project.typeClass"
              @click="scrollToTop"
          >
            <div class="project-image">
              <img v-if="project.image" :src="project.image" :alt="project.title" />
              <span v-else class="image-placeholder">IMAGE 800x600</span>
            </div>
            <div class="project-info">
              <div class="card-num">{{ project.number }}</div>
              <h3 class="project-title">{{ project.title }}</h3>
              <p class="project-desc">{{ project.description }}</p>
              <div class="tags">{{ project.tags }}</div>
              <span class="detail-link">VIEW DETAIL</span>
            </div>
          </router-link>
        </div>
        <div class="view-more-wrap">
          <router-link :to="recentViewMoreRoute" class="view-more-link" @click="scrollToTop">VIEW MORE</router-link>
        </div>
      </div>
    </section>

    <footer>
      <p>&copy; 2026 Your Name. All Rights Reserved.</p>
      <p class="footer-sub">ENGINEERED WITH PRECISION</p>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+SC:wght@300;500;700&display=swap');

.portfolio-home-page {
  --bg-color: #fdfdfd;
  --text-main: #2c3e50;
  --text-sub: #8e9aa3;
  --accent-ice: #a8d0e6;
  --accent-red: #c85a5a;
  --accent-gold: #d4af37;
  --card-shadow: 0 15px 40px rgba(0, 0, 0, 0.06);
  font-family: 'Noto Serif SC', 'Cinzel', serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  line-height: 1.8;
  overflow-x: hidden;
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

.vertical-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 0.2em;
  opacity: 0.6;
  font-family: 'Cinzel', serif;
  position: absolute;
  font-size: 12px;
}

.right-note {
  right: 30px;
  color: var(--accent-ice);
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
  gap: 40px;
  font-size: 1rem;
  color: var(--text-sub);
}

.nav-links .primary-nav-item {
  transform: translateX(200px);
}

.nav-links a:hover {
  color: var(--accent-red);
}

.hero {
  height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%);
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
      135deg,
      rgba(54, 54, 54, 0.1) 0%,
      rgba(73, 73, 73, 0.1) 100%
  );
  z-index: 0;
}

.hero::before {
  content: '';
  position: absolute;
  top: 15%;
  bottom: 15%;
  left: 60px;
  width: 1px;
  background: var(--text-sub);
  opacity: 0.2;
}

.hero-content {
  text-align: center;
  z-index: 2;
}

.hero-bg-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  z-index: 0;
  overflow: hidden;
}

.hero-bg-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px) saturate(0.9);
  -webkit-backdrop-filter: blur(8px) saturate(0.9);
  z-index: 1;
}

.hero-bg-item {
  height: 100%;
  overflow: hidden;
}

.hero-bg-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.75;
}

.hero h1 {
  font-size: 4.5rem;
  font-weight: 300;
  margin-bottom: 20px;
  letter-spacing: 0.2rem;
  background: -webkit-linear-gradient(45deg, var(--text-main), var(--accent-red));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero p {
  color: rgba(252, 254, 255, 0.96);
  font-size: 1.16rem;
  font-weight: 500;
  letter-spacing: 0.1rem;
  margin-bottom: 40px;
  text-shadow: 0 2px 12px rgba(20, 31, 47, 0.4);
}

.hero .hero-slogan {
  font-size: 1.45rem;
}

.hero .sub-title {
  font-size: 0.92rem;
  color: rgba(244, 248, 255, 0.92);
  margin-top: -30px;
  opacity: 1;
  letter-spacing: 0.12rem;
}

.btn-scroll {
  display: inline-block;
  padding: 12px 35px;
  border: 1px solid var(--accent-red);
  color: var(--accent-red);
  border-radius: 0;
  font-size: 0.9rem;
  letter-spacing: 2px;
  position: relative;
  overflow: hidden;
}

.btn-scroll:hover {
  background: var(--accent-red);
  color: #fff;
}

.section {
  padding: 80px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

/* --- 优化后的合并标签组样式 (呼吸感提升) --- */
.merged-section-title {
  display: flex;
  align-items: center;
  gap: 50px; /* 大幅增加选项之间的间距，提供横向呼吸感 */
  margin-bottom: 30px; /* 增加底部留白，拉开与下方卡片的距离 */
  padding-left: 5px;
}

.tab-header-btn {
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  padding: 0 0 16px 0; /* 增加底部 padding，让指示线离文字更远 */
  position: relative;
  opacity: 0.45; /* 略微提升未激活状态的可见度，避免过度灰暗 */
  transform: translateY(0);
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
  outline: none;
}

.tab-header-btn:hover {
  opacity: 0.8;
}

.tab-header-btn.active {
  opacity: 1;
  transform: translateY(-2px); /* 激活时微微上浮，增加立体感和交互感 */
}

.tab-header-btn h2 {
  font-size: 1rem; /* 已调小：主标题适度缩小 */
  font-weight: 300; /* 降低字重（变细），配合 Noto Serif 更显文艺与轻盈 */
  letter-spacing: 0.15em; /* 撑开中文字间距 */
  color: var(--text-main);
  margin-top: 0;
  margin-bottom: 8px; /* 拉开中英文字体之间的上下间距 */
  transition: color 0.4s ease;
}

.tab-header-btn span {
  display: block;
  font-family: 'Cinzel', serif;
  color: var(--text-sub); /* 默认状态使用低调的副色 */
  font-size: 0.65rem; /* 已调小：英文字号缩小 */
  letter-spacing: 0.35em; /* 极大拉开英文字间距，增强设计感 */
  transition: color 0.4s ease;
}

.tab-header-btn.active span {
  color: var(--accent-ice); /* 激活时英文点亮为冰蓝色 */
}

.tab-header-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px; /* 下划线变细为 1px，更加精致 */
  background-color: var(--accent-red);
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.tab-header-btn.active::after {
  width: 60px; /* 激活时红色下划线稍微延长 */
}

.title-divider {
  width: 1px;
  height: 50px; /* 分割线稍微拉长 */
  /* 使用渐变色让分割线的上下两端自然消散，极其提升质感 */
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.12), transparent);
}
/* ------------------------- */

.sync-tip {
  margin-top: 14px;
  font-size: 0.85rem;
  color: var(--text-sub);
}

.sync-tip-error {
  color: var(--accent-red);
}

.refresh-btn {
  margin-top: 10px;
  border: 1px solid var(--accent-red);
  background: transparent;
  color: var(--accent-red);
  font-family: 'Cinzel', serif;
  font-size: 0.74rem;
  letter-spacing: 0.16em;
  padding: 8px 16px;
  cursor: pointer;
  transition: 0.25s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--accent-red);
  color: #fff;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.portfolio-list {
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.view-more-wrap {
  margin-top: 45px;
  display: flex;
  justify-content: center;
}

.view-more-link {
  display: inline-block;
  padding: 12px 35px;
  border: 1px solid var(--accent-red);
  color: var(--accent-red);
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  transition: 0.3s;
}

.view-more-link:hover {
  background: var(--accent-red);
  color: #fff;
}

.works-with-sidebar {
  position: relative;
  padding-top: 60px;
  padding-bottom: 90px;
}

.left-sidebar {
  position: fixed;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 66px;
  padding: 12px 9px;
  display: flex;
  flex-direction: column;
  border-radius: 0 16px 16px 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  border-left: none;
  box-shadow: 4px 10px 30px rgba(20, 31, 47, 0.08);
  z-index: 900;
  overflow: hidden;
  transition:
      width 0.45s cubic-bezier(0.22, 1, 0.36, 1),
      padding 0.35s ease,
      box-shadow 0.35s ease,
      background-color 0.35s ease;
}

.left-sidebar.is-expanded {
  width: 340px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 10px 20px 50px rgba(20, 31, 47, 0.15);
}

.sidebar-toggle {
  width: 100%;
  min-height: 56px;
  padding: 10px 0;
  background: transparent;
  border: none;
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  cursor: pointer;
  outline: none;
  border-radius: 10px;
  transition: background 0.3s ease;
}

.sidebar-toggle:hover {
  background: rgba(0, 0, 0, 0.03);
}

.mini-avatar-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--accent-red);
  padding: 3px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mini-avatar-ring::after {
  content: '';
  position: absolute;
  top: -4px;
  right: -4px;
  bottom: -4px;
  left: -4px;
  border-radius: 50%;
  border: 1px dashed rgba(200, 90, 90, 0.35);
  animation: spin 20s linear infinite;
}

.toggle-avatar-mini {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #2c3e50, #4ca1af);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  overflow: hidden;
}

.mini-initial {
  color: #fff;
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0;
}

.toggle-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.sidebar-toggle:hover .toggle-label {
  opacity: 1;
}

.toggle-icon-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 14px;
  height: 12px;
  justify-content: center;
  align-items: center;
  position: relative;
}

.toggle-icon-wrap i {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--accent-red);
  transition: all 0.3s ease;
  border-radius: 2px;
}

.left-sidebar.is-expanded .sidebar-toggle {
  min-height: 46px;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0;
}

.left-sidebar.is-expanded .toggle-label {
  writing-mode: horizontal-tb;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  opacity: 0.5;
}

.left-sidebar.is-expanded .sidebar-toggle:hover .toggle-label {
  opacity: 0.8;
}

.left-sidebar.is-expanded .toggle-icon-wrap .line-top {
  transform: translateY(3px) rotate(45deg);
  background-color: var(--text-main);
}
.left-sidebar.is-expanded .toggle-icon-wrap .line-bottom {
  transform: translateY(-3px) rotate(-45deg);
  background-color: var(--text-main);
}

.sidebar-panel {
  max-height: 0;
  opacity: 0;
  transform: translateX(-18px);
  pointer-events: none;
  margin-top: 0;
  overflow: hidden;
  transition:
      max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.25s ease,
      transform 0.35s ease,
      margin-top 0.35s ease;
}

.left-sidebar.is-expanded .sidebar-panel {
  max-height: calc(100vh - 190px);
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
  margin-top: 14px;
  padding-right: 4px;
  overflow-y: auto;
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 15px 30px;
  text-align: center;
}

.profile-header {
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 1px solid var(--accent-red);
  padding: 5px;
  margin-bottom: 20px;
  position: relative;
}

.avatar-ring::after {
  content: '';
  position: absolute;
  top: -6px;
  right: -6px;
  bottom: -6px;
  left: -6px;
  border-radius: 50%;
  border: 1px dashed rgba(200, 90, 90, 0.35);
  animation: spin 20s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #2c3e50, #4ca1af);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: 'Cinzel', serif;
  font-size: 1.6rem;
  letter-spacing: 2px;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-name {
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 5px;
  letter-spacing: 0.05em;
}

.profile-title {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: var(--accent-ice);
  letter-spacing: 0.2em;
}

.profile-body {
  width: 100%;
  position: relative;
  padding: 25px 0;
}

.profile-body::before,
.profile-body::after {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent);
}

.profile-body::before {
  top: 0;
}

.profile-body::after {
  bottom: 0;
}

.bio-text {
  font-size: 0.88rem;
  color: var(--text-sub);
  line-height: 1.9;
  margin-bottom: 25px;
  text-align: justify;
  text-align-last: center;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.skill-tags span {
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  padding: 5px 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fdfdfd;
  color: var(--text-main);
  border-radius: 20px;
  letter-spacing: 0.1em;
  transition: all 0.3s;
}

.skill-tags span:hover {
  border-color: var(--accent-red);
  color: var(--accent-red);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
}

.profile-footer {
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.contact-note {
  font-size: 0.75rem;
  color: var(--text-sub);
  margin-bottom: 15px;
  letter-spacing: 0.05em;
}

.btn-elegant {
  display: inline-block;
  width: 90%;
  padding: 12px 0;
  background: var(--text-main);
  color: #fff;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--text-main);
  cursor: pointer;
}

.btn-elegant:hover {
  background: #fff;
  color: var(--text-main);
}

.copy-feedback {
  margin-top: 10px;
  font-size: 0.72rem;
  color: var(--accent-red);
  letter-spacing: 0.06em;
}

.project-row {
  display: flex;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: 0.5s ease;
  position: relative;
  min-height: 350px;
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

.project-row:hover {
  transform: translateX(10px);
  box-shadow: var(--card-shadow);
  border-color: rgba(0, 0, 0, 0.1);
}

.project-image {
  flex: 0 0 45%;
  position: relative;
  overflow: hidden;
  background: #f4f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease;
}

.project-row:hover .project-image img {
  transform: scale(1.05);
}

.image-placeholder {
  font-family: 'Cinzel', serif;
  color: #bdc3c7;
  letter-spacing: 0.1em;
  position: absolute;
}

.project-info {
  flex: 1;
  padding: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.card-num {
  font-family: 'Cinzel', serif;
  font-size: 4rem;
  opacity: 0.05;
  position: absolute;
  top: 20px;
  right: 30px;
  line-height: 1;
}

.project-title {
  font-size: 1.8rem;
  margin-bottom: 20px;
  font-weight: 500;
}

.project-desc {
  font-size: 1rem;
  color: var(--text-sub);
  margin-bottom: 30px;
  line-height: 1.9;
  text-align: justify;
}

.tags {
  font-size: 0.8rem;
  letter-spacing: 1.5px;
  color: var(--accent-sub);
  text-transform: uppercase;
  font-family: 'Cinzel', serif;
  font-weight: 700;
}

.detail-link {
  margin-top: 14px;
  width: fit-content;
  border-bottom: 1px solid var(--accent-sub);
  color: var(--accent-sub);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 1px;
}

.project-row:nth-child(even) {
  flex-direction: row-reverse;
}

.project-row:nth-child(even):hover {
  transform: translateX(-10px);
}

footer {
  padding: 60px 0;
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

@media (max-width: 900px) {
  .left-sidebar.is-expanded {
    width: min(86vw, 340px);
  }

  /* 移动端调整间距 */
  .merged-section-title {
    justify-content: center;
    gap: 30px; /* 移动端适当缩小间距 */
    padding-left: 0;
  }

  .title-divider {
    height: 40px; /* 移动端分割线调短 */
  }

  .tab-header-btn {
    text-align: center;
  }

  .tab-header-btn::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .project-row,
  .project-row:nth-child(even) {
    flex-direction: column;
    min-height: auto;
  }

  .project-row:hover,
  .project-row:nth-child(even):hover {
    transform: translateY(-5px);
  }

  .project-image {
    height: 250px;
  }

  .project-info {
    padding: 30px;
  }

  .hero h1 {
    font-size: 3rem;
  }
  .nav-links {
    display: none;
  }
}
</style>
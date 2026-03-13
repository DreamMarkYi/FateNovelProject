<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { portfolioProjects } from '@/data/portfolioData'
import { portfolioArticleApi } from '@/api/portfolioArticleApi'

const POLL_INTERVAL_MS = 5000

const remoteArticles = ref([])
const lastSyncText = ref('未同步')
const syncError = ref('')
const isSidebarExpanded = ref(false)
const heroBackgroundImages = ref([])

let pollTimer = null

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
  try {
    const response = await portfolioArticleApi.listArticles()
    const list = Array.isArray(response?.data) ? response.data : []
    remoteArticles.value = list.map(normalizeRemoteProject)
    lastSyncText.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    syncError.value = ''
  } catch (error) {
    syncError.value = '文件夹同步失败，当前展示本地示例数据'
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
  } catch (error) {
    heroBackgroundImages.value = []
  }
}

const displayedProjects = computed(() => {
  if (remoteArticles.value.length > 0) {
    return remoteArticles.value.filter((item) => item.showInCatalog !== false)
  }
  return portfolioProjects.filter((item) => item.showInCatalog !== false)
})
const featuredProjects = computed(() => displayedProjects.value.slice(0, 5))
const heroStaticImages = computed(() => {
  if (heroBackgroundImages.value.length === 0) {
    return []
  }
  return Array.from({ length: 5 }, (_, index) => {
    return heroBackgroundImages.value[index % heroBackgroundImages.value.length]
  })
})

function toggleSidebar() {
  isSidebarExpanded.value = !isSidebarExpanded.value
}

onMounted(async () => {
  await Promise.all([loadRemoteArticles(), loadDisplayConfig()])
  pollTimer = window.setInterval(loadRemoteArticles, POLL_INTERVAL_MS)
})

onUnmounted(() => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
  }
})
</script>

<template>
  <div class="portfolio-home-page">
    <nav>
      <div class="container nav-inner">
        <router-link to="/portfolio" class="logo">COLLECTION</router-link>
        <ul class="nav-links">
          <li><router-link to="/portfolio/catalog">ARTICLES</router-link></li>
          <li><router-link to="/portfolio/wall">GALLERY</router-link></li>
          <li><a href="#contact">CONTACT</a></li>
          <li><router-link to="/portfolio-config">WORKSPACE</router-link></li>
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
        <h1>PORTFOLIO</h1>
        <p>ENGINEERING / ARCHITECTURE / LOGIC</p>
        <p class="sub-title">Architecting Systems & Rendering Realities</p>
        <br />
        <a href="#works" class="btn-scroll">VIEW WORKS</a>
      </div>
      <div class="vertical-text right-note">NO.004 - RENDER</div>
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
          <div class="toggle-avatar-mini" v-show="!isSidebarExpanded">
            <span class="mini-initial">D</span>
          </div>
          <span class="toggle-label">{{ isSidebarExpanded ? 'CLOSE PROFILE' : 'PROFILE' }}</span>
          <div class="toggle-icon-wrap">
            <i class="line-top"></i>
            <i class="line-bottom"></i>
          </div>
        </button>

        <div class="sidebar-panel">
          <div class="profile-card">
            <div class="profile-header">
              <div class="avatar-ring">
                <div class="avatar-inner">DrM</div>
              </div>
              <h2 class="profile-name">Illusion's DrM</h2>
              <p class="profile-title">TECHNICAL ART / DEVELOPER</p>
            </div>

            <div class="profile-body">
              <p class="bio-text">
                月厨、杉菜水姬粉丝，喜欢剧情向 Galgame 以及仁王、如龙系列。梦想是有一天能做自己的游戏。
              </p>
              
              <div class="skill-tags">
                <span>UNITY URP</span>
                <span>GRAPH RENDERING</span>
                <span>LLM AGENTS</span>
              </div>
            </div>

            <div class="profile-footer">
              <p class="contact-note">探讨底层逻辑与视觉边界</p>
              <a href="mailto:email@example.com" class="btn-elegant">GET IN TOUCH</a>
            </div>
          </div>
        </div>
      </aside>

      <div class="container works-main">
        <div class="section-title">
          <h2>核心工程</h2>
          <span>PROJECT DIRECTORY</span>
          <p class="sync-tip">
            {{ syncError || `文件夹自动同步中（每5秒），最近同步：${lastSyncText}` }}
          </p>
        </div>

        <div class="portfolio-list">
          <article
            v-for="project in featuredProjects"
            :key="project.id"
            class="project-row"
            :class="project.typeClass"
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
              <router-link :to="`/portfolio/${project.id}`" class="detail-link">
                VIEW DETAIL
              </router-link>
            </div>
          </article>
        </div>
        <div class="view-more-wrap">
          <router-link to="/portfolio/catalog" class="view-more-link">VIEW MORE</router-link>
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
  font-size: 0.9rem;
  color: var(--text-sub);
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
  padding: 120px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.section-title {
  text-align: center;
  margin-bottom: 80px;
  position: relative;
}

.section-title h2 {
  font-size: 2.2rem;
  font-weight: 300;
  letter-spacing: 0.1em;
}

.section-title span {
  display: block;
  margin-top: 10px;
  font-family: 'Cinzel', serif;
  color: var(--accent-ice);
  font-size: 0.85rem;
  letter-spacing: 0.3em;
}

.sync-tip {
  margin-top: 14px;
  font-size: 0.85rem;
  color: var(--text-sub);
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
  padding-bottom: 90px;
}

.left-sidebar {
  position: fixed;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 58px;
  padding: 10px 8px;
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
  min-height: 140px;
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

.toggle-avatar-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2c3e50, #4ca1af);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
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
}

.btn-elegant:hover {
  background: #fff;
  color: var(--text-main);
}

.works-main .section-title {
  text-align: left;
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

  .works-main .section-title {
    text-align: center;
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

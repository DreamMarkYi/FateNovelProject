<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  /** 内层内容最大宽度，如画廊页可用 1400px */
  innerMaxWidth: {
    type: String,
    default: '1100px',
  },
  /** 首页桌面端链接右移的视觉处理 */
  accentShift: {
    type: Boolean,
    default: false,
  },
  /** 点击任意导航链接后回调（如首页滚动到顶） */
  onLinkClick: {
    type: Function,
    default: undefined,
  },
})

const route = useRoute()
const menuOpen = ref(false)
const MOBILE_QUERY = '(max-width: 768px)'

let mediaQuery = null

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handleNavClick() {
  props.onLinkClick?.()
  closeMenu()
}

function onMediaChange() {
  if (mediaQuery && !mediaQuery.matches) {
    closeMenu()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  }
)

onMounted(() => {
  mediaQuery = window.matchMedia(MOBILE_QUERY)
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', onMediaChange)
  } else {
    mediaQuery.addListener(onMediaChange)
  }
})

onBeforeUnmount(() => {
  if (mediaQuery) {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', onMediaChange)
    } else {
      mediaQuery.removeListener(onMediaChange)
    }
  }
})
</script>

<template>
  <nav
    class="portfolio-site-nav"
    :class="{ 'portfolio-site-nav--accent-shift': accentShift }"
  >
    <div
      class="portfolio-site-nav__inner"
      :style="{ maxWidth: innerMaxWidth }"
    >
      <router-link
        to="/portfolio"
        class="portfolio-site-nav__logo"
        @click="handleNavClick"
      >
        HOMEPAGE
      </router-link>
      <button
        type="button"
        class="portfolio-site-nav__toggle"
        :aria-expanded="menuOpen"
        :aria-label="menuOpen ? '收起站点导航' : '展开站点导航'"
        @click="toggleMenu"
      >
        <span class="portfolio-site-nav__toggle-bar" aria-hidden="true" />
        <span class="portfolio-site-nav__toggle-bar" aria-hidden="true" />
        <span class="portfolio-site-nav__toggle-bar" aria-hidden="true" />
      </button>
      <ul
        class="portfolio-site-nav__links"
        :class="{ 'is-open': menuOpen }"
      >
        <li>
          <router-link to="/portfolio/catalog" @click="handleNavClick">
            ARTICLES
          </router-link>
        </li>
        <li>
          <router-link to="/portfolio/wall" @click="handleNavClick">
            GALLERY
          </router-link>
        </li>
        <li>
          <router-link to="/portfolio-novel-select" @click="handleNavClick">
            NOVEL
          </router-link>
        </li>
        <li>
          <router-link to="/portfolio-memo" @click="handleNavClick">
            MEM0
          </router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700&display=swap');

.portfolio-site-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 20px 0;
  background: rgba(253, 253, 253, 0.9);
  backdrop-filter: blur(10px);
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.portfolio-site-nav__inner {
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  box-sizing: border-box;
}

.portfolio-site-nav__logo {
  font-size: 1.2rem;
  letter-spacing: 0.1em;
  font-weight: 700;
  font-family: 'Cinzel', serif;
  text-decoration: none;
  color: inherit;
  transition: color 0.3s;
  flex-shrink: 0;
  order: 1;
}

.portfolio-site-nav__logo:hover {
  color: var(--accent-red, #c85a5a);
}

.portfolio-site-nav__toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  flex-shrink: 0;
  order: 2;
  margin-left: auto;
  transition: border-color 0.2s, background 0.2s;
}

.portfolio-site-nav__toggle:hover {
  border-color: var(--accent-red, #c85a5a);
}

.portfolio-site-nav__toggle:focus-visible {
  outline: 2px solid var(--accent-red, #c85a5a);
  outline-offset: 2px;
}

.portfolio-site-nav__toggle-bar {
  display: block;
  width: 20px;
  height: 2px;
  margin: 0 auto;
  background: var(--text-main, #2c3e50);
  border-radius: 1px;
  transition: transform 0.25s ease, opacity 0.2s;
}

.portfolio-site-nav__toggle[aria-expanded='true'] .portfolio-site-nav__toggle-bar:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.portfolio-site-nav__toggle[aria-expanded='true'] .portfolio-site-nav__toggle-bar:nth-child(2) {
  opacity: 0;
}

.portfolio-site-nav__toggle[aria-expanded='true'] .portfolio-site-nav__toggle-bar:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.portfolio-site-nav__links {
  display: flex;
  align-items: center;
  gap: 40px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.9rem;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.1em;
  color: var(--text-sub, #8e9aa3);
  order: 3;
}

.portfolio-site-nav__links a {
  text-decoration: none;
  color: inherit;
  transition: color 0.3s;
}

.portfolio-site-nav__links a:hover {
  color: var(--accent-red, #c85a5a);
}

.portfolio-site-nav--accent-shift .portfolio-site-nav__links > li {
  transform: translateX(200px);
}

@media (max-width: 768px) {
  .portfolio-site-nav--accent-shift .portfolio-site-nav__links > li {
    transform: none;
  }

  .portfolio-site-nav__toggle {
    display: flex;
    margin-left: auto;
  }

  .portfolio-site-nav__links {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    width: 100%;
    flex-basis: 100%;
    order: 3;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    border-top: 1px solid transparent;
    transition:
      max-height 0.3s ease,
      opacity 0.25s ease,
      padding 0.3s ease,
      border-color 0.2s ease;
  }

  .portfolio-site-nav__links.is-open {
    max-height: 280px;
    opacity: 1;
    padding-top: 12px;
    margin-top: 4px;
    border-top-color: rgba(0, 0, 0, 0.08);
  }

  .portfolio-site-nav__links li {
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .portfolio-site-nav__links li:last-child {
    border-bottom: none;
  }

  .portfolio-site-nav__links a {
    display: block;
    padding: 12px 4px;
    font-size: 0.88rem;
  }
}
</style>

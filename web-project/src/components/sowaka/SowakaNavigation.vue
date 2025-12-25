<template>
  <nav 
    :class="{ 'nav-visible': isNavVisible }"
    @mouseenter="showNav"
    @mouseleave="hideNav"
  >
    <div class="logo" @click="handleLogoClick">そわか</div>
    <ul class="nav-links" :class="{ 'mobile-open': mobileMenuOpen }">
      <li><router-link to="/cards" @click="handleNavClick">人物介绍</router-link></li>
      <li><router-link to="/doodle-story" @click="handleNavClick">幕间故事</router-link></li>
    </ul>
    <div class="menu-toggle" @click="toggleMobileMenu">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserSession } from '@/composables/useUserSession'

const props = defineProps({
  mobileMenuOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-mobile-menu'])

const router = useRouter()
const userSession = useUserSession()
const isNavVisible = ref(false)

const showNav = () => {
  isNavVisible.value = true
}

const hideNav = () => {
  isNavVisible.value = false
}

const toggleMobileMenu = () => {
  emit('toggle-mobile-menu')
}

const handleNavClick = () => {
  // 点击导航时关闭移动端菜单（如果需要）
  if (props.mobileMenuOpen) {
    emit('toggle-mobile-menu')
  }
}

const handleLogoClick = async () => {
  // 确保用户会话已初始化
  if (!userSession.userId.value) {
    await userSession.initSession('SowakaNavigation')
  }
  
  // 验证用户身份
  const { identity } = await userSession.verifyIdentity()
  
  // 根据用户身份跳转到对应页面
  if (identity === 'day') {
    router.push('/exDay')
  } else if (identity === 'night') {
    router.push('/exNight')
  } else {
    // 如果用户未选择身份，跳转到开始页面
    router.push('/start')
  }
}
</script>

<style scoped>
/* Navigation */
nav {
  position: fixed;
  top: 0;
  width: 100%;
  background-color: rgba(250, 249, 247, 0.0);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 1000;
  padding: 20px 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 51, 51, 0.08);
  opacity: 0.0;
  transform: translateY(-10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

nav.nav-visible {
  opacity: 1;
  transform: translateY(0);
}

.logo {
  font-size: 24px;
  font-weight: 300;
  letter-spacing: 3px;
  color: #1c1c1c;
  cursor: pointer;
  transition: opacity 0.3s;
}

.logo:hover {
  opacity: 0.6;
}

.nav-links {
  display: flex;
  gap: 40px;
  list-style: none;
}

.nav-links a {
  text-decoration: none;
  color: #2c2c2c;
  font-size: 14px;
  letter-spacing: 2px;
  transition: opacity 0.3s;
  font-weight: 300;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  opacity: 0.6;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  cursor: pointer;
  gap: 5px;
}

.menu-toggle span {
  width: 25px;
  height: 2px;
  background-color: #2e2e2e;
}

/* Responsive */
@media (max-width: 768px) {
  nav {
    padding: 15px 20px;
  }

  .nav-links {
    display: none;
  }

  .nav-links.mobile-open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 70px;
    right: 20px;
    background: rgba(250, 249, 247, 0.0);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    gap: 20px;
  }

  .menu-toggle {
    display: flex;
  }
}
</style>

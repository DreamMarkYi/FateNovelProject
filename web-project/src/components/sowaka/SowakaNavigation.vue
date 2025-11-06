<template>
  <nav>
    <div class="logo">そわか</div>
    <ul class="nav-links" :class="{ 'mobile-open': mobileMenuOpen }">
      <li><a href="#story" @click="scrollToSection">物語</a></li>
      <li><a href="#concept" @click="scrollToSection">コンセプト</a></li>
      <li><a href="#rooms" @click="scrollToSection">客室</a></li>
      <li><a href="#news" @click="scrollToSection">お知らせ</a></li>
      <li><a href="#access" @click="scrollToSection">アクセス</a></li>
    </ul>
    <div class="menu-toggle" @click="toggleMobileMenu">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  mobileMenuOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-mobile-menu', 'scroll-to-section'])

const toggleMobileMenu = () => {
  emit('toggle-mobile-menu')
}

const scrollToSection = (event) => {
  emit('scroll-to-section', event)
}

const emit = defineEmits(['toggle-mobile-menu', 'scroll-to-section'])
</script>

<style scoped>
/* Navigation */
nav {
  position: fixed;
  top: 0;
  width: 100%;
  background-color: rgba(250, 249, 247, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1000;
  padding: 20px 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 51, 51, 0.1);
}

.logo {
  font-size: 24px;
  font-weight: 300;
  letter-spacing: 3px;
  color: #333;
}

.nav-links {
  display: flex;
  gap: 40px;
  list-style: none;
}

.nav-links a {
  text-decoration: none;
  color: #333;
  font-size: 14px;
  letter-spacing: 2px;
  transition: opacity 0.3s;
  font-weight: 300;
}

.nav-links a:hover {
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
  background-color: #333;
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
    background: rgba(250, 249, 247, 0.98);
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

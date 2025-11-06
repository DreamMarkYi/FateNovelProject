<template>
  <div class="sowaka-page">
    <!-- Navigation -->
    <SowakaNavigation 
      :mobile-menu-open="mobileMenuOpen"
      @toggle-mobile-menu="toggleMobileMenu"
      @scroll-to-section="scrollToSection"
    />

    <!-- Hero Section -->
    <SowakaHero />

    <!-- Vertical Logo and Text Section -->
    <SowakaVerticalSection />

    <!-- Story Content Section -->
    <SowakaStorySection :sowaka-story="sowakaStory" />

    <!-- Characters/Rooms Section -->
    <SowakaRoomsSection 
      :rooms="rooms"
      :active-room="activeRoom"
      @select-room="selectRoom"
    />

    <!-- News Section -->
    <SowakaNewsSection 
      :active-room-data="activeRoomData"
      :news-content-alignment="newsContentAlignment"
    />

    <!-- Concept Section -->
    <SowakaConceptSection :concepts="concepts" />

    <!-- Footer -->
    <SowakaFooter @scroll-to-section="scrollToSection" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSowakaPage } from '../composables/useSowakaPage'

// 导入组件
import SowakaNavigation from '../components/sowaka/SowakaNavigation.vue'
import SowakaHero from '../components/sowaka/SowakaHero.vue'
import SowakaVerticalSection from '../components/sowaka/SowakaVerticalSection.vue'
import SowakaStorySection from '../components/sowaka/SowakaStorySection.vue'
import SowakaRoomsSection from '../components/sowaka/SowakaRoomsSection.vue'
import SowakaNewsSection from '../components/sowaka/SowakaNewsSection.vue'
import SowakaConceptSection from '../components/sowaka/SowakaConceptSection.vue'
import SowakaFooter from '../components/sowaka/SowakaFooter.vue'

// 使用 composable
const {
  // 状态
  mobileMenuOpen,
  activeRoom,
  activeRoomIndex,
  loading,
  error,
  rooms,
  concepts,
  sowakaStory,
  
  // 计算属性
  newsContentAlignment,
  activeRoomData,
  
  // 方法
  toggleMobileMenu,
  selectRoom,
  scrollToSection,
  initialize
} = useSowakaPage()

// 页面挂载时初始化
onMounted(async () => {
  await initialize()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.sowaka-page {
  font-family: 'Yu Mincho', 'YuMincho', 'Hiragino Mincho Pro', 'MS PMincho', serif;
  color: #333;
  background-color: #faf9f7;
  line-height: 1.8;
  overflow-x: hidden;
}
</style>
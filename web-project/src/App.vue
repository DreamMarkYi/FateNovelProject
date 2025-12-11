<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 页面加载完成后添加loaded类
  document.body.classList.add('loaded')
})
</script>

<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

body {
  opacity: 0;
  transform: scale(1.05);
  transition: opacity 1s ease-out, transform 1s ease-out;
}

body.loaded {
  opacity: 1;
  transform: scale(1);
}

#app {
  width: 100%;
  min-height: 100vh;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}


</style>

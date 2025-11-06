<template>
  <section class="news fade-in" id="news">
    <div 
      class="news-content" 
      :class="newsContentAlignment"
    >
      <transition name="fade" mode="out-in">
        <div 
          :key="activeRoomData.id"
          class="news-item room-content"
        >
          <div class="news-date">{{ activeRoomData.date }}</div>
          <div class="news-title">{{ activeRoomData.title }}</div>
          <div class="news-divider"></div>
          <div class="news-description">
            <p v-for="(paragraph, idx) in activeRoomData.description" :key="idx">
              {{ paragraph }}
            </p>
            <div v-if="activeRoomData.details" class="news-details">
              <p v-for="(detail, idx) in activeRoomData.details" :key="idx">
                {{ detail }}
              </p>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </section>
</template>

<script setup>
defineProps({
  activeRoomData: {
    type: Object,
    required: true
  },
  newsContentAlignment: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
/* News Section */
.news {
  padding: 0;
  margin: 0;
  background-color: transparent;
  display: block;
  position: relative;
  z-index: 1;
}

.news-content {
  background-color: rgba(70, 70, 70, 0.98);
  backdrop-filter: blur(10px);
  flex: 0 0 auto;
  padding: 50px 45px;
  max-width: 520px;
  min-width: 380px;
  position: absolute;
  bottom: 60px;
  z-index: 100;
  left: 0;
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border-left: 3px solid rgba(255, 255, 255, 0.1);
}

.news-content.align-left {
  left: 3%;
}

.news-content.align-center {
  left: 36%;
}

.news-content.align-right {
  left: 69%;
}

.news-item {
  transition: all 0.3s;
  cursor: default;
}

.news-date {
  font-size: 13px;
  color: #e8e8e8;
  letter-spacing: 2px;
  margin-bottom: 20px;
  font-weight: 300;
  text-transform: uppercase;
}

.news-title {
  font-size: 18px;
  color: #ffffff;
  line-height: 2;
  letter-spacing: 0.1em;
  margin-bottom: 20px;
  font-weight: 400;
}

.news-description {
  font-size: 13px;
  color: #d4d4d4;
  line-height: 2.2;
  letter-spacing: 0.05em;
}

.news-description p {
  margin-bottom: 15px;
}

.news-divider {
  width: 60px;
  height: 1px;
  background-color: #999;
  margin: 30px 0;
}

.news-details {
  margin-top: 25px;
  padding-top: 0;
  border-left: none;
}

.news-details p {
  font-size: 13px;
  color: #bbb;
  line-height: 1.8;
  margin-bottom: 8px;
}

/* Fade transition for room content */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scroll Animations */
.fade-in {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s, transform 0.8s;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
  .news {
    position: relative;
    margin-top: 0;
  }

  .news-content {
    padding: 35px 25px;
    min-width: auto;
    max-width: calc(100% - 40px);
    position: relative;
    left: 0 !important;
    bottom: auto;
    margin: 20px;
    border-left: 2px solid rgba(255, 255, 255, 0.1);
  }
}
</style>

<template>
  <section class="vertical-section fade-in" id="story">
    <div class="vertical-container">
      <div class="vertical-logo-box">
        <div class="vertical-logo-text">{{sowakaStory.chapterName}}</div>
      </div>
      <div class="vertical-text-container">
        <div class="vertical-column">{{sowakaStory.prefaceContext}}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  sowakaStory: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
/* Component 1: Vertical Logo and Text */
.vertical-section {
  padding: 120px 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #faf9f7;
  min-height: 80vh;
}

.vertical-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 50px;
}

.vertical-logo-box {
  background-color: #1a1a1a;
  padding: 25px 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.vertical-logo-text {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 22px;
  letter-spacing: 0.4em;
  color: #fff;
  font-weight: 300;
}

.vertical-text-container {
  display: flex;
  gap: 25px;
  padding: 40px 50px;
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
}

.vertical-column {
  writing-mode: vertical-rl;
  font-size: 15px;
  letter-spacing: 0.15em;
  color: #555;
  line-height: 2;
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
  .vertical-section {
    padding: 80px 20px;
  }

  .vertical-text-container {
    gap: 20px;
    padding: 0 20px;
  }

  .vertical-column {
    font-size: 14px;
  }
}
</style>

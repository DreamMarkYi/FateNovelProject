<template>
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">そわか</h1>
      <p class="hero-subtitle">SOWAKA KYOTO</p>
    </div>
  </section>
</template>

<script setup>
// 这个组件不需要任何props或逻辑
</script>

<style scoped>
/* Hero Section */
.hero {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #faf9f7 0%, #f5f0eb 100%);
}

.hero-content {
  text-align: center;
  padding: 0 20px;
}

.hero-title {
  font-size: 52px;
  font-weight: 300;
  letter-spacing: 12px;
  margin-bottom: 30px;
  color: #333;
  opacity: 0;
  animation: fadeInUp 1s forwards 0.3s;
}

.hero-subtitle {
  font-size: 16px;
  letter-spacing: 3px;
  color: #666;
  font-weight: 300;
  opacity: 0;
  animation: fadeInUp 1s forwards 0.6s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
    letter-spacing: 8px;
  }
}
</style>

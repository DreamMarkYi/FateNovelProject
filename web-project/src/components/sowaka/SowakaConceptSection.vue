<template>
  <section class="concept-section fade-in" id="concept">
    <h2 class="section-title">― そわかの心 ―</h2>
    <div class="concept-grid">
      <div 
        v-for="concept in concepts" 
        :key="concept.id"
        class="concept-card"
      >
        <h3>{{ concept.title }}</h3>
        <p>{{ concept.description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  concepts: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
/* Concept Section */
.concept-section {
  padding: 150px 50px;
  background-color: #faf9f7;
  margin-top: 0;
  position: relative;
  z-index: 0;
}

.section-title {
  text-align: center;
  font-size: 14px;
  letter-spacing: 5px;
  margin-bottom: 80px;
  color: #555;
  font-weight: 300;
  padding: 25px 0;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  display: block;
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.concept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 50px;
  max-width: 1400px;
  margin: 0 auto;
}

.concept-card {
  background-color: #fff;
  padding: 60px 50px;
  border: none;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.concept-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.concept-card h3 {
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 3px;
  margin-bottom: 30px;
  color: #333;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8e0d5;
}

.concept-card p {
  font-size: 14px;
  line-height: 2.5;
  color: #666;
  letter-spacing: 0.05em;
  text-align: left;
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
  .concept-section {
    padding: 80px 20px;
  }

  .concept-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>

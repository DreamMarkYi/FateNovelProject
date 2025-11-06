<template>
  <section class="characters-section fade-in" id="rooms">
    <div class="characters-grid">
      <div 
        v-for="(room, index) in rooms" 
        :key="room.id"
        class="character-card" 
        :class="{ active: activeRoom === room.id }"
        :data-room="room.id"
        @click="selectRoom(room.id, index)"
      >
        <div class="character-name">{{ room.name }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  rooms: {
    type: Array,
    required: true
  },
  activeRoom: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['select-room'])

const selectRoom = (roomId, index) => {
  emit('select-room', roomId, index)
}
</script>

<style scoped>
/* Character Cards Section */
.characters-section {
  padding: 0;
  background-color: #3d4a3d;
  position: relative;
  padding-bottom: 450px;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  width: 100%;
  background-color: #2a3a2a;
}

.character-card {
  aspect-ratio: 4/3;
  background: linear-gradient(135deg, #5a6b5a 0%, #4a5a4a 100%);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s ease;
  display: flex;
  align-items: flex-end;
  padding: 40px;
}

.character-card.active {
  transform: translateY(-5px);
  z-index: 10;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  background: linear-gradient(135deg, #6a7b6a 0%, #5a6a5a 100%);
}

.character-card:not(.active) {
  opacity: 0.6;
}

.character-card:hover:not(.active) {
  opacity: 0.8;
}

.character-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 70%);
  z-index: 1;
  transition: all 0.4s;
}

.character-card.active::before {
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%);
}

.character-name {
  position: relative;
  color: #f0f0f0;
  font-size: 22px;
  font-weight: 300;
  letter-spacing: 3px;
  z-index: 2;
  text-shadow: 0 2px 8px rgba(0,0,0,0.4);
  transition: all 0.3s;
}

.character-card.active .character-name {
  font-size: 24px;
  letter-spacing: 4px;
  color: #fff;
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
  .characters-section {
    min-height: auto;
    padding: 20px 0;
    padding-bottom: 100px;
  }

  .characters-grid {
    grid-template-columns: 1fr;
    gap: 1px;
  }

  .character-card {
    aspect-ratio: 16/9;
  }
}
</style>

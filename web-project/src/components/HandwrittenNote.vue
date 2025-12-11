<template>
  <div 
    class="handwritten-note"
    :style="{
      left: `${worldPosition.x}px`,
      top: `${worldPosition.y}px`,
      transform: `rotate(${rotation}deg) scale(${scale})`
    }"
  >
    {{ text }}
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: 'keep going！！！'
  },
  worldPosition: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  rotation: {
    type: Number,
    default: 12
  },
  scale: {
    type: Number,
    default: 1.1
  }
})
</script>

<style scoped>
.handwritten-note {
  position: absolute;
  color: #7a6e66; /* var(--pencil-light) */
  font-family: 'Gloria Hallelujah', cursive;
  font-size: 30px;
  pointer-events: none;
  z-index: 3;
  border-bottom: 2px solid rgba(80, 60, 40, 0.15);
  border-radius: 50% 20% / 10% 40%;
  padding: 10px;
  mix-blend-mode: multiply;
  white-space: nowrap;
  transform-origin: center center;
}
</style>


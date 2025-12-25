<template>
  <div 
    class="node" 
    :class="{ locked: node.locked }"
    :style="{
      top: node.position.top,
      left: node.position.left,
      transform: `rotate(${node.rotation})`
    }"
    @click="handleClick"
  >
    <!-- 节点 ID 标签 -->
    <div class="node-id">{{ node.id }}</div>

    <!-- 节点图片区域 -->
    <div class="node-img">
      <img v-if="node.image" :src="node.image" :alt="node.name" />
    </div>

    <!-- 节点名称 -->
    <div class="node-name" v-html="formatName(node.name)"></div>

    <!-- 星级评分 -->
    <div class="stars">
      <span 
        v-for="i in 3" 
        :key="i"
        class="star-shape" 
        :class="{ active: i <= node.stars }"
      >
        {{ i <= node.stars ? '★' : '☆' }}
      </span>
    </div>

    <!-- 高亮标记 -->
    <div v-if="node.highlighted" class="highlight-mark"></div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click', props.node)
}

const formatName = (name) => {
  return name.replace(/\n/g, '<br>')
}
</script>

<style scoped>
.node {
  position: absolute;
  width: 160px;
  height: 200px;
  background: #fbfaf3;
  border: 2px solid #362f2d;
  border-radius: 2% 4% 3% 5% / 95% 4% 92% 5%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 15px;
  z-index: 2;
  transition: transform 0.3s ease;
  box-shadow: 3px 4px 10px rgba(0, 0, 0, 0.1);
}

.node::after {
  content: '';
  position: absolute;
  top: 6px;
  left: 6px;
  width: 100%;
  height: 100%;
  border-radius: 2% 4% 3% 5% / 95% 4% 92% 5%;
  z-index: -1;
  background: repeating-linear-gradient(
    -45deg,
    #362f2d,
    #362f2d 1px,
    transparent 1px,
    transparent 4px
  );
  opacity: 0.1;
  transition: all 0.3s ease;
}

.node:hover {
  transform: translate(-3px, -3px) rotate(-1deg) !important;
}

.node:hover::after {
  transform: translate(2px, 2px);
  opacity: 0.2;
}

.node-img {
  width: 80px;
  height: 60px;
  border: 2px dashed #7a6e66;
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.node-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.node-img::before {
  content: 'IMG';
  font-size: 12px;
  opacity: 0.5;
  transform: rotate(-10deg);
}

.node-img:has(img)::before {
  content: '';
}

.node-name {
  font-family: 'Gloria Hallelujah', cursive;
  font-size: 18px;
  text-align: center;
  line-height: 1.2;
  margin-bottom: 8px;
}

.node-id {
  position: absolute;
  top: -10px;
  left: -10px;
  background: #eaddcf;
  border: 2px solid #362f2d;
  border-radius: 50% 40% 60% 45% / 40% 55% 45% 60%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.stars {
  display: flex;
  gap: 5px;
}

.star-shape {
  font-size: 16px;
  line-height: 1;
  color: #7a6e66;
  transition: all 0.3s ease;
}

.star-shape.active {
  color: #c92a2a;
  text-shadow: 0 0 1px #c92a2a;
  opacity: 0.9;
}

.node.locked {
  opacity: 0.7;
  background: #e8e0d0;
  cursor: not-allowed;
}

.node.locked .node-name {
  text-decoration: line-through;
  opacity: 0.6;
}

.highlight-mark {
  position: absolute;
  right: -12px;
  bottom: -8px;
  border: 3px solid #c92a2a;
  border-radius: 55% 45% 60% 40% / 40% 60% 50% 50%;
  width: 35px;
  height: 25px;
  transform: rotate(-15deg);
  opacity: 0.8;
  mix-blend-mode: multiply;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .node {
    width: 140px;
    height: 180px;
    padding: 12px;
  }

  .node-img {
    width: 70px;
    height: 50px;
  }

  .node-name {
    font-size: 16px;
  }

  .star-shape {
    font-size: 14px;
  }
}
</style>


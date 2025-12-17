<template>
  <div class="detail-view" :style="detailStyleVars">
    <a href="#" class="back-btn" @click.prevent="$emit('close')">
      <span>← BACK TO COLLECTION</span>
    </a>

    <div class="visual-section">
      <div class="sigil-bg"></div>

      <div class="vertical-deco">
        {{ card.title }} <br><br> {{ card.label }}
      </div>

      <div class="character-art-container">
        <img :src="card.backgroundImage" class="character-art" alt="Character Art">
      </div>

      <div class="class-badge">
        <div class="class-icon">
          <span class="class-symbol">{{ card.season.charAt(0) }}</span>
        </div>
        <div class="class-name">{{ card.season }}</div>
      </div>
    </div>

    <div class="info-section">
      <div class="character-name-group">
        <div class="name-vertical">{{ card.title }}</div>
        <div class="name-sub">{{ card.subtitle }}</div>
      </div>

      <div class="content-panel">
        <div class="section-title">Profile</div>
        <p class="flavor-text" v-html="card.intro"></p>

        <div class="section-title">Parameters</div>
        <div class="stats-grid">
          <div class="stat-item" v-for="(val, key) in card.stats" :key="key">
            <span class="stat-label">{{ key }}</span>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill" :style="{ width: val + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="section-title">Skills</div>
        <ul class="skills-list">
          <li class="skill-item" v-for="(skill, idx) in card.skills" :key="idx">
            <div class="skill-icon">{{ romanize(idx + 1) }}</div>
            <div class="skill-info">
              <h4>{{ skill.name }}</h4>
              <p>{{ skill.desc }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div class="collection-no">{{ card.number.split(' ').pop() }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 接收父组件传入的数据
const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

// 定义向外触发的事件
const emit = defineEmits(['close'])

// 计算详情页的 CSS 变量（用于动态主题色）
const detailStyleVars = computed(() => {
  if (!props.card) return {}
  const color = props.card.overlayColor || '#333'
  return {
    '--theme-color': color,
    '--theme-bg-gradient': `linear-gradient(135deg, #fdfbfb 0%, ${color}1A 100%)`,
    '--theme-border': `${color}4D`
  }
})

// 罗马数字转换工具
const romanize = (num) => {
  const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1}
  let roman = '', i
  for ( i in lookup ) {
    while ( num >= lookup[i] ) {
      roman += i
      num -= lookup[i]
    }
  }
  return roman
}
</script>

<style scoped>
/* 引入字体 (如果父组件已经全局引入，这里可以省略，但为了组件独立性建议保留或放在全局CSS中) */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+SC:wght@200;300;400;500;700&family=Noto+Sans+JP:wght@200;300;400&display=swap');

.detail-view {
  font-family: 'Cinzel', 'Noto Serif SC', 'Noto Sans JP', serif;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--theme-bg-gradient, linear-gradient(135deg, #fdfbfb 0%, #fff0f0 100%));
  z-index: 200;
  display: flex;
}

/* 左侧：视觉区域 */
.visual-section {
  flex: 1.2;
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at 30% 50%, transparent 0%, rgba(0,0,0, 0.02) 100%);
  border-right: 1px solid var(--theme-border, rgba(0,0,0,0.1));
}

.character-art-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.character-art {
  height: 95%;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(10px 10px 20px rgba(0,0,0,0.15));
  animation: slideUp 0.8s ease-out forwards;
  animation-delay: 0.1s;
  opacity: 0;
  transform: translateY(50px);
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

.sigil-bg {
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 600px;
  height: 600px;
  border: 2px solid var(--theme-border);
  border-radius: 50%;
  z-index: 0;
  animation: rotate 60s linear infinite;
  opacity: 0.3;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.vertical-deco {
  position: absolute;
  top: 15%;
  left: 60px;
  z-index: 2;
  writing-mode: vertical-rl;
  letter-spacing: 0.5em;
  color: var(--theme-color);
  font-size: 14px;
  opacity: 0.6;
}

.class-badge {
  position: absolute;
  top: 40px;
  right: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}
.class-icon {
  width: 40px;
  height: 40px;
  border: 1px solid var(--theme-color);
  transform: rotate(45deg);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  background: rgba(255,255,255,0.8);
}
.class-symbol {
  transform: rotate(-45deg);
  color: var(--theme-color);
  font-weight: bold;
  font-size: 14px;
}
.class-name {
  font-size: 1rem;
  letter-spacing: 0.1em;
  color: #333;
  border-bottom: 1px solid var(--theme-color);
  padding-bottom: 5px;
}

/* 右侧：信息区域 */
.info-section {
  flex: 0.8;
  padding: 80px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.character-name-group {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  padding: 60px 20px;
  border-right: 1px solid rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.name-vertical {
  writing-mode: vertical-rl;
  font-size: 3rem;
  font-weight: 300;
  color: #2c2c2c;
  letter-spacing: 0.2em;
}

.name-sub {
  writing-mode: vertical-rl;
  margin-top: 20px;
  font-size: 0.8rem;
  color: var(--theme-color);
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.content-panel {
  margin-left: 80px;
  width: 100%;
  animation: fadeIn 0.8s ease-out forwards;
  animation-delay: 0.2s;
  opacity: 0;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.section-title {
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--theme-color), transparent);
  margin-left: 15px;
  opacity: 0.5;
}

.flavor-text {
  font-size: 1rem;
  line-height: 1.8;
  color: #555;
  margin-bottom: 40px;
  font-style: italic;
  font-family: 'Noto Serif SC', serif;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
}
.stat-label {
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 5px;
  display: block;
}
.stat-bar-bg {
  width: 100%;
  height: 3px;
  background: #eee;
  position: relative;
}
.stat-bar-fill {
  height: 100%;
  background: var(--theme-color);
  position: absolute;
  left: 0;
  top: 0;
}

.skills-list {
  list-style: none;
  padding: 0;
}
.skill-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 12px;
  background: rgba(255,255,255,0.5);
  border-left: 3px solid transparent;
  transition: all 0.3s;
}
.skill-item:hover {
  border-left: 3px solid var(--theme-color);
  background: #fff;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
}
.skill-icon {
  width: 30px;
  height: 30px;
  background: #333;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  margin-right: 15px;
  font-family: 'Cinzel', serif;
}
.skill-info h4 {
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}
.skill-info p {
  margin: 0;
  font-size: 0.75rem;
  color: #777;
}

.back-btn {
  position: absolute;
  top: 40px;
  left: 40px;
  text-decoration: none;
  color: #333;
  font-size: 0.8rem;
  font-weight: bold;
  letter-spacing: 0.1em;
  z-index: 20;
  opacity: 0.7;
  transition: opacity 0.3s;
}
.back-btn:hover {
  opacity: 1;
}

.collection-no {
  position: absolute;
  bottom: 20px;
  right: 40px;
  font-size: 4rem;
  color: rgba(0,0,0,0.03);
  font-weight: 700;
  user-select: none;
  font-family: 'Cinzel', serif;
}

/* 响应式调整 (拷贝自原文件) */
@media (max-width: 1024px) {
  .detail-view {
    flex-direction: column;
    overflow-y: auto;
  }
  .visual-section, .info-section {
    flex: none;
    width: 100%;
    height: auto;
  }
  .visual-section {
    height: 50vh;
  }
  .character-art {
    height: 100%;
    transform: translateY(20px);
  }
  .character-name-group {
    position: relative;
    flex-direction: row;
    width: 100%;
    height: auto;
    padding: 20px;
    border-right: none;
    border-bottom: 1px solid #eee;
    justify-content: center;
    gap: 20px;
  }
  .name-vertical, .name-sub {
    writing-mode: horizontal-tb;
    margin: 0;
  }
  .content-panel {
    margin-left: 0;
    padding-top: 20px;
  }
}
</style>
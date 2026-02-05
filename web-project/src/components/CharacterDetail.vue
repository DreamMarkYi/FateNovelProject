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
        <!-- Profile -->
        <div class="section-title">Profile</div>
        <p class="flavor-text" v-html="card.intro"></p>

        <!-- Parameters -->
        <div class="section-title">Parameters</div>
        <div class="stats-grid">
          <div class="stat-item" v-for="(val, key) in card.stats" :key="key">
            <span class="stat-label">{{ key }}</span>
            <div class="stat-bar-bg">
              <div class="stat-bar-fill" :style="{ width: val + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 固有能力 (cardSkills) -->
        <div class="section-title">
          <span class="title-icon">◆</span>
          固有能力
          <span class="title-sub">Innate Abilities</span>
        </div>
        <div class="skills-container" v-if="card.skills && card.skills.length > 0">
          <ul class="skills-list innate-skills">
            <li class="skill-item innate" v-for="(skill, idx) in card.skills" :key="'innate-' + idx">
              <div class="skill-icon innate-icon">{{ romanize(idx + 1) }}</div>
              <div class="skill-info">
                <h4>{{ skill.name }}</h4>
                <p>{{ skill.desc }}</p>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="no-skills">暂无固有能力数据</div>

        <!-- 魔术术式 (baseSkills) - 按类型分类 -->
        <div class="section-title">
          <span class="title-icon magic">✦</span>
          魔術術式
          <span class="title-sub">Magic Arts</span>
        </div>
        <div class="magic-container" v-if="card.baseSkills && card.baseSkills.length > 0">
          <!-- 攻击类技能 -->
          <div v-if="groupedSkills.attack && groupedSkills.attack.length > 0" class="skill-category">
            <div class="category-header attack">
              <span class="category-icon">剣</span>
              <span class="category-title">攻撃術式</span>
              <span class="category-sub">Attack Arts</span>
            </div>
            <div class="skills-container category-skills">
              <ul class="skills-list magic-skills">
                <li class="skill-item magic" v-for="(skill, idx) in groupedSkills.attack" :key="'attack-' + idx">
                  <div class="skill-icon magic-icon">
                    <span class="skill-type-badge attack">{{ getTypeIcon(skill.type) }}</span>
                  </div>
                  <div class="skill-info">
                    <div class="skill-header">
                      <h4>{{ skill.name }}</h4>
                      <div class="skill-meta">
                        <span class="skill-rarity" :class="skill.rarity || 'common'">{{ getRarityText(skill.rarity) }}</span>
                      </div>
                    </div>
                    <p class="skill-desc">{{ skill.description }}</p>
                    <div class="skill-stats" v-if="skill.power || skill.cost">
                      <span class="stat-badge power" v-if="skill.power">
                        <span class="stat-icon">⚔</span>{{ skill.power }}
                      </span>
                      <span class="stat-badge cost" v-if="skill.cost">
                        <span class="stat-icon">◇</span>{{ skill.cost }}
                      </span>
                      <span class="stat-badge accuracy" v-if="skill.accuracy">
                        <span class="stat-icon">◎</span>{{ skill.accuracy }}%
                      </span>
                    </div>
                    <p class="flavor-text-skill" v-if="skill.flavorText">
                      "{{ skill.flavorText }}"
                      <span class="flavor-translation" v-if="skill.flavorTextTranslation">— {{ skill.flavorTextTranslation }}</span>
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- 防御类技能 -->
          <div v-if="groupedSkills.defense && groupedSkills.defense.length > 0" class="skill-category">
            <div class="category-header defense">
              <span class="category-icon">盾</span>
              <span class="category-title">防御術式</span>
              <span class="category-sub">Defense Arts</span>
            </div>
            <div class="skills-container category-skills">
              <ul class="skills-list magic-skills">
                <li class="skill-item magic" v-for="(skill, idx) in groupedSkills.defense" :key="'defense-' + idx">
                  <div class="skill-icon magic-icon">
                    <span class="skill-type-badge defense">{{ getTypeIcon(skill.type) }}</span>
                  </div>
                  <div class="skill-info">
                    <div class="skill-header">
                      <h4>{{ skill.name }}</h4>
                      <div class="skill-meta">
                        <span class="skill-rarity" :class="skill.rarity || 'common'">{{ getRarityText(skill.rarity) }}</span>
                      </div>
                    </div>
                    <p class="skill-desc">{{ skill.description }}</p>
                    <div class="skill-stats" v-if="skill.power || skill.cost">
                      <span class="stat-badge power" v-if="skill.power">
                        <span class="stat-icon">⚔</span>{{ skill.power }}
                      </span>
                      <span class="stat-badge cost" v-if="skill.cost">
                        <span class="stat-icon">◇</span>{{ skill.cost }}
                      </span>
                      <span class="stat-badge accuracy" v-if="skill.accuracy">
                        <span class="stat-icon">◎</span>{{ skill.accuracy }}%
                      </span>
                    </div>
                    <p class="flavor-text-skill" v-if="skill.flavorText">
                      "{{ skill.flavorText }}"
                      <span class="flavor-translation" v-if="skill.flavorTextTranslation">— {{ skill.flavorTextTranslation }}</span>
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- 封印类技能 -->
          <div v-if="groupedSkills.seal && groupedSkills.seal.length > 0" class="skill-category">
            <div class="category-header seal">
              <span class="category-icon">封</span>
              <span class="category-title">封印術式</span>
              <span class="category-sub">Seal Arts</span>
            </div>
            <div class="skills-container category-skills">
              <ul class="skills-list magic-skills">
                <li class="skill-item magic" v-for="(skill, idx) in groupedSkills.seal" :key="'seal-' + idx">
                  <div class="skill-icon magic-icon">
                    <span class="skill-type-badge seal">{{ getTypeIcon(skill.type) }}</span>
                  </div>
                  <div class="skill-info">
                    <div class="skill-header">
                      <h4>{{ skill.name }}</h4>
                      <div class="skill-meta">
                        <span class="skill-rarity" :class="skill.rarity || 'common'">{{ getRarityText(skill.rarity) }}</span>
                      </div>
                    </div>
                    <p class="skill-desc">{{ skill.description }}</p>
                    <div class="skill-stats" v-if="skill.power || skill.cost">
                      <span class="stat-badge power" v-if="skill.power">
                        <span class="stat-icon">⚔</span>{{ skill.power }}
                      </span>
                      <span class="stat-badge cost" v-if="skill.cost">
                        <span class="stat-icon">◇</span>{{ skill.cost }}
                      </span>
                      <span class="stat-badge accuracy" v-if="skill.accuracy">
                        <span class="stat-icon">◎</span>{{ skill.accuracy }}%
                      </span>
                    </div>
                    <p class="flavor-text-skill" v-if="skill.flavorText">
                      "{{ skill.flavorText }}"
                      <span class="flavor-translation" v-if="skill.flavorTextTranslation">— {{ skill.flavorTextTranslation }}</span>
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- 阵地类技能 -->
          <div v-if="groupedSkills.field && groupedSkills.field.length > 0" class="skill-category">
            <div class="category-header field">
              <span class="category-icon">陣</span>
              <span class="category-title">陣地術式</span>
              <span class="category-sub">Field Arts</span>
            </div>
            <div class="skills-container category-skills">
              <ul class="skills-list magic-skills">
                <li class="skill-item magic" v-for="(skill, idx) in groupedSkills.field" :key="'field-' + idx">
                  <div class="skill-icon magic-icon">
                    <span class="skill-type-badge field">{{ getTypeIcon(skill.type) }}</span>
                  </div>
                  <div class="skill-info">
                    <div class="skill-header">
                      <h4>{{ skill.name }}</h4>
                      <div class="skill-meta">
                        <span class="skill-rarity" :class="skill.rarity || 'common'">{{ getRarityText(skill.rarity) }}</span>
                      </div>
                    </div>
                    <p class="skill-desc">{{ skill.description }}</p>
                    <div class="skill-stats" v-if="skill.power || skill.cost">
                      <span class="stat-badge power" v-if="skill.power">
                        <span class="stat-icon">⚔</span>{{ skill.power }}
                      </span>
                      <span class="stat-badge cost" v-if="skill.cost">
                        <span class="stat-icon">◇</span>{{ skill.cost }}
                      </span>
                      <span class="stat-badge accuracy" v-if="skill.accuracy">
                        <span class="stat-icon">◎</span>{{ skill.accuracy }}%
                      </span>
                    </div>
                    <p class="flavor-text-skill" v-if="skill.flavorText">
                      "{{ skill.flavorText }}"
                      <span class="flavor-translation" v-if="skill.flavorTextTranslation">— {{ skill.flavorTextTranslation }}</span>
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- 回复类技能 -->
          <div v-if="groupedSkills.recovery && groupedSkills.recovery.length > 0" class="skill-category">
            <div class="category-header recovery">
              <span class="category-icon">癒</span>
              <span class="category-title">回復術式</span>
              <span class="category-sub">Recovery Arts</span>
            </div>
            <div class="skills-container category-skills">
              <ul class="skills-list magic-skills">
                <li class="skill-item magic" v-for="(skill, idx) in groupedSkills.recovery" :key="'recovery-' + idx">
                  <div class="skill-icon magic-icon">
                    <span class="skill-type-badge recovery">{{ getTypeIcon(skill.type) }}</span>
                  </div>
                  <div class="skill-info">
                    <div class="skill-header">
                      <h4>{{ skill.name }}</h4>
                      <div class="skill-meta">
                        <span class="skill-rarity" :class="skill.rarity || 'common'">{{ getRarityText(skill.rarity) }}</span>
                      </div>
                    </div>
                    <p class="skill-desc">{{ skill.description }}</p>
                    <div class="skill-stats" v-if="skill.power || skill.cost">
                      <span class="stat-badge power" v-if="skill.power">
                        <span class="stat-icon">⚔</span>{{ skill.power }}
                      </span>
                      <span class="stat-badge cost" v-if="skill.cost">
                        <span class="stat-icon">◇</span>{{ skill.cost }}
                      </span>
                      <span class="stat-badge accuracy" v-if="skill.accuracy">
                        <span class="stat-icon">◎</span>{{ skill.accuracy }}%
                      </span>
                    </div>
                    <p class="flavor-text-skill" v-if="skill.flavorText">
                      "{{ skill.flavorText }}"
                      <span class="flavor-translation" v-if="skill.flavorTextTranslation">— {{ skill.flavorTextTranslation }}</span>
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-else class="no-skills">暂无魔术术式数据</div>
      </div>

      <div class="collection-no">{{ card.number.split(' ').pop() }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const detailStyleVars = computed(() => {
  if (!props.card) return {}
  const color = props.card.overlayColor || '#333'
  return {
    '--theme-color': color,
    '--theme-bg-gradient': `linear-gradient(135deg, #fdfbfb 0%, ${color}1A 100%)`,
    '--theme-border': `${color}4D`
  }
})

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

const getTypeIcon = (type) => {
  const icons = {
    attack: '剣',
    defense: '盾',
    seal: '封',
    field: '陣',
    recovery: '癒'
  }
  return icons[type] || '術'
}

const getRarityText = (rarity) => {
  const texts = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary'
  }
  return texts[rarity] || 'Common'
}

// 按技能类型分组
const groupedSkills = computed(() => {
  if (!props.card?.baseSkills || props.card.baseSkills.length === 0) {
    return {}
  }
  
  const groups = {
    attack: [],
    defense: [],
    seal: [],
    field: [],
    recovery: []
  }
  
  props.card.baseSkills.forEach(skill => {
    const type = skill.type || 'attack'
    if (groups[type]) {
      groups[type].push(skill)
    } else {
      groups.attack.push(skill) // 未知类型归入攻击
    }
  })
  
  return groups
})
</script>

<style scoped>
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
  position: relative;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  overflow: hidden;
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
  width: calc(100% - 80px);
  height: 100%;
  overflow-y: auto;
  padding-right: 10px;
  animation: fadeIn 0.8s ease-out forwards;
  animation-delay: 0.2s;
  opacity: 0;
}

.content-panel::-webkit-scrollbar {
  width: 4px;
}

.content-panel::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.02);
}

.content-panel::-webkit-scrollbar-thumb {
  background: var(--theme-color);
  border-radius: 2px;
  opacity: 0.5;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.section-title {
  font-size: 0.85rem;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 15px;
  margin-top: 25px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title:first-child {
  margin-top: 0;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--theme-color), transparent);
  margin-left: 10px;
  opacity: 0.5;
}

.title-icon {
  color: var(--theme-color);
  font-size: 0.7rem;
}

.title-icon.magic {
  color: #8b5cf6;
}

.title-sub {
  font-size: 0.65rem;
  color: #aaa;
  font-weight: normal;
  margin-left: 5px;
}

.flavor-text {
  font-size: 0.95rem;
  line-height: 1.8;
  color: #555;
  margin-bottom: 20px;
  font-style: italic;
  font-family: 'Noto Serif SC', serif;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}
.stat-label {
  font-size: 0.7rem;
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
  transition: width 0.5s ease;
}

/* 技能容器 */
.skills-container {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 15px;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 8px;
  background: rgba(255,255,255,0.3);
}

.skills-container::-webkit-scrollbar {
  width: 3px;
}

.skills-container::-webkit-scrollbar-track {
  background: transparent;
}

.skills-container::-webkit-scrollbar-thumb {
  background: var(--theme-color);
  border-radius: 2px;
  opacity: 0.3;
}

.magic-container {
  max-height: 580px;
  overflow-y: auto;
  padding-right: 5px;
}

.magic-container::-webkit-scrollbar {
  width: 3px;
}

.magic-container::-webkit-scrollbar-track {
  background: transparent;
}

.magic-container::-webkit-scrollbar-thumb {
  background: #8b5cf6;
  border-radius: 2px;
  opacity: 0.3;
}

/* 技能分类样式 */
.skill-category {
  margin-bottom: 20px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.category-header.attack {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
  color: #dc2626;
  border-left: 3px solid #ef4444;
}

.category-header.defense {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
  color: #2563eb;
  border-left: 3px solid #3b82f6;
}

.category-header.seal {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05));
  color: #7c3aed;
  border-left: 3px solid #8b5cf6;
}

.category-header.field {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05));
  color: #059669;
  border-left: 3px solid #10b981;
}

.category-header.recovery {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05));
  color: #d97706;
  border-left: 3px solid #f59e0b;
}

.category-icon {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.category-title {
  flex: 1;
  text-transform: uppercase;
}

.category-sub {
  font-size: 0.65rem;
  opacity: 0.7;
  font-weight: normal;
}

.category-skills {
  max-height: 200px;
  margin-bottom: 0;
}

.skills-list {
  list-style: none;
  padding: 8px;
  margin: 0;
}

.skill-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  padding: 10px;
  background: rgba(255,255,255,0.6);
  border-left: 3px solid transparent;
  border-radius: 4px;
  transition: all 0.3s;
}

.skill-item:last-child {
  margin-bottom: 0;
}

.skill-item:hover {
  border-left: 3px solid var(--theme-color);
  background: #fff;
  box-shadow: 0 3px 10px rgba(0,0,0,0.05);
}

.skill-item.magic:hover {
  border-left-color: #8b5cf6;
}

/* 固有能力样式 */
.skill-icon.innate-icon {
  width: 26px;
  height: 26px;
  min-width: 26px;
  background: #333;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 9px;
  margin-right: 12px;
  font-family: 'Cinzel', serif;
  border-radius: 2px;
}

/* 魔术术式样式 */
.skill-icon.magic-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
}

.skill-type-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  background: #666;
}

.skill-type-badge.attack { background: linear-gradient(135deg, #ef4444, #dc2626); }
.skill-type-badge.defense { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.skill-type-badge.seal { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.skill-type-badge.field { background: linear-gradient(135deg, #10b981, #059669); }
.skill-type-badge.recovery { background: linear-gradient(135deg, #f59e0b, #d97706); }

.skill-info {
  flex: 1;
  min-width: 0;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.skill-info h4 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
}

.skill-info p {
  margin: 0;
  font-size: 0.72rem;
  color: #777;
  line-height: 1.5;
}

.skill-desc {
  margin-bottom: 6px !important;
}

.skill-meta {
  display: flex;
  gap: 6px;
}

.skill-rarity {
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.skill-rarity.common { background: #e5e7eb; color: #6b7280; }
.skill-rarity.rare { background: #dbeafe; color: #2563eb; }
.skill-rarity.epic { background: #ede9fe; color: #7c3aed; }
.skill-rarity.legendary { background: #fef3c7; color: #d97706; }

.skill-stats {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.stat-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.stat-badge .stat-icon {
  font-size: 0.6rem;
}

.stat-badge.power { background: #fee2e2; color: #dc2626; }
.stat-badge.cost { background: #e0e7ff; color: #4f46e5; }
.stat-badge.accuracy { background: #d1fae5; color: #059669; }

.flavor-text-skill {
  font-size: 0.65rem;
  font-style: italic;
  color: #999;
  margin-top: 6px !important;
  padding-left: 8px;
  border-left: 2px solid rgba(139, 92, 246, 0.3);
}

.flavor-translation {
  display: block;
  font-style: normal;
  color: #aaa;
  margin-top: 2px;
}

.no-skills {
  font-size: 0.8rem;
  color: #aaa;
  font-style: italic;
  padding: 15px;
  text-align: center;
  background: rgba(0,0,0,0.02);
  border-radius: 8px;
  margin-bottom: 15px;
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

/* 响应式调整 */
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
    width: 100%;
    height: auto;
    overflow-y: visible;
  }
  .skills-container {
    max-height: none;
  }
  .magic-container {
    max-height: none;
  }
}
</style>

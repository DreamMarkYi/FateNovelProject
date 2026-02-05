<template>
  <div class="battle-simulator">
    <!-- 导航栏 -->
    <nav class="nav-bar">
      <div class="nav-left">
        <h1 class="nav-title">MOONLIGHT GRAIL</h1>
        <span class="nav-turn">Turn <span>{{ currentTurn }}</span></span>
      </div>
      <div class="nav-right">
        <button @click="saveAllMemories" class="nav-btn">SAVE</button>
        <button @click="triggerLoadFile" class="nav-btn">LOAD</button>
        <input type="file" ref="loadInput" accept=".json" @change="loadMemories" style="display: none">
      </div>
    </nav>

    <!-- 主要内容区 -->
    <main class="main-content">
      <!-- 战斗区域 -->
      <section class="battle-section">
        <!-- 敌方卡片 -->
        <div class="character-card enemy-card">
          <div class="card-accent enemy-accent"></div>
          
          <div class="portrait-frame">
            <img :src="enemyPortrait" class="portrait-img" alt="Enemy">
            <div class="portrait-overlay"></div>
            <div class="portrait-badge enemy-badge">ENEMY</div>
          </div>

          <div class="character-info">
            <div class="character-name">{{ enemyCharacterName }}</div>
            <div class="character-actions">
              <button @click="triggerEnemyLoad" class="load-btn">
                <span>Load Custom Data</span>
              </button>
              <input type="file" ref="enemyCharacterInput" accept=".json" @change="handleEnemyCharacterLoad" style="display: none">
            </div>
            <div class="character-desc">{{ enemyCharacterDesc }}</div>
          </div>

          <!-- HP条 -->
          <div class="stat-bar">
            <span class="stat-label enemy-label">HP</span>
            <div class="stat-bar-container">
              <div class="stat-bar-fill hp-bar" :style="{ width: enemyHpPercent + '%' }" :class="getHpBarClass(enemyHpPercent)"></div>
              <span class="stat-value">{{ battleState.enemyHp }}/{{ battleState.enemyMaxHp }}</span>
            </div>
          </div>
          <!-- MP条 -->
          <div class="stat-bar">
            <span class="stat-label mp-label">MP</span>
            <div class="stat-bar-container">
              <div class="stat-bar-fill mp-bar" :style="{ width: enemyMpPercent + '%' }"></div>
              <span class="stat-value">{{ battleState.enemyMp }}/{{ battleState.enemyMaxMp }}</span>
            </div>
          </div>

          <div v-if="lastEnemySkill" class="ai-move-display">
            <div class="ai-move-label">Last Action</div>
            <h3 class="ai-move-name">{{ lastEnemySkill.name }}</h3>
            <div class="ai-move-type" :class="'type-' + lastEnemySkill.type">
              {{ getSkillTypeLabel(lastEnemySkill.type) }}
            </div>
          </div>
        </div>

        <!-- 战斗记录区 -->
        <div class="chronicle-panel">
          <div class="chronicle-watermark">CHRONICLE</div>
          <div class="novel-output" ref="novelOutput">
            <div v-if="battleHistory.length === 0" class="empty-state">
              <p>Waiting for battle initialization...</p>
              <span>Select a skill below to begin.</span>
            </div>
            <div v-else>
              <div v-for="(turn, index) in battleHistory" :key="index" class="battle-turn">
                <div class="turn-divider">
                  <span>Turn {{ index + 1 }} // {{ turn.userSkillName }} vs {{ turn.enemySkillName }}</span>
                </div>
                <div class="turn-content" v-html="formatNovelText(turn.narrative)"></div>
              </div>
            </div>
          </div>
          <div class="system-log">
            <div class="log-title">System Log</div>
            <div class="log-content">
              <div v-for="(log, index) in systemLogs" :key="index" class="log-item" :class="log.type">
                <div class="log-header">
                  <span class="log-turn">Turn {{ log.turn }}</span>
                  <span class="log-order">{{ log.actionOrder?.join(' → ') }}</span>
                </div>
                <div class="log-user">You: "{{ log.userSkillName }}" <span class="skill-type-tag" :class="'type-' + log.userSkillType">{{ log.userSkillType }}</span></div>
                <div class="log-ai">Enemy: "{{ log.enemySkillName }}" <span class="skill-type-tag" :class="'type-' + log.enemySkillType">{{ log.enemySkillType }}</span></div>
                <div class="log-effects">
                  <span v-for="(effect, i) in log.userEffects" :key="'u'+i" class="effect-tag" :class="'effect-' + effect.type">
                    {{ formatEffect(effect, 'user') }}
                  </span>
                  <span v-for="(effect, i) in log.enemyEffects" :key="'e'+i" class="effect-tag" :class="'effect-' + effect.type">
                    {{ formatEffect(effect, 'enemy') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 玩家卡片 -->
        <div class="character-card player-card">
          <div class="card-accent player-accent"></div>
          
          <div class="portrait-frame">
            <img :src="playerPortrait" class="portrait-img" alt="Player">
            <div class="portrait-overlay"></div>
            <div class="portrait-badge player-badge">PLAYER</div>
          </div>

          <div class="character-info player-info">
            <div class="character-name">{{ userCharacterName }}</div>
            <div class="character-actions">
              <button @click="triggerUserLoad" class="load-btn">
                <span>Load Custom Data</span>
              </button>
              <input type="file" ref="userCharacterInput" accept=".json" @change="handleUserCharacterLoad" style="display: none">
            </div>
          </div>

          <!-- HP条 -->
          <div class="stat-bar player-stat-bar">
            <div class="stat-bar-container">
              <div class="stat-bar-fill hp-bar" :style="{ width: userHpPercent + '%' }" :class="getHpBarClass(userHpPercent)"></div>
              <span class="stat-value">{{ battleState.userHp }}/{{ battleState.userMaxHp }}</span>
            </div>
            <span class="stat-label player-label">HP</span>
          </div>
          <!-- MP条 -->
          <div class="stat-bar player-stat-bar">
            <div class="stat-bar-container">
              <div class="stat-bar-fill mp-bar" :style="{ width: userMpPercent + '%' }"></div>
              <span class="stat-value">{{ battleState.userMp }}/{{ battleState.userMaxMp }}</span>
            </div>
            <span class="stat-label mp-label">MP</span>
          </div>

          <button @click="resetBattle" class="reset-btn">
            Reset Battle
          </button>
        </div>
      </section>

      <!-- 招式选择区 -->
      <section class="move-section">
        <div v-if="selectedSkill" class="move-detail">
          <span class="detail-name" :class="{ 'disabled': !canUseSkill(selectedSkill) }">
            {{ selectedSkill.name }}
            <span class="rarity-badge" :class="'rarity-' + selectedSkill.rarity">{{ selectedSkill.rarity }}</span>
          </span>
          <span class="detail-stats">
            ⚔️{{ selectedSkill.power }} | 💧{{ selectedSkill.cost }} | 🎯{{ selectedSkill.accuracy }}%
          </span>
          <span class="detail-effect">
            {{ selectedSkill.description }}
          </span>
          <span v-if="selectedSkill.flavorText" class="detail-flavor">
            "{{ selectedSkill.flavorText }}"
          </span>
        </div>

        <div class="move-panel">
          <div class="move-list-container">
            <div 
              v-for="(skill, index) in userSkills" 
              :key="skill.id"
              class="move-card"
              :class="{
                'selected': selectedSkill && selectedSkill.id === skill.id,
                'disabled': !canUseSkill(skill),
                'rarity-rare': skill.rarity === 'rare',
                'rarity-epic': skill.rarity === 'epic',
                'rarity-legendary': skill.rarity === 'legendary'
              }"
              @click="selectSkill(skill)"
            >
              <div class="move-card-header">
                <span class="move-icon" :class="'icon-' + skill.type">{{ getSkillIcon(skill.type) }}</span>
                <span class="move-name">{{ skill.name }}</span>
              </div>
              <div class="move-stats">
                <span class="stat power">⚔️{{ skill.power }}</span>
                <span class="stat cost" :class="{ 'insufficient': battleState.userMp < skill.cost }">💧{{ skill.cost }}</span>
              </div>
              <span class="move-type" :class="'type-' + skill.type">
                {{ getSkillTypeLabel(skill.type) }}
              </span>
              <div v-if="isSkillSealed(skill)" class="sealed-overlay">
                🔒 Sealed
              </div>
            </div>
          </div>

          <div class="submit-area">
            <button 
              @click="executeBattleTurn" 
              :disabled="!selectedSkill || isLoading || battleEnded || !canUseSkill(selectedSkill)"
              class="submit-btn"
              :class="{ 'loading': isLoading }"
            >
              <div class="btn-glow"></div>
              <span class="btn-text">
                {{ battleEnded ? `Battle End - ${battleWinner}` : 'CAST<br>SPELL' }}
              </span>
              <div v-if="isLoading" class="loading-spinner"></div>
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- 新技能解锁通知 -->
    <Transition name="slide-up">
      <div v-if="showNewSkillNotification" class="new-skill-notification">
        <div class="notification-icon">🔮</div>
        <div class="notification-content">
          <div class="notification-title">技能衍生成功！</div>
          <div class="notification-skills">
            <div v-for="skill in newSkillsUnlocked" :key="skill.id" class="unlocked-skill">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-rarity" :class="'rarity-' + skill.rarity">{{ skill.rarity }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { marked } from 'marked'

// ============ 状态管理 ============
const currentTurn = ref(0)
const battleHistory = ref([])
const systemLogs = ref([])
const userSkills = ref([])
const enemySkills = ref([])
const selectedSkill = ref(null)
const isLoading = ref(false)
const battleEnded = ref(false)

// 新技能解锁通知
const newSkillsUnlocked = ref([])
const showNewSkillNotification = ref(false)
const battleWinner = ref('')

// 战斗状态
const battleState = ref({
  userHp: 100,
  userMp: 100,
  userMaxHp: 100,
  userMaxMp: 100,
  enemyHp: 100,
  enemyMp: 100,
  enemyMaxHp: 100,
  enemyMaxMp: 100,
  turn: 0,
  field: { activeEffects: [] },
  userSealedSkills: [],
  enemySealedSkills: [],
  userSkillCooldowns: {},
  enemySkillCooldowns: {},
  userLastSkill: null,
  enemyLastSkill: null
})

// 角色信息
const enemyCharacterName = ref('Loading...')
const enemyCharacterDesc = ref('')
const enemyPortrait = ref('./web-project/public/qiaoyao_maggot.jpg')

const userCharacterName = ref('Loading...')
const playerPortrait = ref('./web-project/public/栩_meme.jpg')

// 敌人最后使用的技能
const lastEnemySkill = ref(null)

// 文件输入引用
const loadInput = ref(null)
const enemyCharacterInput = ref(null)
const userCharacterInput = ref(null)
const novelOutput = ref(null)

// 当前敌人ID和用户ID
const currentEnemyId = ref('HimuroRinne')
const currentUserId = ref('YanShuangYing_Gag')

// ============ 计算属性 ============
const userHpPercent = computed(() => {
  return Math.max(0, (battleState.value.userHp / battleState.value.userMaxHp) * 100)
})

const userMpPercent = computed(() => {
  return Math.max(0, (battleState.value.userMp / battleState.value.userMaxMp) * 100)
})

const enemyHpPercent = computed(() => {
  return Math.max(0, (battleState.value.enemyHp / battleState.value.enemyMaxHp) * 100)
})

const enemyMpPercent = computed(() => {
  return Math.max(0, (battleState.value.enemyMp / battleState.value.enemyMaxMp) * 100)
})

// ============ 方法 ============
const getHpBarClass = (percent) => {
  if (percent <= 20) return 'critical'
  if (percent <= 40) return 'danger'
  return ''
}

const getSkillIcon = (type) => {
  const icons = {
    attack: '⚔️',
    defense: '🛡️',
    seal: '🔗',
    field: '🌀',
    recovery: '💚'
  }
  return icons[type] || '✨'
}

const getSkillTypeLabel = (type) => {
  const labels = {
    attack: '攻击',
    defense: '防御',
    seal: '封印',
    field: '阵地',
    recovery: '回复'
  }
  return labels[type] || type
}

const canUseSkill = (skill) => {
  if (!skill) return false
  // 检查MP
  if (battleState.value.userMp < skill.cost) return false
  // 检查封印
  if (isSkillSealed(skill)) return false
  // 检查冷却
  if (isSkillOnCooldown(skill)) return false
  // 检查条件
  return checkSkillConditions(skill)
}

const isSkillSealed = (skill) => {
  if (!skill) return false
  const sealed = battleState.value.userSealedSkills?.find(s => s.id === skill.id)
  return sealed && sealed.until > battleState.value.turn
}

const isSkillOnCooldown = (skill) => {
  if (!skill || !skill.conditions) return false
  const cooldownCondition = skill.conditions.find(c => c.type === 'cooldown')
  if (!cooldownCondition) return false
  const lastUsed = battleState.value.userSkillCooldowns?.[skill.id] || 0
  return battleState.value.turn - lastUsed < cooldownCondition.value
}

const checkSkillConditions = (skill) => {
  if (!skill.conditions || skill.conditions.length === 0) return true
  
  for (const condition of skill.conditions) {
    switch (condition.type) {
      case 'hp_below':
        const target = condition.target === 'enemy' ? battleState.value.enemyHp / battleState.value.enemyMaxHp : battleState.value.userHp / battleState.value.userMaxHp
        if (target * 100 > condition.value) return false
        break
      case 'hp_above':
        const target2 = condition.target === 'enemy' ? battleState.value.enemyHp / battleState.value.enemyMaxHp : battleState.value.userHp / battleState.value.userMaxHp
        if (target2 * 100 < condition.value) return false
        break
      case 'turn_count':
        if (battleState.value.turn < condition.value) return false
        break
      case 'mp_above':
        if (battleState.value.userMp < condition.value) return false
        break
    }
  }
  return true
}

const formatNovelText = (text) => {
  if (!text) return ''
  if (Array.isArray(text)) {
    text = text.join('\n\n')
  }
  text = String(text || '')
  return marked.parse(text)
}

const formatEffect = (effect, actor) => {
  switch (effect.type) {
    case 'damage':
      if (effect.miss) return 'MISS'
      return `${actor === 'user' ? '→' : '←'} ${effect.value} DMG${effect.isCritical ? ' CRIT!' : ''}`
    case 'heal':
      return `+${effect.value} ${effect.healType?.toUpperCase() || 'HP'}`
    case 'defense':
      return `+${effect.value} DEF`
    case 'seal':
      return effect.success ? `SEALED ${effect.sealedSkills?.length || 1}` : 'SEAL FAILED'
    case 'field':
      return `FIELD: ${effect.fieldType}`
    default:
      return effect.type
  }
}

const selectSkill = (skill) => {
  if (!canUseSkill(skill)) {
    return
  }
  selectedSkill.value = skill
}

const executeBattleTurn = async () => {
  if (!selectedSkill.value || !canUseSkill(selectedSkill.value)) {
    return
  }

  isLoading.value = true

  try {
    const response = await fetch('http://localhost:3000/api/battle-simulator/execute-turn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enemyId: currentEnemyId.value,
        userId: currentUserId.value,
        selectedSkillId: selectedSkill.value.id,
        battleState: {
          ...battleState.value,
          // 将战斗历史传递给后端，用于记忆系统
          history: battleHistory.value.map(turn => ({
            turn: turn.turn,
            userSkillName: turn.userSkillName,
            userSkillType: turn.userSkillType,
            enemySkillName: turn.enemySkillName,
            enemySkillType: turn.enemySkillType,
            narrative: turn.narrative,
            summary: turn.summary,
            userEffects: turn.userEffects,
            enemyEffects: turn.enemyEffects,
            actionOrder: turn.actionOrder,
            fieldChanges: turn.fieldChanges
          }))
        },
        userSkills: userSkills.value,
        enemySkills: enemySkills.value
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '战斗执行失败')
    }

    const result = await response.json()

    if (result.success) {
      // 更新战斗状态
      Object.assign(battleState.value, result.data.battleState)
      currentTurn.value = result.data.battleState.turn

      // 更新战斗历史
      battleHistory.value.push(result.data.turnData)

      // 更新系统日志
      systemLogs.value.unshift({
        turn: currentTurn.value,
        userSkillName: result.data.turnData.userSkillName,
        userSkillType: result.data.turnData.userSkillType,
        enemySkillName: result.data.turnData.enemySkillName,
        enemySkillType: result.data.turnData.enemySkillType,
        userEffects: result.data.turnData.userEffects,
        enemyEffects: result.data.turnData.enemyEffects,
        actionOrder: result.data.turnData.actionOrder,
        type: result.data.turnData.userEffects.some(e => e.isCritical) ? 'critical-hit' : 
              result.data.turnData.enemyEffects.some(e => e.type === 'damage' && e.value > 30) ? 'heavy-damage' : 'normal'
      })

      // 更新敌人最后使用的技能
      lastEnemySkill.value = {
        name: result.data.turnData.enemySkillName,
        type: result.data.turnData.enemySkillType
      }

      // 添加新衍生的技能到用户技能列表
      if (result.data.newDerivedSkills && result.data.newDerivedSkills.length > 0) {
        const newSkills = result.data.newDerivedSkills.filter(newSkill => 
          !userSkills.value.some(existing => existing.id === newSkill.id || existing.name === newSkill.name)
        )
        if (newSkills.length > 0) {
          // 使用展开运算符确保触发响应式更新
          userSkills.value = [...userSkills.value, ...newSkills]
          console.log(`🔮 解锁新技能: ${newSkills.map(s => s.name).join(', ')}`)
          // 显示新技能解锁提示
          newSkillsUnlocked.value = newSkills
          showNewSkillNotification.value = true
          setTimeout(() => {
            showNewSkillNotification.value = false
          }, 3000)
        }
      }

      // 检查战斗是否结束
      if (result.data.isBattleEnd) {
        battleEnded.value = true
        battleWinner.value = result.data.winnerName
        setTimeout(() => {
          alert(`⚔️ 战斗结束！\n\n胜者：${result.data.winnerName}\n\n${result.data.winner === 'user' ? '恭喜你赢得了这场圣杯战争！' : '很遗憾，你在这场战斗中落败了...'}`)
        }, 500)
      }

      // 滚动到底部
      await nextTick()
      if (novelOutput.value) {
        novelOutput.value.scrollTop = novelOutput.value.scrollHeight
      }

      // 清除选中的技能
      selectedSkill.value = null
    }
  } catch (error) {
    console.error('战斗执行错误:', error)
    alert('系统错误: ' + error.message)
  } finally {
    isLoading.value = false
  }
}

const resetBattle = async () => {
  if (!confirm(`确定要删除与 [${enemyCharacterName.value}] 的所有战斗记录吗？`)) {
    return
  }

  try {
    await fetch('http://localhost:3000/api/battle-simulator/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enemyId: currentEnemyId.value
      })
    })

    // 重置本地状态
    battleHistory.value = []
    systemLogs.value = []
    currentTurn.value = 0
    battleEnded.value = false
    battleWinner.value = ''
    lastEnemySkill.value = null
    selectedSkill.value = null
    
    // 重新加载初始数据
    await loadInitialData()
  } catch (error) {
    console.error('重置失败:', error)
    alert('重置失败: ' + error.message)
  }
}

const saveAllMemories = () => {
  const saveData = {
    battleHistory: battleHistory.value,
    battleState: battleState.value,
    userSkills: userSkills.value,
    enemySkills: enemySkills.value,
    enemyId: currentEnemyId.value,
    savedAt: new Date().toISOString()
  }
  const dataStr = JSON.stringify(saveData, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Battle_Save_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
}

const triggerLoadFile = () => {
  loadInput.value.click()
}

const loadMemories = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const saveData = JSON.parse(e.target.result)
      battleHistory.value = saveData.battleHistory || []
      Object.assign(battleState.value, saveData.battleState)
      userSkills.value = saveData.userSkills || []
      enemySkills.value = saveData.enemySkills || []
      currentTurn.value = battleState.value.turn
      
      // 重建系统日志
      systemLogs.value = battleHistory.value.map((turn, index) => ({
        turn: index + 1,
        userSkillName: turn.userSkillName,
        userSkillType: turn.userSkillType,
        enemySkillName: turn.enemySkillName,
        enemySkillType: turn.enemySkillType,
        userEffects: turn.userEffects,
        enemyEffects: turn.enemyEffects,
        actionOrder: turn.actionOrder
      })).reverse()
      
      alert('存档读取成功')
    } catch (error) {
      alert('存档格式错误: ' + error.message)
    }
    event.target.value = ''
  }
  reader.readAsText(file)
}

const triggerEnemyLoad = () => {
  enemyCharacterInput.value.click()
}

const handleEnemyCharacterLoad = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result)
      
      if (!data.name || !data.desc) {
        throw new Error('格式不符合规范')
      }

      const response = await fetch('http://localhost:3000/api/battle-simulator/load-enemy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        currentEnemyId.value = result.data.enemyId
        
        // 重新初始化战斗
        await loadInitialData()
        alert('敌方角色配置加载成功！')
      }
    } catch (error) {
      alert('加载失败：' + error.message)
    }
    event.target.value = ''
  }
  reader.readAsText(file)
}

const triggerUserLoad = () => {
  userCharacterInput.value.click()
}

const handleUserCharacterLoad = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result)
      
      if (!data.name || !data.desc) {
        throw new Error('格式不符合规范')
      }

      const response = await fetch('http://localhost:3000/api/battle-simulator/load-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        // 重新初始化战斗
        await loadInitialData()
        alert('角色配置加载成功！')
      }
    } catch (error) {
      alert('加载失败：' + error.message)
    }
    event.target.value = ''
  }
  reader.readAsText(file)
}

const loadInitialData = async () => {
  try {
    isLoading.value = true
    const response = await fetch(`http://localhost:3000/api/battle-simulator/init?enemyId=${currentEnemyId.value}&userId=${currentUserId.value}`)
    if (response.ok) {
      const result = await response.json()
      
      // 更新角色信息
      enemyCharacterName.value = result.data.enemyProfile.name
      enemyCharacterDesc.value = result.data.enemyProfile.desc
      if (result.data.enemyProfile.imageUrl) {
        enemyPortrait.value = result.data.enemyProfile.imageUrl
      }
      
      userCharacterName.value = result.data.userProfile.name
      if (result.data.userProfile.imageUrl) {
        playerPortrait.value = result.data.userProfile.imageUrl
      }
      
      // 更新技能列表
      userSkills.value = result.data.userSkills
      enemySkills.value = result.data.enemySkills
      
      // 更新战斗状态
      battleState.value = {
        ...battleState.value,
        userHp: result.data.battleState.userHp,
        userMp: result.data.battleState.userMp,
        userMaxHp: result.data.battleState.userMaxHp,
        userMaxMp: result.data.battleState.userMaxMp,
        enemyHp: result.data.battleState.enemyHp,
        enemyMp: result.data.battleState.enemyMp,
        enemyMaxHp: result.data.battleState.enemyMaxHp,
        enemyMaxMp: result.data.battleState.enemyMaxMp,
        turn: 0,
        field: { activeEffects: [] },
        userSealedSkills: [],
        enemySealedSkills: [],
        userSkillCooldowns: {},
        enemySkillCooldowns: {}
      }
      
      console.log('战斗初始化完成:', {
        userSkills: userSkills.value.length,
        enemySkills: enemySkills.value.length
      })
    }
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    isLoading.value = false
  }
}

// ============ 生命周期 ============
onMounted(() => {
  loadInitialData()
})
</script>

<style scoped>
.battle-simulator {
  font-family: 'Noto Serif SC', serif;
  background-color: #020617;
  background-image:
    radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 20%);
  color: #e2e8f0;
  overflow-x: hidden;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.nav-bar {
  height: 48px;
  border-bottom: 1px solid #334155;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  z-index: 50;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-title {
  font-family: 'Cinzel', serif;
  font-weight: bold;
  font-size: 1.125rem;
  color: #818cf8;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(129, 140, 248, 0.5);
}

.nav-turn {
  font-size: 0.625rem;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.3em;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-btn {
  font-size: 0.75rem;
  border: 1px solid #334155;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: transparent;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-btn:hover {
  background: #818cf8;
  color: #000;
}

/* 主要内容 */
.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
  overflow: hidden;
  min-height: 0; /* 允许在 flex 容器中收缩 */
}

/* 战斗区域 */
.battle-section {
  flex-grow: 1;
  display: flex;
  gap: 1rem;
  min-height: 0;
}

/* 角色卡片 */
.character-card {
  width: 288px;
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.card-accent {
  position: absolute;
  top: 0;
  width: 100%;
  height: 4px;
  z-index: 10;
}

.enemy-accent { left: 0; background: linear-gradient(to right, #ef4444, transparent); }
.player-accent { right: 0; background: linear-gradient(to left, #3b82f6, transparent); }

.portrait-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  border-radius: 0.5rem;
  background: #1a1a2e;
  margin-bottom: 0.75rem;
  overflow: hidden;
  border: 1px solid #334155;
}

.portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1s;
}

.character-card:hover .portrait-img { transform: scale(1.05); }

.portrait-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40%;
  background: linear-gradient(to top, rgba(15, 23, 42, 1), transparent);
}

.portrait-badge {
  position: absolute;
  top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 0.1em;
}

.enemy-badge { left: 0.5rem; color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
.player-badge { right: 0.5rem; color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }

.character-info { margin-bottom: 0.5rem; }
.player-info { text-align: right; }
.character-name { font-weight: bold; color: #fff; font-size: 1rem; font-family: 'Cinzel', serif; margin-bottom: 0.25rem; }
.character-actions { display: flex; justify-content: flex-start; margin-bottom: 0.25rem; }
.player-info .character-actions { justify-content: flex-end; }
.load-btn { font-size: 0.625rem; color: #6b7280; background: transparent; border: none; cursor: pointer; font-style: italic; }
.load-btn:hover { color: #818cf8; }
.character-desc { font-size: 0.625rem; color: #6b7280; font-style: italic; line-height: 1.4; height: 2rem; overflow: hidden; }

/* 状态条 */
.stat-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.player-stat-bar { flex-direction: row-reverse; }

.stat-label { font-size: 0.75rem; font-weight: bold; width: 24px; }
.enemy-label { color: #ef4444; }
.player-label { color: #3b82f6; }
.mp-label { color: #818cf8; }

.stat-bar-container {
  flex: 1;
  height: 16px;
  background: #1f2937;
  border-radius: 0.25rem;
  position: relative;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 0.25rem;
  transition: width 0.5s ease;
}

.hp-bar { background: linear-gradient(to right, #ef4444, #f87171); }
.hp-bar.danger { background: linear-gradient(to right, #fb923c, #fbbf24); }
.hp-bar.critical { background: linear-gradient(to right, #dc2626, #ef4444); animation: pulse 1s infinite; }
.mp-bar { background: linear-gradient(to right, #6366f1, #818cf8); }

.stat-value {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.625rem;
  color: #fff;
  text-shadow: 0 0 2px #000;
}

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.ai-move-display {
  margin-top: auto;
  padding: 0.75rem;
  background: rgba(127, 29, 29, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.25rem;
}

.ai-move-label { font-size: 0.625rem; color: #fca5a5; text-transform: uppercase; margin-bottom: 0.25rem; }
.ai-move-name { font-size: 0.875rem; font-weight: bold; color: #fff; margin-bottom: 0.25rem; }
.ai-move-type { font-size: 0.625rem; padding: 0.125rem 0.5rem; border-radius: 0.25rem; display: inline-block; }

.reset-btn {
  margin-top: auto;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid rgba(127, 29, 29, 0.5);
  color: rgba(239, 68, 68, 0.5);
  background: transparent;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-btn:hover { background: rgba(127, 29, 29, 0.2); color: #f87171; }

/* 战斗记录面板 */
.chronicle-panel {
  flex-grow: 1;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-top: 2px solid #818cf8;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  min-height: 0; /* 允许在 flex 容器中收缩 */
}

.chronicle-watermark {
  position: absolute;
  right: 1rem;
  top: 1rem;
  font-size: 5rem;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.02);
  pointer-events: none;
}

.novel-output {
  flex: 1 1 0; /* 允许扩展和收缩，基础高度为0 */
  min-height: 0; /* 关键：允许在 flex 容器中收缩以启用滚动 */
  max-height: 50vh; /* 限制最大高度为视口的50% */
  overflow-y: auto;
  padding: 2rem;
  font-size: 1rem;
}

.novel-output::-webkit-scrollbar { width: 6px; }
.novel-output::-webkit-scrollbar-track { background: #020617; }
.novel-output::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
.novel-output::-webkit-scrollbar-thumb:hover { background: #818cf8; }

.empty-state { text-align: center; color: #6b7280; font-style: italic; margin-top: 5rem; }
.empty-state p { margin-bottom: 0.5rem; }
.empty-state span { font-size: 0.75rem; opacity: 0.5; }

.battle-turn { margin-bottom: 2rem; }
.turn-divider { border-bottom: 1px solid #334155; padding-bottom: 0.5rem; margin-bottom: 1rem; color: #818cf8; font-size: 0.875rem; }
.turn-content { line-height: 1.8; text-shadow: 0 0 2px rgba(0, 0, 0, 0.8); }
.turn-content :deep(p) { margin-bottom: 0.8em; }

.system-log {
  height: 120px;
  border-top: 1px solid #1f2937;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem;
  overflow-y: auto;
  font-size: 0.75rem;
  font-family: monospace;
  color: #9ca3af;
}

.log-title { font-size: 0.625rem; color: #4b5563; text-transform: uppercase; margin-bottom: 0.25rem; }
.log-content { display: flex; flex-direction: column; gap: 0.5rem; }

.log-item { padding: 0.5rem; background: rgba(31, 41, 55, 0.5); border-radius: 0.25rem; }
.log-item.critical-hit { background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.5); }
.log-item.heavy-damage { background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); }

.log-header { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
.log-turn { color: #60a5fa; font-weight: bold; }
.log-order { color: #6b7280; font-size: 0.625rem; }
.log-user { margin-bottom: 0.25rem; }
.log-ai { color: #fca5a5; margin-bottom: 0.25rem; }

.skill-type-tag { font-size: 0.5rem; padding: 0.1rem 0.3rem; border-radius: 0.125rem; margin-left: 0.25rem; }

.log-effects { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem; }
.effect-tag { font-size: 0.625rem; padding: 0.1rem 0.3rem; border-radius: 0.125rem; background: rgba(99, 102, 241, 0.2); }
.effect-damage { background: rgba(239, 68, 68, 0.3); }
.effect-heal { background: rgba(34, 197, 94, 0.3); }
.effect-defense { background: rgba(59, 130, 246, 0.3); }
.effect-seal { background: rgba(168, 85, 247, 0.3); }

/* 招式选择区 */
.move-section {
  height: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 20;
}

.move-detail {
  position: absolute;
  top: -4.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #818cf8;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 15px rgba(129, 140, 248, 0.3);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 80%;
}

.detail-name { font-weight: bold; color: #818cf8; white-space: nowrap; }
.detail-name.disabled { color: #6b7280; text-decoration: line-through; }
.rarity-badge { font-size: 0.5rem; padding: 0.1rem 0.3rem; border-radius: 0.125rem; margin-left: 0.5rem; text-transform: uppercase; }
.rarity-common { background: #4b5563; }
.rarity-rare { background: #3b82f6; }
.rarity-epic { background: #a855f7; }
.rarity-legendary { background: linear-gradient(45deg, #f59e0b, #ef4444); }

.detail-stats { color: #9ca3af; font-size: 0.75rem; white-space: nowrap; }
.detail-effect { color: #d1d5db; font-size: 0.75rem; border-left: 1px solid #4b5563; padding-left: 1rem; max-width: 400px; }
.detail-flavor { color: #a78bfa; font-size: 0.625rem; font-style: italic; }

.move-panel {
  flex-grow: 1;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 0.75rem 0.75rem 0 0;
  position: relative;
  overflow: hidden;
  display: flex;
}

.move-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.8));
  pointer-events: none;
}

.move-list-container {
  flex-grow: 1;
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 1rem 2rem 1.5rem;
  scroll-behavior: smooth;
  align-items: stretch;
  min-height: 220px;
}

.move-list-container::-webkit-scrollbar { height: 6px; }
.move-list-container::-webkit-scrollbar-track { background: #020617; }
.move-list-container::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

.move-card {
  flex: 0 0 160px;
  background: linear-gradient(145deg, #1e293b, #0f172a);
  border: 1px solid #334155;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  user-select: none;
}

.move-card:hover { transform: translateY(-15px) scale(1.05); border-color: #818cf8; box-shadow: 0 0 15px rgba(129, 140, 248, 0.4); z-index: 10; }
.move-card.selected { transform: translateY(-20px) scale(1.05); border-color: #c7d2fe; background: linear-gradient(145deg, #312e81, #1e1b4b); box-shadow: 0 0 25px rgba(165, 180, 252, 0.6); z-index: 20; }
.move-card.disabled { opacity: 0.4; cursor: not-allowed; }
.move-card.disabled:hover { transform: none; border-color: #334155; box-shadow: none; }

.move-card.rarity-rare { border-color: rgba(59, 130, 246, 0.5); }
.move-card.rarity-epic { border-color: rgba(168, 85, 247, 0.5); background: linear-gradient(145deg, #1e1b4b, #0f172a); }
.move-card.rarity-legendary { border-color: rgba(245, 158, 11, 0.5); background: linear-gradient(145deg, #451a03, #0f172a); }

.move-card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.move-icon { font-size: 1rem; }
.move-name { font-weight: bold; font-size: 0.8rem; color: #e5e7eb; flex-grow: 1; line-height: 1.2; }

.move-stats { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.move-stats .stat { font-size: 0.625rem; padding: 0.1rem 0.3rem; background: rgba(0, 0, 0, 0.3); border-radius: 0.125rem; }
.move-stats .stat.insufficient { color: #f87171; }

.move-type { font-size: 0.625rem; border: 1px solid #374151; padding: 0.125rem 0.25rem; border-radius: 0.25rem; align-self: flex-end; }

.type-attack { color: #f87171; border-color: rgba(248, 113, 113, 0.3); }
.type-defense { color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); }
.type-seal { color: #a78bfa; border-color: rgba(167, 139, 250, 0.3); }
.type-field { color: #34d399; border-color: rgba(52, 211, 153, 0.3); }
.type-recovery { color: #4ade80; border-color: rgba(74, 222, 128, 0.3); }

.sealed-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f87171;
  font-weight: bold;
  border-radius: 0.5rem;
}

.submit-area {
  width: 160px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-left: 1px solid rgba(31, 41, 55, 0.5);
  background: rgba(0, 0, 0, 0.2);
}

.submit-btn {
  width: 100%;
  height: 96px;
  position: relative;
  background: #1f2937;
  color: #fff;
  border: 1px solid #4b5563;
  border-radius: 0.5rem;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
}

.submit-btn:hover:not(:disabled) { background: #818cf8; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-glow { position: absolute; inset: 0; background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.1), transparent); opacity: 0; transition: opacity 0.3s; }
.submit-btn:hover:not(:disabled) .btn-glow { opacity: 1; }

.btn-text { position: relative; z-index: 10; font-family: 'Cinzel', serif; font-weight: bold; letter-spacing: 0.1em; font-size: 0.875rem; line-height: 1.4; }
.submit-btn:hover:not(:disabled) .btn-text { color: #000; }

.loading-spinner {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 16px;
  height: 16px;
  border: 2px solid #818cf8;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* 新技能解锁通知 */
.new-skill-notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.5), 0 0 60px rgba(168, 85, 247, 0.3);
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.notification-icon {
  font-size: 2rem;
  animation: pulse-glow 1s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.1); filter: brightness(1.3); }
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notification-title {
  font-weight: bold;
  color: #fff;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.notification-skills {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.unlocked-skill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.unlocked-skill .skill-name {
  color: #e0e7ff;
  font-size: 0.75rem;
}

.unlocked-skill .skill-rarity {
  font-size: 0.625rem;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  font-weight: bold;
}

.unlocked-skill .rarity-common { background: #4b5563; color: #d1d5db; }
.unlocked-skill .rarity-rare { background: #3b82f6; color: #fff; }
.unlocked-skill .rarity-epic { background: #a855f7; color: #fff; }
.unlocked-skill .rarity-legendary { background: linear-gradient(45deg, #f59e0b, #ef4444); color: #fff; }

/* 通知动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>

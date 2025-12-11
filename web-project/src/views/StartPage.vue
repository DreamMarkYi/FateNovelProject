<template>
  <div :class="['theme-' + currentTheme]" @click="handleInput">
    <!-- 加载状态 -->
    <div v-if="!scriptLoaded && !scriptError" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载剧本...</div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="scriptError" class="error-overlay">
      <div class="error-content">
        <div class="error-text">❌ 加载失败</div>
        <div class="error-message">{{ scriptError }}</div>
        <button class="retry-btn" @click="loadScript">重试</button>
      </div>
    </div>

    <!-- 静态置顶图片层 -->
    <div id="static-overlay"></div>

    <!-- Intro Layer -->
    <div v-show="!gameState.introFinished" id="intro-layer" class="layer active">
      <div class="intro-shutter shutter-top" :class="introAnimClasses.top" id="shutter-top"></div>
      <div class="intro-shutter shutter-bottom" :class="introAnimClasses.bottom" id="shutter-bottom"></div>
      <div class="intro-text" :class="introAnimClasses.text" id="intro-text">{{ introText }}</div>
      <div class="click-hint" :style="{ opacity: showClickHint ? 1 : 0 }" id="intro-hint">CLICK TO CONTINUE</div>
    </div>

    <div id="game-stage">
      <!-- Title Layer -->
      <div id="title-layer" class="layer" :class="{ active: currentLayer === 'title' }">
        <div class="main-title" id="chapter-title">{{ titleContent.main }}</div>
        <div class="sub-title" id="chapter-sub">{{ titleContent.sub }}</div>
      </div>

      <!-- Gate Layer -->
      <div id="gate-layer" class="layer" :class="{ active: currentLayer === 'gate' }">
        <div class="gate-question" id="gate-text" v-html="gateText"></div>
        <div class="gate-options">
          <button class="gate-btn" @click.stop="chooseIdentity('named')">刻下名讳</button>
          <button class="gate-btn skip-btn" @click.stop="chooseIdentity('anon')">跳过</button>
        </div>
      </div>

      <!-- Input Layer -->
      <div id="input-layer" class="layer" :class="{ active: currentLayer === 'input' }">
        <div class="input-prompt">黑暗注视着你<br>写下你的名字，作为信标</div>
        <input 
          type="text" 
          id="username" 
          class="name-input" 
          autocomplete="off" 
          v-model="nameInput"
          ref="nameInputRef"
        >
        <button class="confirm-btn" @click.stop="submitName">确 定</button>
      </div>

      <!-- Dialogue Layer -->
      <div 
        id="dialogue-layer" 
        class="layer" 
        :class="{ active: currentLayer === 'dialogue' || currentLayer === 'center', 'center-mode': currentLayer === 'center' }"
      >
        <div id="text-content" :class="textAnimClass" v-html="dialogueText"></div>
      </div>

      <!-- Choice Layer -->
      <div id="choice-layer" class="layer" :class="{ active: showChoices }">
        <ChoiceCard
          v-for="(choice, index) in currentChoices"
          :key="index"
          :text="choice.text"
          :delay="index * 0.3"
          @select="selectChoice(choice)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import ChoiceCard from '../components/visualNovel/ChoiceCard.vue'
import { startChoiceApi } from '../api/startChoiceApi'
import { useUserSession } from '../composables/useUserSession'

const router = useRouter()
const userSession = useUserSession()

// === 核心数据结构 ===
const gameState = reactive({
  name: '',
  score: 0,
  mode: 'gate',
  introFinished: false,
  playerId: '', // 后端生成的玩家ID
  startTime: 0,  // 游戏开始时间
  endingType: '' // 结局类型：'day' 或 'night'
})

// === 剧本管理 ===
// 剧本数据从后端加载
const storyScript = ref([])
const scriptLoaded = ref(false)
const scriptError = ref(null)

// === 引擎逻辑 ===
let currentIndex = ref(-1)
let isWaiting = ref(true)
let currentLayer = ref('')
let currentTheme = ref('gate')
let showChoices = ref(false)

// Intro相关
const introText = ref('')
const showClickHint = ref(false)
const introAnimClasses = reactive({
  top: [],
  bottom: [],
  text: []
})

// 其他层内容
const titleContent = reactive({ main: '', sub: '' })
const gateText = ref('')
const dialogueText = ref('')
const textAnimClass = ref('')
const currentChoices = ref([])
const nameInput = ref('')
const nameInputRef = ref(null)

// === 渲染场景 ===
async function renderScene(scene) {
  if (scene.theme) {
    currentTheme.value = scene.theme
  }

  // 重置选择层（除非是quiz类型）
  if (scene.type !== 'quiz') {
    showChoices.value = false
    currentChoices.value = []
  }

  // 检查是否到达结局
  if (scene.type === 'center' && (scene.id === 100 || scene.id === 200)) {
    await handleGameComplete(scene.id)
  }

  switch (scene.type) {
    case 'intro':
      renderIntro(scene)
      break
    case 'text':
      currentLayer.value = 'dialogue'
      renderText(scene)
      break
    case 'center':
      currentLayer.value = 'center'
      renderText(scene)
      break
    case 'gate':
      renderGate(scene)
      break
    case 'input':
      renderInput()
      break
    case 'title':
      renderTitle(scene)
      break
    case 'quiz':
      renderQuiz(scene)
      break
  }
}

// === 从后端加载剧本 ===
async function loadScript() {
  try {
    console.log('正在加载剧本...')
    const response = await startChoiceApi.getActiveScript()
    storyScript.value = response.scenes
    scriptLoaded.value = true
    console.log('剧本加载成功，场景数量:', storyScript.value.length)
  } catch (error) {
    console.error('加载剧本失败:', error)
    scriptError.value = error.message
    // 如果加载失败，显示错误信息
    alert('加载游戏数据失败，请刷新页面重试')
  }
}

// === 计算并显示结局 ===
async function calculateAndShowEnding() {
  try {
    console.log('正在计算结局，当前分数:', gameState.score)
    
    // 调用后端计算结局
    const response = await startChoiceApi.calculateEnding(gameState.score)
    
    console.log('结局计算结果:', response)
    console.log(`最终结果: ${response.endingType === 'day' ? '白昼' : '永夜'}`)
    
    // 保存结局类型到 gameState，用于后续跳转
    gameState.endingType = response.endingType
    
    // 跳转到结局场景
    setTimeout(() => jumpToId(response.sceneId), 500)
  } catch (error) {
    console.error('计算结局失败:', error)
    // 如果后端计算失败，使用本地逻辑作为后备
    const fallbackEndingId = gameState.score > 0 ? 100 : 200
    const fallbackEndingType = gameState.score > 0 ? 'day' : 'night'
    gameState.endingType = fallbackEndingType
    console.log('使用后备逻辑，跳转到场景:', fallbackEndingId)
    setTimeout(() => jumpToId(fallbackEndingId), 500)
  }
}

// === 处理游戏完成 ===
async function handleGameComplete(endingId) {
  if (!gameState.playerId) {
    console.warn('没有玩家ID，无法记录结局')
    return
  }
  
  try {
    const playTime = gameState.startTime > 0 
      ? Math.floor((Date.now() - gameState.startTime) / 1000) 
      : 0
    
    const response = await startChoiceApi.completeGame(
      gameState.playerId,
      endingId,
      playTime
    )
    
    console.log('游戏完成:', response)
    console.log(`最终结果: ${response.finalResult === 'day' ? '白昼' : '永夜'}`)
  } catch (error) {
    console.error('记录游戏完成失败:', error)
  }
}

function renderIntro(scene) {
  gameState.introFinished = false
  introText.value = scene.text
  showClickHint.value = false

  // 清除所有动画类
  introAnimClasses.top = []
  introAnimClasses.bottom = []
  introAnimClasses.text = []

  // 强制重绘
  nextTick(() => {
    if (scene.anim === 'blink-long') {
      introAnimClasses.top = ['anim-blink-top-long']
      introAnimClasses.bottom = ['anim-blink-bottom-long']
      introAnimClasses.text = ['anim-text-wake-long']
      isWaiting.value = true
      setTimeout(() => {
        showClickHint.value = true
        isWaiting.value = false
      }, 4000)
    } else if (scene.anim === 'blink-fast') {
      introAnimClasses.top = ['anim-blink-top-fast']
      introAnimClasses.bottom = ['anim-blink-bottom-fast']
      introAnimClasses.text = ['anim-text-wake-fast']
      isWaiting.value = true
      setTimeout(() => {
        showClickHint.value = true
        isWaiting.value = false
      }, 2500)
    }
  })
}

function renderText(scene) {
  currentLayer.value = scene.type === 'center' ? 'center' : 'dialogue'
  const finalStr = scene.text.replace('${name}', gameState.name)
  dialogueText.value = finalStr
  textAnimClass.value = ''
  
  nextTick(() => {
    if (scene.anim === 'fade') {
      textAnimClass.value = 'anim-fade-in'
    }
  })
  
  // 如果是结局场景，记录日志但不阻止显示（用户可以看到结局）
  if (scene.id === 100 || scene.id === 200) {
    console.log('到达结局场景，游戏结束')
  }
  
  isWaiting.value = false
}

function renderGate(scene) {
  currentLayer.value = 'gate'
  gateText.value = scene.text
  isWaiting.value = true
}

function renderInput() {
  currentLayer.value = 'input'
  isWaiting.value = true
  nextTick(() => {
    if (nameInputRef.value) {
      nameInputRef.value.focus()
    }
  })
}

function renderTitle(scene) {
  currentLayer.value = 'title'
  titleContent.main = scene.title
  titleContent.sub = scene.sub
  isWaiting.value = false
}

function renderQuiz(scene) {
  // 显示对话层和选择层
  currentLayer.value = 'dialogue'
  dialogueText.value = scene.text
  currentChoices.value = scene.choices
  showChoices.value = false
  
  // 延迟显示选项卡片以获得更好的动画效果
  nextTick(() => {
    setTimeout(() => {
      showChoices.value = true
    }, 300)
  })
  
  isWaiting.value = true
}

// === 用户交互 ===
function handleInput() {
  if (isWaiting.value) return

  const scene = storyScript.value[currentIndex.value]
  if (!scene) return

  // 检查是否是结局场景（游戏结束，点击后跳转到对应结局页面）
  if (scene.id === 100 || scene.id === 200) {
    console.log('游戏已结束，跳转到结局页面')
    const finalResult = gameState.endingType
    if (finalResult === 'day') {
      router.push('/exDay')
    } else {
      router.push('/exNight')
    }
    return
  }

  if (scene.type === 'intro') {
    showClickHint.value = false
    introAnimClasses.top = ['anim-close-top']
    introAnimClasses.bottom = ['anim-close-bottom']
    introAnimClasses.text = ['anim-text-out']
    isWaiting.value = true
    
    setTimeout(() => {
      gameState.introFinished = true
      advanceScript()
    }, 800)
    return
  }

  if (scene.type === 'title') {
    currentLayer.value = ''
    setTimeout(() => advanceScript(), 800)
    isWaiting.value = true
    return
  }

  if (scene.type === 'text' || scene.type === 'center') {
    advanceScript()
  }
}

async function chooseIdentity(type) {
  currentLayer.value = ''
  
  if (type === 'named') {
    // 跳转到输入名字的场景
    setTimeout(() => jumpToId(11), 600)
  } else {
    // 用户选择跳过不输入名字
    const globalUserId = userSession.userId.value
    
    try {
      const response = await startChoiceApi.completeStartPage(
        globalUserId,
        null,
        'skipped'
      )
      
      gameState.playerId = response.data.playerId
      gameState.name = response.data.playerName
      
      // 保存 JWT Token
      if (response.data.token) {
        localStorage.setItem('fate_novel_token', response.data.token)
        console.log('✅ JWT Token 已保存')
      }
      
      console.log('✅ 用户选择跳过输入名字')
    } catch (error) {
      console.error('❌ 完成StartPage失败:', error)
    }
    
    setTimeout(() => jumpToId(20), 600)
  }
}

async function submitName() {
  const val = nameInput.value.trim()
  if (val) {
    gameState.name = val
    const globalUserId = userSession.userId.value
    
    try {
      // 使用统一的API，传入用户输入的名字
      const response = await startChoiceApi.completeStartPage(
        globalUserId,
        val,
        'named'
      )
      
      gameState.playerId = response.data.playerId
      userSession.setUserName(val)
      
      // 保存 JWT Token
      if (response.data.token) {
        localStorage.setItem('fate_novel_token', response.data.token)
        console.log('✅ JWT Token 已保存')
      }
      
      console.log('✅ 用户输入了名字:', val)
    } catch (error) {
      console.error('❌ 完成StartPage失败:', error)
    }
    
    currentLayer.value = ''
    setTimeout(() => jumpToId(21), 600)
  }
}

async function selectChoice(choice) {
  gameState.score += choice.score
  
  // 记录选择到后端
  if (gameState.playerId) {
    try {
      const scene = storyScript.value[currentIndex.value]
      await startChoiceApi.recordChoice(
        gameState.playerId,
        scene.id,
        choice.text,
        choice.score
      )
      console.log('选择已记录')
    } catch (error) {
      console.error('记录选择失败:', error)
    }
  }
  
  showChoices.value = false
  currentLayer.value = ''
  
  // 检查是否到达需要计算结局的节点（原来的 id: 99）
  if (choice.nextId === 99) {
    // 调用后端计算结局
    await calculateAndShowEnding()
  } else {
    setTimeout(() => jumpToId(choice.nextId), 500)
  }
}

function jumpToId(id) {
  const idx = storyScript.value.findIndex(s => s.id === id)
  if (idx !== -1) {
    currentIndex.value = idx
    renderScene(storyScript.value[idx])
  }
}

function advanceScript() {
  const currentScene = storyScript.value[currentIndex.value]
  if (!currentScene) return
  
  // 检查是否是结局场景（游戏结束，不再继续）
  if (currentScene.id === 100 || currentScene.id === 200) {
    console.log('游戏已结束，不再继续播放')
    return
  }
  
  if (currentScene.nextId !== undefined) {
    jumpToId(currentScene.nextId)
  } else if (currentIndex.value + 1 < storyScript.value.length) {
    currentIndex.value++
    renderScene(storyScript.value[currentIndex.value])
  }
}

// === 生命周期 ===
onMounted(async () => {
  gameState.startTime = Date.now()
  
  // 1. 初始化用户会话（生成或恢复用户ID）
  await userSession.initSession('StartPage')
  console.log('📌 当前用户ID:', userSession.userId.value)
  
  // 2. 检查用户是否已完成StartPage
  try {
    const checkResult = await startChoiceApi.checkFirstTimeVisitor(userSession.userId.value)
    console.log('🔍 首次访问检查:', checkResult)
    
    // 如果用户已经完成StartPage，直接跳转到小说展示页面
    if (!checkResult.data.shouldShowStartPage) {
      console.log('✅ 用户已完成StartPage，跳转到NovelShowPage')
      router.push('/novel-show')
      return // 终止后续流程
    }
    
    console.log('📝 首次访问，显示StartPage')
  } catch (error) {
    console.error('❌ 检查首次访问失败:', error)
    // 检查失败也继续显示StartPage（更安全的做法）
  }
  
  // 3. 加载剧本
  await loadScript()
  
  // 4. 剧本加载成功后开始游戏
  if (scriptLoaded.value) {
    jumpToId(0)
  } else {
    console.error('剧本加载失败，无法开始游戏')
  }
})

onUnmounted(() => {
  // 清理
  console.log('StartPage unmounted')
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+JP:wght@200;300;400;700&display=swap');

:root {
  --font-main: 'Noto Serif JP', serif;
  --font-en: 'Playfair Display', serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body, html {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.theme-gate,
.theme-void,
.theme-ink,
.theme-light,
.theme-dark {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: var(--font-main);
  user-select: none;
  cursor: pointer;
  position: relative;
}

/* ============================
   === [新增] 静态置顶图片层 ===
   ============================ */
#static-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  pointer-events: none;
  background-image: url('/start_page_BG_alpha.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.2;
  mix-blend-mode: normal;
}

#game-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 2s ease;
}

/* ============================
   === 动画类定义 ===
   ============================ */
.anim-blink-top-long {
  animation: blinkTopLong 4s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
}

.anim-blink-bottom-long {
  animation: blinkBottomLong 4s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
}

.anim-text-wake-long {
  animation: textWakeUpLong 4s ease-in-out forwards;
}

@keyframes blinkTopLong {
  0% { transform: scaleY(1); filter: blur(20px); }
  20% { transform: scaleY(0.6); filter: blur(20px); }
  40% { transform: scaleY(1); filter: blur(20px); }
  55% { transform: scaleY(1); filter: blur(20px); }
  100% { transform: scaleY(0); filter: blur(20px); }
}

@keyframes blinkBottomLong {
  0% { transform: scaleY(1); filter: blur(20px); }
  20% { transform: scaleY(0.6); filter: blur(20px); }
  40% { transform: scaleY(1); filter: blur(20px); }
  55% { transform: scaleY(1); filter: blur(20px); }
  100% { transform: scaleY(0); filter: blur(20px); }
}

@keyframes textWakeUpLong {
  0% { opacity: 0; filter: blur(20px); }
  20% { opacity: 0.6; filter: blur(8px); }
  40% { opacity: 0; filter: blur(20px); }
  55% { opacity: 0; filter: blur(20px); }
  100% { opacity: 1; filter: blur(0px); }
}

.anim-blink-top-fast {
  animation: blinkTopFast 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.anim-blink-bottom-fast {
  animation: blinkBottomFast 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.anim-text-wake-fast {
  animation: textWakeUpFast 2.5s ease-out forwards;
}

@keyframes blinkTopFast {
  0% { transform: scaleY(1); filter: blur(10px); }
  30% { transform: scaleY(1); filter: blur(10px); }
  100% { transform: scaleY(0); filter: blur(0px); }
}

@keyframes blinkBottomFast {
  0% { transform: scaleY(1); filter: blur(10px); }
  30% { transform: scaleY(1); filter: blur(10px); }
  100% { transform: scaleY(0); filter: blur(0px); }
}

@keyframes textWakeUpFast {
  0% { opacity: 0; filter: blur(10px); }
  30% { opacity: 0; filter: blur(10px); }
  100% { opacity: 1; filter: blur(0px); }
}

.anim-close-top {
  animation: closeTop 0.8s cubic-bezier(0.45, 0, 0.55, 1) forwards;
}

.anim-close-bottom {
  animation: closeBottom 0.8s cubic-bezier(0.45, 0, 0.55, 1) forwards;
}

.anim-text-out {
  animation: textFadeOut 0.5s ease forwards;
}

@keyframes closeTop {
  0% { transform: scaleY(0); }
  100% { transform: scaleY(1); }
}

@keyframes closeBottom {
  0% { transform: scaleY(0); }
  100% { transform: scaleY(1); }
}

@keyframes textFadeOut {
  to { opacity: 0; filter: blur(5px); }
}

.anim-fade-in {
  animation: fadeInText 1.5s ease forwards;
}

@keyframes fadeInText {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ============================
   === 图层定义 ===
   ============================ */
.layer {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1s ease;
}

.active {
  opacity: 1 !important;
  pointer-events: auto !important;
}

.fade-out {
  opacity: 0 !important;
  pointer-events: none !important;
}

#intro-layer {
  z-index: 999;
  background: transparent;
  transition: opacity 1.5s;
  pointer-events: auto;
}

.intro-shutter {
  position: absolute;
  left: 0;
  width: 100%;
  height: 55%;
  background: #000;
  will-change: transform;
  z-index: 2;
}

.shutter-top {
  top: 0;
  transform-origin: top;
  border-bottom-left-radius: 50% 20%;
  border-bottom-right-radius: 50% 20%;
}

.shutter-bottom {
  bottom: 0;
  transform-origin: bottom;
  border-top-left-radius: 50% 20%;
  border-top-right-radius: 50% 20%;
}

.intro-text {
  font-size: 1.5rem;
  font-family: 'Noto Serif JP', serif;
  color: #ddd;
  border-color: #aaa;
  letter-spacing: 0.2rem;
  z-index: 1;
}

.click-hint {
  position: absolute;
  bottom: 10%;
  color: #fff;
  opacity: 0;
  font-size: 0.8rem;
  letter-spacing: 0.2rem;
  transition: opacity 1s;
  animation: pulse 2s infinite;
  z-index: 1;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

/* Dialogue Layer */
#dialogue-layer {
  z-index: 20;
  bottom: 15%;
  top: auto;
  height: auto;
  min-height: 150px;
  width: 70%;
  max-width: 600px;
  text-align: center;
}

.theme-ink #dialogue-layer {
  border-top: 1px solid #444;
  border-bottom: 1px solid #444;
  padding: 2rem;
}

#text-content {
  font-size: 1.1rem;
  line-height: 2;
  letter-spacing: 0.05rem;
}

/* [新增] Center Mode: 用于居中显示文字的特殊模式 */
#dialogue-layer.center-mode {
  bottom: 0 !important;
  top: 0 !important;
  height: 100% !important;
  border: none !important;
  background: transparent !important;
}

.center-mode #text-content {
  font-size: 1.3rem !important;
  letter-spacing: 0.2rem !important;
}

/* Themes */
.theme-gate {
  background: #050505;
  color: #666;
  --accent: #444;
}

.theme-void {
  background: #000;
  color: #444;
  --accent: #222;
}

.theme-ink {
  background: linear-gradient(to bottom, #1a1a1a, #000);
  color: #e0e0e0;
  --accent: #fff;
}

.theme-light {
  background: #cdcdcd;
  color: #000;
}

.theme-dark {
  background: #0a0a0a;
  color: #555;
}

/* Gate Layer */
#gate-layer {
  z-index: 60;
  transform: translateY(30px);
  transition: 1.5s;
}

#gate-layer.active {
  transform: translateY(0);
}

.gate-btn {
  padding: 12px 0;
  width: 140px;
  background: transparent;
  border: none;
  border-bottom: 1px solid #333;
  color: #555;
  font-family: var(--font-main);
  cursor: pointer;
  margin: 0 2rem;
  transition: 0.5s;
}

.gate-btn:hover {
  color: #ddd;
  border-color: #aaa;
  letter-spacing: 0.2rem;
}

.skip-btn {
  opacity: 0.6;
  font-size: 0.9rem;
}

.skip-btn:hover {
  opacity: 1;
}

.gate-question {
  margin-bottom: 3rem;
  letter-spacing: 0.1rem;
  line-height: 2;
  text-align: center;
}

/* Input Layer */
#input-layer {
  z-index: 50;
}

.input-prompt {
  color: inherit;
  margin-bottom: 2rem;
  letter-spacing: 0.1rem;
  text-align: center;
  line-height: 2;
}

.name-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #333;
  color: #ddd;
  font-size: 1.5rem;
  text-align: center;
  width: 200px;
  margin-bottom: 3rem;
  padding-bottom: 5px;
  outline: none;
  font-family: var(--font-main);
  transition: 0.3s;
}

.name-input:focus {
  border-color: #888;
}

.confirm-btn {
  padding: 12px 0;
  width: 140px;
  background: transparent;
  border: none;
  border-bottom: 1px solid #333;
  color: #555;
  font-family: var(--font-main);
  cursor: pointer;
  transition: 0.5s;
  opacity: 1;
}

.confirm-btn:hover {
  color: #ddd;
  border-color: #aaa;
  letter-spacing: 0.2rem;
}

#title-layer {
  z-index: 10;
}

.main-title {
  font-size: 3rem;
  letter-spacing: 1rem;
  margin-bottom: 1rem;
}

.sub-title {
  font-family: var(--font-en);
  font-size: 0.7rem;
  letter-spacing: 0.3rem;
  text-transform: uppercase;
  opacity: 0.5;
}

#choice-layer {
  z-index: 30;
  flex-direction: row;
  gap: 3rem;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  z-index: 10001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  letter-spacing: 0.2rem;
}

/* 错误状态 */
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  z-index: 10001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-content {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
}

.error-text {
  color: #ff6b6b;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.error-message {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.retry-btn {
  padding: 12px 40px;
  background: transparent;
  border: 1px solid #666;
  color: #999;
  font-family: var(--font-main);
  cursor: pointer;
  transition: 0.3s;
}

.retry-btn:hover {
  color: #fff;
  border-color: #aaa;
  letter-spacing: 0.2rem;
}
</style>


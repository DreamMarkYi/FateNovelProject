<template>
  <div v-if="isLoading" class="loading-screen">
    <div class="loading-spinner"></div>
    <div class="loading-text">正在加载剧本...</div>
  </div>

  <div v-else-if="loadError" class="error-screen">
    <div class="error-icon">⚠️</div>
    <div class="error-title">加载失败</div>
    <div class="error-message">{{ loadError }}</div>
    <button class="retry-button" @click="loadScript">重试</button>
  </div>

  <div
      v-else
      class="game-stage"
      :class="`theme-${currentTheme}`"
      :style="{ backgroundImage: currentBgImage ? `url('${currentBgImage}')` : '' }"
      @click="handleInput"
  >
    <div id="title-layer" :class="{ active: showTitle }">
      <div class="main-title">{{ titleText }}</div>
      <div class="sub-title">{{ subTitleText }}</div>
    </div>

    <div id="character-layer" class="character-layer">
      <transition name="character-fade">
        <div class="character-left" v-if="currentCharacterLeft" :key="currentCharacterLeft">
          <img :src="currentCharacterLeft" alt="左侧角色" />
        </div>
      </transition>
      <transition name="character-fade">
        <div class="character-right" v-if="currentCharacterRight" :key="currentCharacterRight">
          <img :src="currentCharacterRight" alt="右侧角色" />
        </div>
      </transition>
    </div>

    <div id="dialogue-layer" :class="{ active: showDialogue }">

      <div class="speaker-wrapper" v-if="currentSpeaker" :style="{ opacity: currentSpeaker ? 1 : 0 }">
        <div class="speaker-box">
          <span class="speaker-text">{{ currentSpeaker }}</span>
        </div>
      </div>

      <div class="text-container">
        <div id="text-content">{{ currentText }}</div>
      </div>

      <div class="next-indicator">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      </div>
    </div>
    <GameChoices
        :visible="showChoice"
        :choices="currentChoices"
        @make-choice="handleChoice"
    />

    <GameToolbar
        @quick-save="quickSaveGame"
        @quick-load="quickLoadGame"
        @open-menu="openSystemMenu"
        @show-history="showHistory"
    />

    <SystemMenu
        :visible="showSystemMenu"
        :initialTab="systemMenuTab"
        :saves="localSaves"
        @close="showSystemMenu = false"
        @save-slot="saveToSlot"
        @load-slot="loadFromSlot"
    />

    <div v-if="showDebugInfo" class="debug-info">
      <div>剧本: {{ scriptName }}</div>
      <div>场景: {{ currentSceneIndex }} / {{ storyScript.length }}</div>
      <div>进度: {{ progress }}%</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import GameChoices from '@/components/visualNovel/GameChoices.vue';
import GameToolbar from '@/components/visualNovel/GameToolbar.vue';
import SystemMenu from '@/components/visualNovel/SystemMenu.vue';
import { useUserSession } from '@/composables/useUserSession';
import { gameSaveApi } from '@/api/gameSaveApi';
import { novelScriptApi } from '@/api/novelScriptApi';

// 路由
const route = useRoute();

// 用户会话
const userSession = useUserSession();

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/mongo';

// 剧本数据
const storyScript = ref([]);
const scriptId = ref('chapter1-1'); // 默认剧本ID
const scriptName = ref('');
const scriptMetadata = ref(null);

// 加载状态
const isLoading = ref(true);
const loadError = ref('');

// 当前场景索引
const currentIndex = ref(0);
const currentTheme = ref('dark');
const currentBgImage = ref('');
const currentCharacterLeft = ref('');
const currentCharacterRight = ref('');
const titleText = ref('幻视');
const subTitleText = ref('Phantom Vision');

// 对话内容
const currentSpeaker = ref('');
const currentText = ref('');

// 选择相关
const currentChoices = ref([]);
const choiceHistory = ref([]);
const gameVariables = ref({});

// 玩家信息 - 使用用户会话中的 userId
const playerId = computed(() => userSession.userId.value || 'player_' + Date.now());

// 进度相关
const progressPercentage = ref(0);
const isScriptCompleted = ref(false); // 防止重复触发完成

// 菜单状态
const showSystemMenu = ref(false);
const systemMenuTab = ref('save');
const localSaves = ref({});

// 图片预加载状态
const preloadedImages = ref(new Set());
const preloadProgress = ref({ loaded: 0, total: 0 });

// 显示控制
const showTitle = computed(() => {
  const scene =  storyScript.value[currentIndex.value];
  return scene && scene.type === 'title';
});

const showDialogue = computed(() => {
  const scene = storyScript.value[currentIndex.value];
  return scene && scene.type === 'text';
});

const showChoice = computed(() => {
  const scene = storyScript.value[currentIndex.value];
  return scene && scene.type === 'choice';
});

const currentSceneIndex = computed(() => {
  const scene = storyScript.value[currentIndex.value];
  return scene ? scene.index : 0;
});

const showDebugInfo = ref(false);

const progress = computed(() => {
  if (storyScript.value.length === 0) return 0;
  return Math.floor((currentIndex.value / storyScript.value.length) * 100);
});

// 计算当前进度百分比
const calculateProgress = () => {
  if (!storyScript.value || storyScript.value.length === 0) {
    return 0;
  }
  
  const totalScenes = storyScript.value.length;
  const currentPosition = currentIndex.value + 1; // +1 因为索引从0开始
  
  const percentage = Math.min(100, Math.floor((currentPosition / totalScenes) * 100));
  
  console.log(`📊 进度计算: ${currentPosition}/${totalScenes} = ${percentage}%`);
  
  return percentage;
};

// 检查并处理剧本完成
const checkScriptCompletion = async () => {
  const progress = calculateProgress();
  progressPercentage.value = progress;
  
  // 当进度达到100%且尚未标记完成时
  if (progress === 100 && !isScriptCompleted.value) {
    isScriptCompleted.value = true;
    console.log('🎉 剧本完成！');
    
    try {
      // 调用后端API标记剧本完成
      const response = await novelScriptApi.markScriptCompleted(
        playerId.value,
        scriptId.value
      );
      
      if (response.success) {
        console.log('✅ 剧本完成状态已更新');
        console.log('🔓 新解锁的剧本:', response.data.newlyUnlocked);
        
        // 显示完成提示
        if (response.data.isNewCompletion) {
          showCompletionNotification(response.data);
        }
      }
    } catch (error) {
      console.error('❌ 更新剧本完成状态失败:', error);
    }
  }
};

// 显示完成提示
const showCompletionNotification = (data) => {
  // 显示完成祝贺
  alert(`🎉 恭喜完成《${scriptName.value}》！`);
  
  // 如果有新解锁的章节，显示提示
  if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
    alert(`🔓 解锁了新章节: ${data.newlyUnlocked.join(', ')}`);
  }
};

// 处理点击事件
const handleInput = () => {
  const currentScene = storyScript.value[currentIndex.value];
  if (currentScene && currentScene.type === 'choice') {
    return;
  }
  let nextIndex = currentIndex.value + 1;
  if (nextIndex >= storyScript.value.length) {
    nextIndex = 0;
  }
  currentIndex.value = nextIndex;
  renderScene(storyScript.value[currentIndex.value]);
  
  // 每次切换场景后检查进度
  checkScriptCompletion();
  
  if (nextIndex % 5 === 0) {
    autoSaveGame();
  }
};

// 渲染场景
const renderScene = (scene) => {
  if (!scene) return;
  currentTheme.value = scene.theme || 'dark';
  
  // 只在背景图片不为空且与当前图片不同时才切换
  if (scene.bgImage && scene.bgImage !== currentBgImage.value) {
    currentBgImage.value = scene.bgImage;
  }
  // 如果 bgImage 为空或未定义，保持当前背景不变
  
  currentCharacterLeft.value = scene.characterImageLeft || '';
  currentCharacterRight.value = scene.characterImageRight || '';

  if (scene.type === 'title') {
    titleText.value = scene.title;
    subTitleText.value = scene.subtitle || scene.sub || '';
  } else if (scene.type === 'text') {
    currentSpeaker.value = scene.speaker || '';
    currentText.value = scene.text;
  } else if (scene.type === 'choice') {
    currentSpeaker.value = scene.speaker || '';
    currentText.value = scene.text || '请选择...';
    currentChoices.value = scene.choices || [];
  }
};

// 处理选择
const handleChoice = (choice) => {
  const currentScene = storyScript.value[currentIndex.value];
  const index = currentChoices.value.findIndex(c => c.text === choice.text);

  const choiceRecord = {
    sceneIndex: currentScene.index,
    sceneName: currentScene.text || '选择',
    choiceIndex: index,
    choiceText: choice.text,
    jumpTo: choice.jumpTo || choice.jump,
    timestamp: new Date().toISOString()
  };
  choiceHistory.value.push(choiceRecord);

  const choiceKey = `choice_${currentScene.index}`;
  gameVariables.value[choiceKey] = {
    index: index,
    text: choice.text,
    jumpTo: choice.jumpTo || choice.jump
  };

  const targetJump = choice.jumpTo || choice.jump;
  const targetIndex = storyScript.value.findIndex(
      scene => scene.index === targetJump
  );

  if (targetIndex !== -1) {
    currentIndex.value = targetIndex;
    renderScene(storyScript.value[targetIndex]);
  }
};

// 加载剧本
const loadScript = async () => {
  isLoading.value = true;
  loadError.value = '';
  try {
    const response = await axios.get(`${API_BASE_URL}/novel-scripts/${scriptId.value}`);
    if (response.data.success && response.data.data) {
      const scriptData = response.data.data;
      scriptName.value = scriptData.scriptName;
      scriptMetadata.value = scriptData.metadata;
      const scenes = scriptData.scenes.sort((a, b) => a.index - b.index);
      storyScript.value = scenes;

      // 收集所有唯一的背景图片 URL（去重）
      const uniqueImages = new Set();
      scenes.forEach(scene => {
        if (scene.bgImage && scene.bgImage.trim()) {
          uniqueImages.add(scene.bgImage.trim());
        }
      });
      const allUniqueImages = Array.from(uniqueImages);
      
      // 优先加载前5张不同的背景图片
      // 遍历场景，直到收集满5张唯一图片为止
      const priorityImages = new Set();
      const maxPriorityImages = 5;
      
      for (let i = 0; i < scenes.length && priorityImages.size < maxPriorityImages; i++) {
        if (scenes[i]?.bgImage && scenes[i].bgImage.trim()) {
          priorityImages.add(scenes[i].bgImage.trim());
        }
      }
      const priorityImageArray = Array.from(priorityImages);
      
      // 设置加载进度，基于实际图片数量
      preloadProgress.value = { loaded: 0, total: allUniqueImages.length };
      
      console.log(`📸 共发现 ${allUniqueImages.length} 张唯一背景图片`);
      console.log(`🎯 优先加载前 ${priorityImageArray.length} 张图片`);
      
      try {
        await preloadImagesInBatch(priorityImageArray);
      } catch (error) { console.warn(error); }

      if (scenes.length > 0) {
        currentIndex.value = 0;
        renderScene(scenes[0]);
      }
      
      // 重置并计算初始进度
      isScriptCompleted.value = false;
      progressPercentage.value = calculateProgress();
      
      // 检查该剧本是否已经完成过
      try {
        const completionStatus = await novelScriptApi.checkScriptCompletion(
          playerId.value,
          scriptId.value
        );
        
        if (completionStatus.data.isCompleted) {
          isScriptCompleted.value = true;
          console.log('📚 该剧本已完成过');
        }
      } catch (error) {
        console.warn('检查剧本完成状态失败:', error);
      }
      
      isLoading.value = false;
      
      // 延迟加载剩余图片
      const remainingImages = allUniqueImages.filter(
        img => !priorityImages.has(img)
      );
      if (remainingImages.length > 0) {
        console.log(`⏳ 准备延迟加载剩余 ${remainingImages.length} 张图片`);
        preloadRemainingImagesOptimized(remainingImages);
      }
    } else {
      throw new Error('剧本数据格式错误');
    }
  } catch (error) {
    isLoading.value = false;
    loadError.value = error.message || '加载失败';
  }
};

const preloadImage = (url) => {
  if (preloadedImages.value.has(url)) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { preloadedImages.value.add(url); preloadProgress.value.loaded++; resolve(img); };
    img.onerror = () => { preloadProgress.value.loaded++; resolve(); };
    img.src = url;
  });
};

const preloadImagesInBatch = async (urls) => {
  const validUrls = urls.filter(url => url && !preloadedImages.value.has(url));
  if (validUrls.length === 0) return;
  await Promise.all(validUrls.map(url => preloadImage(url)));
};

/**
 * 优化后的延迟加载函数 - 直接加载唯一图片数组
 * @param {Array<string>} imageUrls - 需要加载的唯一图片 URL 数组
 */
const preloadRemainingImagesOptimized = async (imageUrls) => {
  // 延迟1秒后开始加载，避免影响初始渲染
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 过滤掉已经加载的图片
  const urlsToLoad = imageUrls.filter(url => !preloadedImages.value.has(url));
  
  if (urlsToLoad.length === 0) {
    console.log('✅ 所有图片已预加载完成');
    return;
  }
  
  console.log(`🔄 开始延迟加载 ${urlsToLoad.length} 张图片`);
  
  // 分批加载，每批3张
  const batchSize = 3;
  for (let i = 0; i < urlsToLoad.length; i += batchSize) {
    const batch = urlsToLoad.slice(i, i + batchSize);
    await preloadImagesInBatch(batch);
    
    // 每批之间延迟500ms，避免过度占用带宽
    if (i + batchSize < urlsToLoad.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('✅ 所有背景图片预加载完成');
};

const openSystemMenu = (tab) => {
  systemMenuTab.value = tab;
  showSystemMenu.value = true;
};

const showHistory = () => {
  console.log('=== 选择历史记录 ===', choiceHistory.value);
};

// === 存档相关函数 ===

/**
 * 快速存档
 */
const quickSaveGame = async () => {
  if (!playerId.value) {
    console.warn('❌ 没有玩家ID，无法快速存档');
    return;
  }
  
  try {
    const saveData = createSaveData();
    const response = await gameSaveApi.quickSave(playerId.value, saveData);
    
    if (response.success) {
      console.log('✅ 快速存档成功');
      // 可以显示提示信息
    }
  } catch (error) {
    console.error('❌ 快速存档失败:', error);
  }
};

/**
 * 快速读档
 */
const quickLoadGame = async () => {
  if (!playerId.value) {
    console.warn('❌ 没有玩家ID，无法快速读档');
    return;
  }
  
  try {
    const response = await gameSaveApi.getQuickSave(playerId.value);
    
    if (response.success && response.data) {
      loadSaveData(response.data);
      console.log('✅ 快速读档成功');
    }
  } catch (error) {
    console.error('❌ 快速读档失败:', error);
  }
};

/**
 * 保存到指定槽位
 */
const saveToSlot = async (slot) => {
  if (!playerId.value) {
    console.warn('❌ 没有玩家ID，无法保存');
    return;
  }
  
  try {
    const saveData = createSaveData();
    saveData.saveName = `存档 ${slot}`;
    
    const response = await gameSaveApi.saveGame(playerId.value, slot, saveData);
    
    if (response.success) {
      console.log(`✅ 保存到槽位 ${slot} 成功`);
      await loadSavesList(); // 刷新存档列表
    }
  } catch (error) {
    console.error(`❌ 保存到槽位 ${slot} 失败:`, error);
  }
};

/**
 * 从指定槽位读档
 */
const loadFromSlot = async (slot) => {
  if (!playerId.value) {
    console.warn('❌ 没有玩家ID，无法读档');
    return;
  }
  
  try {
    const response = await gameSaveApi.getSaveBySlot(playerId.value, slot);
    
    if (response.success && response.data) {
      loadSaveData(response.data);
      console.log(`✅ 从槽位 ${slot} 读档成功`);
      showSystemMenu.value = false; // 关闭菜单
    }
  } catch (error) {
    console.error(`❌ 从槽位 ${slot} 读档失败:`, error);
  }
};

/**
 * 自动存档
 */
const autoSaveGame = async () => {
  if (!playerId.value) {
    console.warn('❌ 没有玩家ID，无法自动存档');
    return;
  }
  
  try {
    const saveData = createSaveData();
    const response = await gameSaveApi.autoSave(playerId.value, saveData);
    
    if (response.success) {
      console.log('✅ 自动存档成功');
    }
  } catch (error) {
    console.error('❌ 自动存档失败:', error);
  }
};

/**
 * 加载存档列表
 */
const loadSavesList = async () => {
  if (!playerId.value) {
    console.warn('❌ 没有玩家ID，无法加载存档列表');
    return;
  }
  
  try {
    const response = await gameSaveApi.getPlayerSaves(playerId.value);
    
    if (response.success && response.data) {
      // 转换为槽位对象格式
      const savesObj = {};
      response.data.forEach(save => {
        savesObj[save.saveSlot] = save;
      });
      localSaves.value = savesObj;
      console.log(`✅ 加载了 ${response.data.length} 个存档`);
    }
  } catch (error) {
    console.error('❌ 加载存档列表失败:', error);
  }
};

/**
 * 创建存档数据
 */
const createSaveData = () => {
  const currentScene = storyScript.value[currentIndex.value];
  
  return {
    scriptId: scriptId.value,
    scriptName: scriptName.value,
    currentSceneIndex: currentScene?.index || 0,
    progressPercentage: progressPercentage.value, // 使用前端计算的进度
    playTime: Math.floor((Date.now() - new Date().getTime()) / 1000), // 游戏时长（秒）
    choiceHistory: choiceHistory.value,
    gameVariables: gameVariables.value,
    timestamp: new Date().toISOString()
  };
};

/**
 * 加载存档数据
 */
const loadSaveData = (saveData) => {
  if (!saveData) return;
  
  // 恢复游戏状态
  scriptId.value = saveData.scriptId;
  scriptName.value = saveData.scriptName;
  choiceHistory.value = saveData.choiceHistory || [];
  gameVariables.value = saveData.gameVariables || {};
  
  // 查找并跳转到保存的场景
  const targetIndex = storyScript.value.findIndex(
    scene => scene.index === saveData.currentSceneIndex
  );
  
  if (targetIndex !== -1) {
    currentIndex.value = targetIndex;
    renderScene(storyScript.value[targetIndex]);
    console.log(`✅ 已恢复到场景 ${saveData.currentSceneIndex}`);
  } else {
    console.warn(`⚠️ 场景 ${saveData.currentSceneIndex} 不存在`);
  }
};

onMounted(async () => {
  // 1. 初始化用户会话
  await userSession.initSession('NovelShowPage');
  console.log('📌 NovelShowPage - 当前用户ID:', playerId.value);
  
  // 2. 处理路由参数
  if (route.query.scriptId) scriptId.value = route.query.scriptId;
  if (route.query.debug === 'true') showDebugInfo.value = true;
  if (route.query.startScene) currentIndex.value = parseInt(route.query.startScene) || 0;
  
  // 3. 加载剧本和存档
  await loadScript();
  await loadSavesList();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;500;700&family=Playfair+Display:ital,wght@0,400;1,400&display=swap');

:root {
  --trans-speed: 1s;
  --font-main: 'Noto Serif SC', serif;
  --font-en: 'Playfair Display', serif;
}

/* === 修改1：更新配色变量，使用线性渐变 === */
.theme-dark {
  --text-color: #f0f0f0;
  --accent-color: #7f8c8d;
  /* 背景改为垂直渐变：
     0% (顶部): 较透明的深色 (0.6)，让背景图透出来
     35% (文字开始处): 变深 (0.85) 保证文字清晰
     100% (底部): 几乎不透明 (0.95)
  */
  --dialogue-bg: linear-gradient(
      to bottom,
      rgba(12, 18, 26, 0.6) 0%,
      rgba(12, 18, 26, 0.9) 35%,
      rgba(12, 18, 26, 0.98) 100%
  );
  --name-box-bg: linear-gradient(135deg, #2c3e50, #22303f);
}

.theme-light {
  --text-color: #333;
  --accent-color: #555;
  /* 亮色模式也改为渐变，白色淡出 */
  --dialogue-bg: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.7) 0%,
      rgba(255, 255, 255, 0.95) 40%,
      rgba(255, 255, 255, 1) 100%
  );
  --name-box-bg: linear-gradient(135deg, #e0e0e0, #cfcfcf);
}

.game-stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  transition: background-image var(--trans-speed) ease;
  cursor: pointer;
  font-family: var(--font-main);
  user-select: none;
  overflow: hidden;
  background-color: #000;
}

/* === 标题层 === */
#title-layer {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  opacity: 0; transition: opacity 1s ease; pointer-events: none; z-index: 20;
}
#title-layer.active { opacity: 1; pointer-events: auto; }
.main-title { font-size: 4rem; letter-spacing: 1rem; color: var(--text-color); margin-bottom: 0.5rem; }
.sub-title { font-family: var(--font-en); font-size: 0.9rem; letter-spacing: 0.3rem; color: var(--accent-color); }

/* === 人物层 === */
.character-layer {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 100%;
  display: flex; align-items: flex-end; justify-content: space-between;
  padding: 0 10%; box-sizing: border-box; pointer-events: none; z-index: 5;
}
.character-left, .character-right { height: 100%; max-width: 50%; display: flex; align-items: flex-end; }
.character-left img, .character-right img { height: 90%; max-height: 90vh; width: auto; object-fit: contain; filter: drop-shadow(0 10px 30px rgba(0,0,0,0.5)); }
.character-fade-enter-active, .character-fade-leave-active { transition: opacity 0.8s ease, transform 0.8s ease; }
.character-fade-enter-from, .character-fade-leave-to { opacity: 0; transform: translateY(20px); }

/* === [核心修改] 对话层样式 === */
#dialogue-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 25vh;

  /* 应用渐变背景变量 */
  background: var(--dialogue-bg);

  /* 增加毛玻璃效果：模糊背景，增加透明质感 */
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
  z-index: 10;
  padding-bottom: 20px;
  box-sizing: border-box;

  /* 顶部边框线调淡，配合渐变 */
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -5px 20px rgba(0,0,0,0.2); /* 顶部轻微阴影 */
}

#dialogue-layer.active {
  opacity: 1;
  transform: translateY(0);
}

/* 名字框容器 */
.speaker-wrapper {
  position: absolute;
  top: -36px;
  left: 10%;
  z-index: 15;
}

/* 名字框本体 */
.speaker-box {
  height: 36px;
  min-width: 140px;
  padding: 0 30px;
  background: var(--name-box-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: skewX(-25deg);
  transform-origin: bottom left;
  border-left: 2px solid rgba(255,255,255,0.2);
  box-shadow: 4px 4px 10px rgba(0,0,0,0.3);
}

/* 名字文字 */
.speaker-text {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  transform: skewX(25deg);
  text-shadow: 0 2px 2px rgba(0,0,0,0.5);
}

/* 文本容器 */
.text-container {
  width: 100%;
  padding: 0 10% 0 12%;
  box-sizing: border-box;
  margin-top: 15px;
}

/* 文本正文 */
#text-content {
  font-size: 1.2rem;
  line-height: 1.8;
  letter-spacing: 0.05rem;
  color: var(--text-color);
  font-weight: 500;
  text-align: left;
  /* 增强文字阴影，因为背景变透明了，文字需要更突出 */
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

/* 下一步指示器 */
.next-indicator {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.4);
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.4; }
  50% { transform: translateX(-50%) translateY(4px); opacity: 0.8; }
}

/* === 其他通用样式 === */
.loading-screen, .error-screen {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  background: #1a1a2e; color: #f0f0f0; z-index: 9999;
}
.loading-spinner {
  width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #a0b0c0;
  border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1.5rem;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 响应式微调 */
@media (max-width: 768px) {
  #dialogue-layer { height: 30vh; }
  .speaker-wrapper { left: 5%; top: -30px; }
  .speaker-box { height: 30px; min-width: 100px; padding: 0 20px; }
  .speaker-text { font-size: 0.9rem; }
  .text-container { padding: 0 5% 0 8%; }
  #text-content { font-size: 1rem; }
}
</style>
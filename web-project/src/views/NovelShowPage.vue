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
      @wheel="handleWheel"
      @contextmenu="handleContextMenu"
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
        @toggle-music="toggleBackgroundMusic"
        :music-playing="isMusicPlaying"
    />

    <SystemMenu
        :visible="showSystemMenu"
        :initialTab="systemMenuTab"
        :saves="localSaves"
        :music-volume="musicVolume"
        @close="handleMenuClose"
        @save-slot="saveToSlot"
        @load-slot="loadFromSlot"
        @update-music-volume="updateMusicVolume"
    />

    <HistoryPanel
        :visible="showHistoryPanel"
        :history-records="historyRecords"
        @close="closeHistoryPanel"
    />

    <div v-if="showDebugInfo" class="debug-info">
      <div>剧本: {{ scriptName }}</div>
      <div>场景: {{ currentSceneIndex }} / {{ storyScript.length }}</div>
      <div>进度: {{ progress }}%</div>
    </div>

    <!-- 音乐启动提示（仅在页面刷新时显示） -->
    <transition name="fade">
      <div v-if="currentBgMusic && !userInteracted && isPageRefresh" class="music-start-hint">
        <div class="hint-content">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 3v9.28l-4.47-4.47-1.41 1.42L12 15.11l5.88-5.88-1.41-1.42L12 12.28V3z"/>
          </svg>
          <span>点击页面开始音乐</span>
        </div>
      </div>
    </transition>

    <!-- 背景音乐音频元素 -->
    <audio
        ref="bgMusicRef"
        :src="currentBgMusic"
        loop
        preload="auto"
        @loadeddata="onMusicLoaded"
        @error="onMusicError"
        @ended="onMusicEnded"
        @canplaythrough="onMusicCanPlay"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import GameChoices from '@/components/visualNovel/GameChoices.vue';
import GameToolbar from '@/components/visualNovel/GameToolbar.vue';
import SystemMenu from '@/components/visualNovel/SystemMenu.vue';
import HistoryPanel from '@/components/visualNovel/HistoryPanel.vue';
import { useUserSession } from '@/composables/useUserSession';
import { gameSaveApi } from '@/api/gameSaveApi';
import { novelScriptApi } from '@/api/novelScriptApi';
import { miscMessageApi } from '@/api/miscMessageApi';

// 路由
const route = useRoute();
const router = useRouter();

// 用户会话
const userSession = useUserSession();

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/mongo';

// 剧本数据
const storyScript = ref([]);
const scriptId = ref(''); // 从路由参数获取
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

// 历史记录状态
const showHistoryPanel = ref(false);
const historyRecords = ref([]);

// 图片预加载状态
const preloadedImages = ref(new Set());
const preloadProgress = ref({ loaded: 0, total: 0 });

// 音乐预加载状态
const preloadedMusics = ref(new Set());
const musicPreloadProgress = ref({ loaded: 0, total: 0 });

// 继续游戏模式标记
const isContinueMode = ref(false);

// 背景音乐相关
const bgMusicRef = ref(null);
const currentBgMusic = ref('/public/bg/Aquaplus - 冬の街路樹.mp3'); // 当前背景音乐URL
const isMusicPlaying = ref(false);
const musicVolume = ref(0.5); // 默认音量 50%
const userInteracted = ref(false); // 标记用户是否已交互（用于解锁音频播放）
const isPageRefresh = ref(false); // 标记是否为页面刷新（而非路由导航）

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
  
  // 当进度达到100%时，无论是否已完成过，都应该跳转
  if (progress === 100) {
    // 如果尚未标记完成，先调用API标记完成
    if (!isScriptCompleted.value) {
      isScriptCompleted.value = true;
      console.log('🎉 剧本完成！');
      
      try {
        // 调用后端API标记剧本完成（这会计算解锁逻辑）
        const response = await novelScriptApi.markScriptCompleted(
          playerId.value,
          scriptId.value
        );
        
        if (response.success) {
          console.log('✅ 剧本完成状态已更新');
          console.log('🔓 已解锁的剧本列表:', response.data.unlockedScripts);
          console.log('🆕 新解锁的剧本:', response.data.newlyUnlocked);
          
          // 显示完成提示并跳转到章节选择页面
          await showCompletionNotification(response.data);
        }
      } catch (error) {
        console.error('❌ 更新剧本完成状态失败:', error);
        // 即使API调用失败，也应该跳转
        await showCompletionNotification({ 
          unlockedScripts: [], 
          newlyUnlocked: [] 
        });
      }
    } else {
      // 如果已经完成过，直接跳转（不调用API，避免重复标记）
      console.log('📚 重新阅读已完成的章节，跳转回章节选择页面');
      
      // 对于已完成的章节，直接跳转即可（不需要显示解锁信息，因为已经解锁过了）
      await showCompletionNotification({ 
        unlockedScripts: [], 
        newlyUnlocked: [] 
      });
    }
  }
};

// 显示完成提示并跳转
const showCompletionNotification = async (data) => {
  // 记录解锁信息到控制台
  console.log('🎉 恭喜完成《' + scriptName.value + '》！');
  if (data.unlockedScripts && data.unlockedScripts.length > 0) {
    console.log('📚 已解锁章节 (' + data.unlockedScripts.length + '个):', data.unlockedScripts.join(', '));
  }
  if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
    console.log('🔓 新解锁的章节 (' + data.newlyUnlocked.length + '个):', data.newlyUnlocked.join(', '));
  }
  
  // 确保用户身份已验证
  if (!userSession.identityVerified.value) {
    await userSession.verifyIdentity();
  }
  
  // 根据用户身份跳转到对应的章节选择页面
  const identity = userSession.userIdentity.value;
  console.log('🔍 当前用户身份:', identity);
  
  if (identity === 'day') {
    // 昼用户跳转到 ChapterSelectPage
    console.log('➡️ 跳转到章节选择页面 (Day)');
    router.push('/chapter-select');
  } else if (identity === 'night') {
    // 夜用户：在跳转前检测哪些消息应该显示
    console.log('🌙 Night 用户，检测消息显示状态...');
    await checkNightMessages(data);
    
    // 夜用户跳转到 TerminalChapterSelect
    console.log('➡️ 跳转到终端章节选择页面 (Night)');
    router.push('/terminal-chapter-select');
  } else {
    // 如果身份未确定，先验证身份再跳转
    console.warn('⚠️ 用户身份未确定，重新验证中...');
    const { identity: verifiedIdentity } = await userSession.verifyIdentity();
    if (verifiedIdentity === 'day') {
      console.log('➡️ 跳转到章节选择页面 (Day)');
      router.push('/chapter-select');
    } else if (verifiedIdentity === 'night') {
      // 夜用户：在跳转前检测哪些消息应该显示
      console.log('🌙 Night 用户，检测消息显示状态...');
      await checkNightMessages(data);
      
      console.log('➡️ 跳转到终端章节选择页面 (Night)');
      router.push('/terminal-chapter-select');
    } else {
      // 如果仍然无法确定，跳转到开始页面
      console.warn('⚠️ 无法确定用户身份，跳转到开始页面');
      router.push('/start');
    }
  }
};

// 检测 Night 用户的消息显示状态
const checkNightMessages = async (completionData) => {
  try {
    const completedChapterCount = completionData.unlockedScripts?.length || 0;
    console.log(`📊 当前已完成章节数: ${completedChapterCount}`);
    
    // 获取应该显示的消息（后端会根据章节范围、解锁条件等自动过滤）
    const response = await miscMessageApi.getTerminalMessages(playerId.value);
    
    if (response.success && response.data) {
      const messages = response.data;
      console.log(`📨 应该显示的消息数量: ${messages.length}`);
      
      // 分析消息显示状态
      const messagesByStatus = {
        shouldShow: [],
        shouldNotShow: []
      };
      
      messages.forEach(message => {
        const reasons = [];
        
        // 检查章节范围
        if (message.chapterRange) {
          const { startChapter, endChapter } = message.chapterRange;
          if (startChapter !== null && completedChapterCount < startChapter) {
            reasons.push(`未达到开始章节 (需要 ${startChapter}, 当前 ${completedChapterCount})`);
          }
          if (endChapter !== null && completedChapterCount > endChapter) {
            reasons.push(`已超过结束章节 (需要 <= ${endChapter}, 当前 ${completedChapterCount})`);
          }
        }
        
        // 检查解锁条件
        if (message.unlockConditions && message.unlockConditions.length > 0) {
          const missingConditions = message.unlockConditions.filter(
            scriptId => !completionData.unlockedScripts?.includes(scriptId)
          );
          if (missingConditions.length > 0) {
            reasons.push(`未完成解锁条件: ${missingConditions.join(', ')}`);
          }
        }
        
        // 检查接收状态（已操作的消息不会出现在列表中，所以这里主要是记录）
        if (message.receiveStatus === false) {
          reasons.push('用户已选择不接收');
        }
        
        const messageInfo = {
          topic: message.topic,
          sender: message.sender,
          reasons: reasons.length > 0 ? reasons : ['应该显示']
        };
        
        if (reasons.length > 0 && !reasons.includes('应该显示')) {
          messagesByStatus.shouldNotShow.push(messageInfo);
        } else {
          messagesByStatus.shouldShow.push(messageInfo);
        }
      });
      
      // 输出检测结果
      console.log('✅ 应该显示的消息:', messagesByStatus.shouldShow);
      if (messagesByStatus.shouldNotShow.length > 0) {
        console.log('❌ 不应该显示的消息:', messagesByStatus.shouldNotShow);
      }
      
      // 记录到控制台
      console.log(`📋 消息检测完成: ${messagesByStatus.shouldShow.length} 条应该显示, ${messagesByStatus.shouldNotShow.length} 条不应该显示`);
    } else {
      console.warn('⚠️ 获取消息失败或消息列表为空');
    }
  } catch (error) {
    console.error('❌ 检测 Night 消息失败:', error);
  }
};

// 处理点击事件
const handleInput = () => {
  const currentScene = storyScript.value[currentIndex.value];
  if (currentScene && currentScene.type === 'choice') {
    return;
  }
  
  // 用户首次交互，尝试播放音乐
  if (!userInteracted.value) {
    userInteracted.value = true;
    console.log('🔓 用户首次交互，解锁音频播放');
    
    // 如果有背景音乐且未在播放，尝试播放
    if (currentBgMusic.value && !isMusicPlaying.value && bgMusicRef.value) {
      setTimeout(() => {
        playBackgroundMusic();
      }, 100);
    }
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

  // 处理背景音乐切换（支持 bgMusic 和 bgm 字段，兼容旧数据）
  const sceneMusic = scene.bgMusic || scene.bgm;
  
  if (sceneMusic && sceneMusic.trim()) {
    // 如果场景指定了背景音乐，且与当前音乐不同，才切换
    const musicUrl = sceneMusic.trim();
    if (musicUrl !== currentBgMusic.value) {
      changeBackgroundMusic(musicUrl);
    }
    // 如果音乐相同，不进行任何操作，保持当前播放状态
  } else if (scene.bgMusic === null || scene.bgMusic === '' || scene.bgm === null || scene.bgm === '') {
    // 如果场景明确设置为空，停止音乐
    stopBackgroundMusic();
  }
  // 如果场景没有 bgMusic 或 bgm 字段，保持当前音乐不变

  if (scene.type === 'title') {
    titleText.value = scene.title;
    subTitleText.value = scene.subtitle || scene.sub || '';
  } else if (scene.type === 'text') {
    currentSpeaker.value = scene.speaker || '';
    currentText.value = scene.text;
    // 记录到历史
    addToHistory(scene.speaker || '', scene.text);
  } else if (scene.type === 'choice') {
    currentSpeaker.value = scene.speaker || '';
    currentText.value = scene.text || '请选择...';
    currentChoices.value = scene.choices || [];
    // 选择场景也记录到历史
    addToHistory(scene.speaker || '', scene.text || '请选择...');
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
  if (!scriptId.value) {
    loadError.value = '剧本ID不能为空';
    isLoading.value = false;
    return;
  }
  
  isLoading.value = true;
  loadError.value = '';
  try {
    console.log('📚 正在加载剧本:', scriptId.value);
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
      
      // 收集所有唯一的背景音乐 URL（去重）
      const uniqueMusics = new Set();
      scenes.forEach(scene => {
        // 支持 bgMusic 和 bgm 两个字段（兼容旧数据）
        const musicUrl = scene.bgMusic || scene.bgm;
        if (musicUrl && musicUrl.trim()) {
          uniqueMusics.add(musicUrl.trim());
        }
      });
      const allUniqueMusics = Array.from(uniqueMusics);
      
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
      
      // 优先加载前3首不同的背景音乐
      const priorityMusics = new Set();
      const maxPriorityMusics = 3;
      
      for (let i = 0; i < scenes.length && priorityMusics.size < maxPriorityMusics; i++) {
        const musicUrl = scenes[i]?.bgMusic || scenes[i]?.bgm;
        if (musicUrl && musicUrl.trim()) {
          priorityMusics.add(musicUrl.trim());
        }
      }
      const priorityMusicArray = Array.from(priorityMusics);
      
      // 设置加载进度，基于实际图片数量
      preloadProgress.value = { loaded: 0, total: allUniqueImages.length };
      musicPreloadProgress.value = { loaded: 0, total: allUniqueMusics.length };
      
      console.log(`📸 共发现 ${allUniqueImages.length} 张唯一背景图片`);
      console.log(`🎯 优先加载前 ${priorityImageArray.length} 张图片`);
      console.log(`🎵 共发现 ${allUniqueMusics.length} 首唯一背景音乐`);
      console.log(`🎯 优先加载前 ${priorityMusicArray.length} 首音乐`);
      
      try {
        await preloadImagesInBatch(priorityImageArray);
      } catch (error) { console.warn(error); }
      
      try {
        await preloadMusicsInBatch(priorityMusicArray);
      } catch (error) { console.warn(error); }

      if (scenes.length > 0) {
        currentIndex.value = 0;
        renderScene(scenes[0]);
        
        // 初始化背景音乐（从第一个场景获取，支持 bgMusic 和 bgm 字段）
        const firstSceneMusic = scenes[0]?.bgMusic || scenes[0]?.bgm;
        if (firstSceneMusic) {
          currentBgMusic.value = firstSceneMusic;
          console.log('🎵 背景音乐已设置:', currentBgMusic.value);
          
          if (isPageRefresh.value) {
            console.log('💡 提示：页面刷新，点击页面任意位置开始播放音乐');
          } else {
            console.log('🎯 通过路由导航进入，音乐将自动播放');
          }
          
          // 等待下一个 tick 确保音频元素已更新 src
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 如果不是页面刷新（通过路由导航进来），尝试自动播放
          if (!isPageRefresh.value && bgMusicRef.value) {
            if (preloadedMusics.value.has(firstSceneMusic)) {
              // 音乐已预加载，立即播放
              setTimeout(() => {
                playBackgroundMusic();
              }, 200);
            }
            // 否则等待 onMusicCanPlay 回调自动播放
          }
          // 如果是页面刷新，等待用户交互（见 handleInput 函数）
        }
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
      
      // 延迟加载剩余音乐
      const remainingMusics = allUniqueMusics.filter(
        music => !priorityMusics.has(music)
      );
      if (remainingMusics.length > 0) {
        console.log(`⏳ 准备延迟加载剩余 ${remainingMusics.length} 首音乐`);
        preloadRemainingMusicsOptimized(remainingMusics);
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

// === 音乐预加载函数 ===

/**
 * 预加载单个音乐文件
 */
const preloadMusic = (url) => {
  if (preloadedMusics.value.has(url)) return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';
    
    audio.addEventListener('canplaythrough', () => {
      preloadedMusics.value.add(url);
      musicPreloadProgress.value.loaded++;
      console.log(`✅ 音乐预加载完成: ${url}`);
      resolve(audio);
    }, { once: true });
    
    audio.addEventListener('error', () => {
      musicPreloadProgress.value.loaded++;
      console.warn(`⚠️ 音乐预加载失败: ${url}`);
      resolve(null); // 即使失败也 resolve，不阻塞流程
    }, { once: true });
    
    audio.src = url;
  });
};

/**
 * 批量预加载音乐
 */
const preloadMusicsInBatch = async (urls) => {
  const validUrls = urls.filter(url => url && !preloadedMusics.value.has(url));
  if (validUrls.length === 0) return;
  
  await Promise.all(validUrls.map(url => preloadMusic(url)));
};

/**
 * 优化后的延迟加载音乐函数
 */
const preloadRemainingMusicsOptimized = async (musicUrls) => {
  // 延迟1秒后开始加载，避免影响初始渲染
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 过滤掉已经加载的音乐
  const urlsToLoad = musicUrls.filter(url => !preloadedMusics.value.has(url));
  
  if (urlsToLoad.length === 0) {
    console.log('✅ 所有音乐已预加载完成');
    return;
  }
  
  console.log(`🔄 开始延迟加载 ${urlsToLoad.length} 首音乐`);
  
  // 分批加载，每批2首（音乐文件通常比图片大）
  const batchSize = 2;
  for (let i = 0; i < urlsToLoad.length; i += batchSize) {
    const batch = urlsToLoad.slice(i, i + batchSize);
    await preloadMusicsInBatch(batch);
    
    // 每批之间延迟800ms，避免过度占用带宽
    if (i + batchSize < urlsToLoad.length) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  
  console.log('✅ 所有背景音乐预加载完成');
};

const openSystemMenu = (tab) => {
  systemMenuTab.value = tab;
  showSystemMenu.value = true;
};

const showHistory = () => {
  openHistoryPanel();
};

// === 历史阅读功能 ===

/**
 * 添加对话到历史记录
 */
const addToHistory = (speaker, text) => {
  if (!text || text.trim() === '') return;
  
  historyRecords.value.push({
    speaker: speaker,
    text: text,
    timestamp: new Date().toISOString()
  });
  
  // 限制历史记录数量（最多保留200条）
  if (historyRecords.value.length > 200) {
    historyRecords.value.shift();
  }
};

/**
 * 显示历史面板
 */
const openHistoryPanel = () => {
  showHistoryPanel.value = true;
  console.log('📖 打开历史面板');
};

/**
 * 关闭历史面板
 */
const closeHistoryPanel = () => {
  showHistoryPanel.value = false;
  console.log('📖 关闭历史面板');
};

/**
 * 处理滚轮事件
 */
const handleWheel = (event) => {
  // 如果历史面板已经打开，不处理
  if (showHistoryPanel.value) return;
  
  // 如果菜单打开，不处理
  if (showSystemMenu.value) return;
  
  // 如果选择界面显示，不处理
  if (showChoice.value) return;
  
  // 向上滚动（deltaY < 0）时显示历史
  if (event.deltaY < 0) {
    event.preventDefault();
    openHistoryPanel();
  }
};

/**
 * 处理右键事件
 */
const handleContextMenu = (event) => {
  // 如果历史面板打开，右键关闭它
  if (showHistoryPanel.value) {
    event.preventDefault();
    closeHistoryPanel();
  }
  // 否则阻止默认右键菜单
  else {
    event.preventDefault();
  }
};

// 处理菜单关闭
const handleMenuClose = () => {
  // 如果是"继续游戏"模式且还没有加载剧本，返回上一页
  if (isContinueMode.value && !scriptId.value) {
    console.log('📂 继续游戏模式 - 返回初始界面');
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/start');
    }
  } else {
    // 正常模式，只关闭菜单
    showSystemMenu.value = false;
  }
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
      const saveData = response.data;
      
      // 如果当前没有加载剧本，或者存档的剧本与当前不同，需要先加载剧本
      if (!scriptId.value || saveData.scriptId !== scriptId.value) {
        console.log(`📚 需要加载存档对应的剧本: ${saveData.scriptId}`);
        scriptId.value = saveData.scriptId;
        isLoading.value = true;
        showSystemMenu.value = false; // 先关闭菜单
        isContinueMode.value = false; // 清除继续游戏模式标记
        
        await loadScript();
        
        // 剧本加载完成后，恢复存档状态
        loadSaveData(saveData);
        console.log(`✅ 从槽位 ${slot} 读档成功（含剧本加载）`);
      } else {
        // 剧本已加载，直接恢复状态
        loadSaveData(saveData);
        console.log(`✅ 从槽位 ${slot} 读档成功`);
        showSystemMenu.value = false; // 关闭菜单
        isContinueMode.value = false; // 清除继续游戏模式标记
      }
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
    playerName: userSession.userName.value || null, // 包含玩家名称
    musicVolume: musicVolume.value, // 保存音乐音量设置
    historyRecords: historyRecords.value, // 保存阅读历史
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
  historyRecords.value = saveData.historyRecords || [];
  
  // 恢复音乐设置
  if (saveData.musicVolume !== undefined) {
    musicVolume.value = saveData.musicVolume;
    if (bgMusicRef.value) {
      bgMusicRef.value.volume = musicVolume.value;
    }
  }
  
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

// === 背景音乐相关函数 ===

/**
 * 切换背景音乐播放/暂停
 */
const toggleBackgroundMusic = () => {
  if (!bgMusicRef.value || !currentBgMusic.value) {
    console.warn('⚠️ 没有可用的背景音乐');
    return;
  }
  
  if (isMusicPlaying.value) {
    pauseBackgroundMusic();
  } else {
    playBackgroundMusic();
  }
};

/**
 * 播放背景音乐
 */
const playBackgroundMusic = async () => {
  if (!bgMusicRef.value || !currentBgMusic.value) return;
  
  try {
    bgMusicRef.value.volume = musicVolume.value;
    await bgMusicRef.value.play();
    isMusicPlaying.value = true;
    console.log('🎵 背景音乐开始播放');
  } catch (error) {
    console.warn('⚠️ 背景音乐播放失败:', error);
    // 如果是自动播放被阻止，尝试静音播放
    if (error.name === 'NotAllowedError') {
      console.log('🔇 尝试静音播放...');
      bgMusicRef.value.muted = true;
      try {
        await bgMusicRef.value.play();
        bgMusicRef.value.muted = false;
        isMusicPlaying.value = true;
      } catch (e) {
        console.warn('⚠️ 静音播放也失败:', e);
      }
    }
  }
};

/**
 * 暂停背景音乐
 */
const pauseBackgroundMusic = () => {
  if (!bgMusicRef.value) return;
  
  bgMusicRef.value.pause();
  isMusicPlaying.value = false;
  console.log('⏸️ 背景音乐已暂停');
};

/**
 * 停止背景音乐
 */
const stopBackgroundMusic = () => {
  if (!bgMusicRef.value) return;
  
  bgMusicRef.value.pause();
  bgMusicRef.value.currentTime = 0;
  isMusicPlaying.value = false;
  console.log('⏹️ 背景音乐已停止');
};

/**
 * 切换背景音乐
 */
const changeBackgroundMusic = (newMusicUrl) => {
  if (!newMusicUrl || newMusicUrl === currentBgMusic.value) {
    return;
  }
  
  const wasPlaying = isMusicPlaying.value;
  
  // 停止当前音乐
  if (bgMusicRef.value && currentBgMusic.value) {
    stopBackgroundMusic();
  }
  
  // 切换到新音乐
  currentBgMusic.value = newMusicUrl;
  console.log('🎵 切换到新的背景音乐:', newMusicUrl);
  
  // 如果之前正在播放，自动播放新音乐
  if (wasPlaying && bgMusicRef.value) {
    // 等待音频加载后再播放
    bgMusicRef.value.addEventListener('loadeddata', () => {
      playBackgroundMusic();
    }, { once: true });
  }
};

/**
 * 更新音乐音量
 */
const updateMusicVolume = (newVolume) => {
  musicVolume.value = Math.max(0, Math.min(1, newVolume));
  if (bgMusicRef.value) {
    bgMusicRef.value.volume = musicVolume.value;
  }
  console.log(`🔊 音乐音量已更新: ${Math.round(musicVolume.value * 100)}%`);
};

/**
 * 音乐加载完成回调
 */
const onMusicLoaded = () => {
  console.log('✅ 背景音乐加载完成');
  if (bgMusicRef.value) {
    bgMusicRef.value.volume = musicVolume.value;
  }
};

/**
 * 音乐可以播放回调（数据已足够播放）
 */
const onMusicCanPlay = () => {
  console.log('🎵 背景音乐可以播放');
  
  // 如果不是页面刷新（即通过路由导航进来），自动播放
  if (!isPageRefresh.value && currentBgMusic.value && !isMusicPlaying.value && bgMusicRef.value) {
    console.log('🎯 路由导航进入，自动播放音乐');
    setTimeout(() => {
      playBackgroundMusic();
    }, 100);
    return;
  }
  
  // 如果是页面刷新，只有在用户已交互的情况下才播放
  if (userInteracted.value && currentBgMusic.value && !isMusicPlaying.value && bgMusicRef.value) {
    setTimeout(() => {
      playBackgroundMusic();
    }, 100);
  } else if (!userInteracted.value && isPageRefresh.value) {
    console.log('⏳ 页面刷新，等待用户交互后播放音乐');
  }
};

/**
 * 音乐加载错误回调
 */
const onMusicError = (error) => {
  console.error('❌ 背景音乐加载失败:', error);
  isMusicPlaying.value = false;
};

/**
 * 音乐播放结束回调
 */
const onMusicEnded = () => {
  // 由于设置了 loop，理论上不会触发，但保留以防万一
  console.log('🎵 背景音乐播放结束');
  isMusicPlaying.value = false;
};

/**
 * 检测导航类型（页面刷新 vs 其他访问方式）
 */
const checkNavigationType = () => {
  // 使用 Performance API 检测导航类型
  const perfEntries = performance.getEntriesByType('navigation');
  let navigationType = 'navigate';
  
  if (perfEntries.length > 0) {
    const navEntry = perfEntries[0];
    navigationType = navEntry.type; // 'navigate', 'reload', 'back_forward', 'prerender'
  }
  
  // 只有 reload 类型才是真正的页面刷新
  isPageRefresh.value = (navigationType === 'reload');
  
  console.log(`📍 导航类型: ${navigationType}, 判断为: ${isPageRefresh.value ? '⟳ 页面刷新' : '✓ 正常访问'}`);
  
  // 如果不是刷新，自动标记用户已交互（允许音乐自动播放）
  if (!isPageRefresh.value) {
    userInteracted.value = true;
    console.log('✅ 非刷新访问，自动标记为已交互，音乐将自动播放');
  } else {
    console.log('⏳ 页面刷新，需要用户点击后才能播放音乐');
  }
};

// 初始化函数
const initializePage = async () => {
  // 0. 检测是否为页面刷新还是路由导航
  checkNavigationType();
  
  // 1. 初始化用户会话
  await userSession.initSession('NovelShowPage');
  console.log('📌 NovelShowPage - 当前用户ID:', playerId.value);
  console.log("剧本ID" ,scriptId.value)
  
  // 2. 检查是否是"继续游戏"模式（直接打开存档菜单）
  const openMenuMode = route.query.openMenu;
  if (openMenuMode === 'load') {
    console.log('📂 继续游戏模式 - 打开存档菜单');
    isContinueMode.value = true; // 标记为继续游戏模式
    isLoading.value = false;
    // 先加载存档列表
    await loadSavesList();
    // 直接打开存档菜单（load 标签）
    systemMenuTab.value = 'load';
    showSystemMenu.value = true;
    return;
  }
  
  // 3. 处理路由参数 - scriptId 是必需的
  if (route.query.scriptId) {
    scriptId.value = route.query.scriptId;
    console.log('📖 从路由参数获取 scriptId:', scriptId.value);
  } else {
    // 如果没有提供 scriptId，显示错误
    isLoading.value = false;
    loadError.value = '未指定剧本ID，请从章节选择页面选择剧本';
    console.error('❌ 缺少必需的 scriptId 参数');
    return;
  }
  
  if (route.query.debug === 'true') showDebugInfo.value = true;
  if (route.query.startScene) currentIndex.value = parseInt(route.query.startScene) || 0;
  
  // 4. 加载剧本和存档
  await loadScript();
  await loadSavesList();
};

// 监听路由参数变化
watch(() => route.query.scriptId, async (newScriptId) => {
  if (newScriptId && newScriptId !== scriptId.value) {
    console.log('🔄 路由参数变化，重新加载剧本:', newScriptId);
    scriptId.value = newScriptId;
    // 重置状态
    isScriptCompleted.value = false;
    currentIndex.value = 0;
    choiceHistory.value = [];
    gameVariables.value = {};
    historyRecords.value = [];
    // 重新加载剧本
    await loadScript();
    await loadSavesList();
  }
});

onMounted(async () => {
  await initializePage();
  
  // 初始化音频元素
  if (bgMusicRef.value) {
    bgMusicRef.value.volume = musicVolume.value;
    // 设置音频元素的属性，允许自动播放
    bgMusicRef.value.autoplay = false; // 通过代码控制播放，而不是 autoplay 属性
  }
});

// 组件卸载时清理
onUnmounted(() => {
  // 停止背景音乐
  if (bgMusicRef.value) {
    stopBackgroundMusic();
  }
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
      rgba(12, 18, 26, 0.4) 0%,
      rgba(12, 18, 26, 0.7) 35%,
      rgba(12, 18, 26, 0.78) 100%
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
  justify-content: flex-start;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
  z-index: 10;
  padding-top: 20px;
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
  margin-top: 40px;
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

/* === 音乐启动提示样式 === */
.music-start-hint {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

.hint-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 0.9rem;
  font-family: var(--font-main);
  letter-spacing: 0.05em;
}

.hint-content svg {
  animation: bounce-down 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.02);
  }
}

@keyframes bounce-down {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(4px);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
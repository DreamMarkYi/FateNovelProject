import { ref, computed } from 'vue'
import { startChoiceApi } from '../api/startChoiceApi'

// 全局状态（单例模式）
const userId = ref(null)
const userName = ref(null)
const userStatus = ref('visitor')
const sessionLoaded = ref(false)

// LocalStorage 键名
const STORAGE_KEY_TOKEN = 'fate_novel_token'
const STORAGE_KEY_USER_ID = 'fate_novel_user_id'
const STORAGE_KEY_USER_NAME = 'fate_novel_user_name'

// 生成UUID的辅助函数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 用户会话管理 Composable
 * 提供跨页面的用户身份识别和管理
 */
export function useUserSession() {
  // 计算属性
  const isLoggedIn = computed(() => !!userId.value)
  const hasUserName = computed(() => !!userName.value)
  const isVisitor = computed(() => userStatus.value === 'visitor')
  const isRegistered = computed(() => userStatus.value === 'registered')

  /**
   * 初始化用户会话
   * 页面加载时调用
   */
  const initSession = async (sourcePage = 'Other') => {
    try {
      // 1. 从 localStorage 获取用户ID
      let storedUserId = localStorage.getItem(STORAGE_KEY_USER_ID)
      const storedUserName = localStorage.getItem(STORAGE_KEY_USER_NAME)
      
      if (!storedUserId) {
        // 生成新的UUID
        storedUserId = generateUUID()
        localStorage.setItem(STORAGE_KEY_USER_ID, storedUserId)
        console.log('✅ 新用户ID已生成:', storedUserId)
      }
      
      userId.value = storedUserId
      userName.value = storedUserName
      
      // 2. 自动初始化访客会话（后端记录）
      try {
        const response = await startChoiceApi.initVisitorSession(storedUserId)
        
        if (response.success) {
          console.log('✅ 访客会话已就绪:', response.data)
          
          // 保存 JWT Token
          if (response.data.token) {
            localStorage.setItem(STORAGE_KEY_TOKEN, response.data.token)
            console.log('✅ JWT Token 已保存')
          }
          
          // 如果后端返回的用户名和本地不一致，以后端为准
          if (response.data.playerName && !storedUserName) {
            userName.value = response.data.playerName
            localStorage.setItem(STORAGE_KEY_USER_NAME, response.data.playerName)
          }
        }
      } catch (error) {
        console.error('❌ 初始化访客会话失败:', error)
        // 即使失败也继续，使用本地数据
      }
      
      sessionLoaded.value = true
      console.log('📌 用户会话初始化完成:', {
        userId: userId.value,
        userName: userName.value,
        sourcePage
      })
    } catch (error) {
      console.error('❌ 初始化用户会话失败:', error)
      sessionLoaded.value = true
    }
  }

  /**
   * 设置用户名
   * 在用户输入名字后调用
   */
  const setUserName = (name) => {
    userName.value = name
    localStorage.setItem(STORAGE_KEY_USER_NAME, name)
    console.log('✅ 用户名已保存:', name)
  }

  /**
   * 清除用户会话（登出）
   */
  const clearSession = () => {
    userId.value = null
    userName.value = null
    userStatus.value = 'visitor'
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_USER_ID)
    localStorage.removeItem(STORAGE_KEY_USER_NAME)
    console.log('✅ 用户会话已清除')
  }

  /**
   * 重新生成用户ID（用于测试）
   */
  const regenerateUserId = () => {
    const newId = generateUUID()
    userId.value = newId
    localStorage.setItem(STORAGE_KEY_USER_ID, newId)
    console.log('✅ 用户ID已重新生成:', newId)
    return newId
  }

  return {
    // 状态
    userId,
    userName,
    userStatus,
    sessionLoaded,
    isLoggedIn,
    hasUserName,
    isVisitor,
    isRegistered,
    
    // 方法
    initSession,
    setUserName,
    clearSession,
    regenerateUserId
  }
}


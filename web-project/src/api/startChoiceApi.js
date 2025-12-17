import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const API_PREFIX = '/api/mongo/start-choices'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 自动添加 JWT Token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('fate_novel_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    if (error.response?.status === 401) {
      // Token 过期或无效
      localStorage.removeItem('fate_novel_token')
      console.warn('Token 已过期，请重新登录')
    }
    return Promise.reject(error)
  }
)

/**
 * Start Choice API 服务
 */
export const startChoiceApi = {
  /**
   * 检查是否首次访问
   * @param {string} playerId - 玩家ID（可选）
   * @returns {Promise<{isFirstTime: boolean, shouldShowStartPage: boolean}>}
   */
  async checkFirstTimeVisitor(playerId = null) {
    const params = playerId ? { playerId } : {}
    const response = await api.get(`${API_PREFIX}/check-first-visit`, { params })
    return response
  },

  /**
   * 初始化访客会话
   * @param {string} playerId - 玩家ID（可选）
   * @returns {Promise<Object>}
   */
  async initVisitorSession(playerId = null) {
    const response = await api.post(`${API_PREFIX}/init-session`, {
      playerId
    })
    return response
  },

  /**
   * 统一的完成StartPage方法
   * @param {string} playerId - 玩家ID
   * @param {string} playerName - 玩家名字（可选，为null表示不输入名字）
   * @param {string} identityChoice - 身份选择 ('named' 或 'skipped')
   * @returns {Promise<Object>}
   */
  async completeStartPage(playerId, playerName = null, identityChoice = null) {
    const response = await api.post(`${API_PREFIX}/complete-start-page`, {
      playerId,
      playerName,
      identityChoice
    })
    return response
  },

  /**
   * 创建新玩家（保留兼容性）
   * @param {string} playerName - 玩家名字
   * @param {string} identityChoice - 身份选择 ('named' 或 'skipped')
   * @param {string} playerId - 玩家ID（可选）
   * @returns {Promise<{playerId: string, playerName: string, recordId: string}>}
   */
  async createPlayer(playerName, identityChoice, playerId = null) {
    const response = await api.post(`${API_PREFIX}/create-player`, {
      playerName,
      identityChoice,
      playerId
    })
    return response.data
  },

  /**
   * 记录用户选择
   * @param {string} playerId - 玩家ID
   * @param {number} sceneId - 场景ID
   * @param {string} choiceText - 选择文本
   * @param {number} score - 分数
   * @returns {Promise<{currentScore: number, choiceCount: number}>}
   */
  async recordChoice(playerId, sceneId, choiceText, score) {
    const response = await api.post(`${API_PREFIX}/player/${playerId}/choice`, {
      sceneId,
      choiceText,
      score
    })
    return response.data
  },

  /**
   * 完成游戏
   * @param {string} playerId - 玩家ID
   * @param {number} endingId - 结局ID
   * @param {number} playTime - 游戏时长（秒）
   * @returns {Promise<{finalScore: number, finalResult: string, endingId: number}>}
   */
  async completeGame(playerId, endingId, playTime) {
    const response = await api.post(`${API_PREFIX}/player/${playerId}/complete`, {
      endingId,
      playTime
    })
    return response.data
  },

  /**
   * 获取玩家记录
   * @param {string} playerId - 玩家ID
   * @returns {Promise<Object>}
   */
  async getPlayerRecord(playerId) {
    const response = await api.get(`${API_PREFIX}/player/${playerId}`)
    return response.data
  },

  /**
   * 获取统计数据
   * @returns {Promise<{total: number, day: number, night: number, dayPercentage: string, nightPercentage: string}>}
   */
  async getStatistics() {
    const response = await api.get(`${API_PREFIX}/statistics`)
    return response.data
  },

  /**
   * 获取特定场景的选择统计
   * @param {number} sceneId - 场景ID
   * @returns {Promise<{sceneId: number, choices: Array}>}
   */
  async getChoiceStatistics(sceneId) {
    const response = await api.get(`${API_PREFIX}/scene/${sceneId}/statistics`)
    return response.data
  },

  /**
   * 获取激活的剧本
   * @returns {Promise<Object>}
   */
  async getActiveScript() {
    const response = await api.get('/api/mongo/start-page-script/active')
    return response.data
  },

  /**
   * 根据分数计算结局
   * @param {number} score - 当前分数
   * @returns {Promise<{endingId: number, endingType: string, sceneId: number, scene: Object}>}
   */
  async calculateEnding(score) {
    const response = await api.post('/api/mongo/start-page-script/calculate-ending', {
      score
    })
    return response.data
  },

  /**
   * 检查名称是否已存在
   * @param {string} playerName - 玩家名称
   * @returns {Promise<{exists: boolean, playerInfo?: Object}>}
   */
  async checkNameExists(playerName) {
    const response = await api.get(`${API_PREFIX}/check-name`, {
      params: { playerName }
    })
    return response
  },

  /**
   * 使用已存在的玩家身份登录
   * @param {string} existingPlayerId - 已存在的玩家ID
   * @param {string} currentUserId - 当前会话的用户ID
   * @returns {Promise<Object>}
   */
  async loginAsExistingPlayer(existingPlayerId, currentUserId) {
    const response = await api.post(`${API_PREFIX}/login-existing`, {
      existingPlayerId,
      currentUserId
    })
    return response
  },

  /**
   * 获取用户身份（安全版本，用于路由验证）
   * @param {string} playerId - 玩家ID
   * @returns {Promise<{identity: string|null, hasCompletedStartPage: boolean, playerName: string|null}>}
   */
  async getUserIdentity(playerId) {
    const response = await api.get(`${API_PREFIX}/user-identity`, {
      params: { playerId }
    })
    return response
  }
}

export default startChoiceApi


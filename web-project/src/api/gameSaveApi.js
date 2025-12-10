import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const API_PREFIX = '/api/mongo/game-saves'

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
    console.error('Game Save API Error:', error)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Token 已过期或无效')
    }
    return Promise.reject(error)
  }
)

/**
 * Game Save API 服务
 */
export const gameSaveApi = {
  /**
   * 获取玩家的所有存档
   * @param {string} playerId - 玩家ID
   * @param {object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getPlayerSaves(playerId, options = {}) {
    const params = {
      includeAuto: options.includeAuto !== false,
      includeQuick: options.includeQuick !== false
    }
    const response = await api.get(`${API_PREFIX}/player/${playerId}`, { params })
    return response
  },

  /**
   * 获取特定存档槽位
   * @param {string} playerId - 玩家ID
   * @param {number} saveSlot - 存档槽位
   * @returns {Promise<Object>}
   */
  async getSaveBySlot(playerId, saveSlot) {
    const response = await api.get(`${API_PREFIX}/player/${playerId}/slot/${saveSlot}`)
    return response
  },

  /**
   * 获取最新的自动存档
   * @param {string} playerId - 玩家ID
   * @returns {Promise<Object>}
   */
  async getLatestAutoSave(playerId) {
    const response = await api.get(`${API_PREFIX}/player/${playerId}/autosave`)
    return response
  },

  /**
   * 获取快速存档
   * @param {string} playerId - 玩家ID
   * @returns {Promise<Object>}
   */
  async getQuickSave(playerId) {
    const response = await api.get(`${API_PREFIX}/player/${playerId}/quicksave`)
    return response
  },

  /**
   * 创建或更新存档
   * @param {string} playerId - 玩家ID
   * @param {number} saveSlot - 存档槽位
   * @param {object} saveData - 存档数据
   * @returns {Promise<Object>}
   */
  async saveGame(playerId, saveSlot, saveData) {
    const response = await api.put(`${API_PREFIX}/player/${playerId}/slot/${saveSlot}`, saveData)
    return response
  },

  /**
   * 快速存档
   * @param {string} playerId - 玩家ID
   * @param {object} saveData - 存档数据
   * @returns {Promise<Object>}
   */
  async quickSave(playerId, saveData) {
    const response = await api.post(`${API_PREFIX}/player/${playerId}/quicksave`, saveData)
    return response
  },

  /**
   * 自动存档
   * @param {string} playerId - 玩家ID
   * @param {object} saveData - 存档数据
   * @returns {Promise<Object>}
   */
  async autoSave(playerId, saveData) {
    const response = await api.post(`${API_PREFIX}/player/${playerId}/autosave`, saveData)
    return response
  },

  /**
   * 删除存档
   * @param {string} playerId - 玩家ID
   * @param {number} saveSlot - 存档槽位
   * @returns {Promise<Object>}
   */
  async deleteSave(playerId, saveSlot) {
    const response = await api.delete(`${API_PREFIX}/player/${playerId}/slot/${saveSlot}`)
    return response
  },

  /**
   * 检查场景是否已读
   * @param {string} playerId - 玩家ID
   * @param {string} scriptId - 剧本ID
   * @param {number} sceneIndex - 场景索引
   * @returns {Promise<Object>}
   */
  async checkSceneRead(playerId, scriptId, sceneIndex) {
    const response = await api.get(`${API_PREFIX}/player/${playerId}/script/${scriptId}/scene/${sceneIndex}/read`)
    return response
  },

  /**
   * 更新游戏时长
   * @param {string} playerId - 玩家ID
   * @param {number} saveSlot - 存档槽位
   * @param {number} additionalTime - 增加的时长（秒）
   * @returns {Promise<Object>}
   */
  async updatePlayTime(playerId, saveSlot, additionalTime) {
    const response = await api.patch(`${API_PREFIX}/player/${playerId}/slot/${saveSlot}/playtime`, {
      additionalTime
    })
    return response
  }
}


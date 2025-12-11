import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const API_PREFIX = '/api/mongo/novel-scripts'

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
    console.error('Novel Script API Error:', error)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Token 已过期或无效')
    }
    return Promise.reject(error)
  }
)

/**
 * Novel Script API 服务
 */
export const novelScriptApi = {
  /**
   * 获取章节选择页面的剧本节点列表（带解锁状态判断）
   * @param {string} playerId - 玩家ID
   * @returns {Promise<Object>}
   */
  async getChapterNodes(playerId) {
    const response = await api.get(`${API_PREFIX}/chapter-nodes`, {
      params: { playerId }
    })
    return response
  },

  /**
   * 获取所有剧本
   * @param {object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getAllScripts(options = {}) {
    const params = {
      page: options.page || 1,
      limit: options.limit || 20,
      activeOnly: options.activeOnly !== false
    }
    const response = await api.get(API_PREFIX, { params })
    return response
  },

  /**
   * 根据剧本ID获取完整剧本
   * @param {string} scriptId - 剧本ID
   * @returns {Promise<Object>}
   */
  async getScriptById(scriptId) {
    const response = await api.get(`${API_PREFIX}/${scriptId}`)
    return response
  },

  /**
   * 获取剧本的特定场景
   * @param {string} scriptId - 剧本ID
   * @param {number} sceneIndex - 场景索引
   * @returns {Promise<Object>}
   */
  async getSceneByIndex(scriptId, sceneIndex) {
    const response = await api.get(`${API_PREFIX}/${scriptId}/scene/${sceneIndex}`)
    return response
  },

  /**
   * 获取剧本的场景范围（分段加载）
   * @param {string} scriptId - 剧本ID
   * @param {number} start - 开始索引
   * @param {number} end - 结束索引
   * @returns {Promise<Object>}
   */
  async getSceneRange(scriptId, start, end) {
    const response = await api.get(`${API_PREFIX}/${scriptId}/scenes/range`, {
      params: { start, end }
    })
    return response
  },

  /**
   * 根据标签搜索场景
   * @param {string} scriptId - 剧本ID
   * @param {string} tag - 标签
   * @returns {Promise<Object>}
   */
  async getScenesByTag(scriptId, tag) {
    const response = await api.get(`${API_PREFIX}/${scriptId}/scenes/tag/${tag}`)
    return response
  },

  /**
   * 创建新剧本
   * @param {object} scriptData - 剧本数据
   * @returns {Promise<Object>}
   */
  async createScript(scriptData) {
    const response = await api.post(API_PREFIX, scriptData)
    return response
  },

  /**
   * 更新剧本
   * @param {string} scriptId - 剧本ID
   * @param {object} updates - 更新数据
   * @returns {Promise<Object>}
   */
  async updateScript(scriptId, updates) {
    const response = await api.put(`${API_PREFIX}/${scriptId}`, updates)
    return response
  },

  /**
   * 添加场景到剧本
   * @param {string} scriptId - 剧本ID
   * @param {object} sceneData - 场景数据
   * @returns {Promise<Object>}
   */
  async addScene(scriptId, sceneData) {
    const response = await api.post(`${API_PREFIX}/${scriptId}/scenes`, sceneData)
    return response
  },

  /**
   * 更新特定场景
   * @param {string} scriptId - 剧本ID
   * @param {number} sceneIndex - 场景索引
   * @param {object} updates - 更新数据
   * @returns {Promise<Object>}
   */
  async updateScene(scriptId, sceneIndex, updates) {
    const response = await api.put(`${API_PREFIX}/${scriptId}/scene/${sceneIndex}`, updates)
    return response
  },

  /**
   * 删除特定场景
   * @param {string} scriptId - 剧本ID
   * @param {number} sceneIndex - 场景索引
   * @returns {Promise<Object>}
   */
  async deleteScene(scriptId, sceneIndex) {
    const response = await api.delete(`${API_PREFIX}/${scriptId}/scene/${sceneIndex}`)
    return response
  },

  /**
   * 删除剧本
   * @param {string} scriptId - 剧本ID
   * @returns {Promise<Object>}
   */
  async deleteScript(scriptId) {
    const response = await api.delete(`${API_PREFIX}/${scriptId}`)
    return response
  },

  /**
   * 切换剧本激活状态
   * @param {string} scriptId - 剧本ID
   * @returns {Promise<Object>}
   */
  async toggleScriptStatus(scriptId) {
    const response = await api.patch(`${API_PREFIX}/${scriptId}/toggle`)
    return response
  },

  /**
   * 标记剧本完成并更新解锁状态
   * @param {string} playerId - 玩家ID
   * @param {string} scriptId - 剧本ID
   * @returns {Promise<Object>}
   */
  async markScriptCompleted(playerId, scriptId) {
    const response = await api.post(`${API_PREFIX}/mark-completed`, {
      playerId,
      scriptId
    })
    return response
  },

  /**
   * 检查剧本是否已完成
   * @param {string} playerId - 玩家ID
   * @param {string} scriptId - 剧本ID
   * @returns {Promise<Object>}
   */
  async checkScriptCompletion(playerId, scriptId) {
    const response = await api.get(`${API_PREFIX}/check-completion`, {
      params: { playerId, scriptId }
    })
    return response
  },

  /**
   * 批量更新节点位置
   * @param {Array} nodes - 节点数组，每个节点包含 id, worldPosition, name, locked, connectNode
   * @returns {Promise<Object>}
   */
  async updateNodePositions(nodes) {
    const response = await api.put(`${API_PREFIX}/batch/update-positions`, {
      nodes
    })
    return response
  }
}


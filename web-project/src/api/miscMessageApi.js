import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const API_PREFIX = '/api/mongo/misc-messages'

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
    console.error('Misc Message API Error:', error)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Token 已过期或无效')
    }
    return Promise.reject(error)
  }
)

/**
 * 杂项消息 API 服务
 */
export const miscMessageApi = {
  /**
   * 获取终端页面右侧消息列表（根据用户身份和解锁条件过滤）
   * @param {string} playerId - 玩家ID
   * @returns {Promise<Object>}
   */
  async getTerminalMessages(playerId) {
    const response = await api.get(`${API_PREFIX}/terminal-messages`, {
      params: { playerId }
    })
    return response
  },

  /**
   * 获取所有消息（管理员用）
   * @param {object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async getAllMessages(options = {}) {
    const params = {
      page: options.page || 1,
      limit: options.limit || 50,
      activeOnly: options.activeOnly !== false
    }
    const response = await api.get(API_PREFIX, { params })
    return response
  },

  /**
   * 创建新消息
   * @param {object} messageData - 消息数据
   * @returns {Promise<Object>}
   */
  async createMessage(messageData) {
    const response = await api.post(API_PREFIX, messageData)
    return response
  },

  /**
   * 更新消息
   * @param {string} id - 消息ID
   * @param {object} updates - 更新数据
   * @returns {Promise<Object>}
   */
  async updateMessage(id, updates) {
    const response = await api.put(`${API_PREFIX}/${id}`, updates)
    return response
  },

  /**
   * 删除消息
   * @param {string} id - 消息ID
   * @returns {Promise<Object>}
   */
  async deleteMessage(id) {
    const response = await api.delete(`${API_PREFIX}/${id}`)
    return response
  },

  /**
   * 标记消息为已读
   * @param {string} id - 消息ID
   * @returns {Promise<Object>}
   */
  async markAsRead(id) {
    const response = await api.patch(`${API_PREFIX}/${id}/read`)
    return response
  },

  /**
   * 批量创建消息
   * @param {Array} messages - 消息数组
   * @returns {Promise<Object>}
   */
  async batchCreateMessages(messages) {
    const response = await api.post(`${API_PREFIX}/batch`, { messages })
    return response
  }
}


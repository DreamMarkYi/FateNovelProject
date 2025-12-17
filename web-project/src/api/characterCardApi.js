import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const API_PREFIX = '/api/mongo/character-cards'

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
 * Character Card API 服务
 */
export const characterCardApi = {
  /**
   * 获取所有角色卡片
   * @param {Object} params - 查询参数 { unlocked, sortBy }
   * @returns {Promise<Array>}
   */
  async getAllCards(params = {}) {
    const response = await api.get(API_PREFIX, { params })
    return response.data || []
  },

  /**
   * 根据ID获取角色卡片
   * @param {string} id - 卡片ID
   * @returns {Promise<Object>}
   */
  async getCardById(id) {
    const response = await api.get(`${API_PREFIX}/${id}`)
    return response.data
  },

  /**
   * 根据索引获取角色卡片
   * @param {number} index - 卡片索引
   * @returns {Promise<Object>}
   */
  async getCardByIndex(index) {
    const response = await api.get(`${API_PREFIX}/index/${index}`)
    return response.data
  },

  /**
   * 创建新角色卡片
   * @param {Object} cardData - 卡片数据
   * @returns {Promise<Object>}
   */
  async createCard(cardData) {
    const response = await api.post(API_PREFIX, cardData)
    return response.data
  },

  /**
   * 批量创建角色卡片
   * @param {Array} cards - 卡片数组
   * @returns {Promise<Array>}
   */
  async createCards(cards) {
    const response = await api.post(`${API_PREFIX}/batch`, { cards })
    return response.data || []
  },

  /**
   * 更新角色卡片
   * @param {string} id - 卡片ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>}
   */
  async updateCard(id, updates) {
    const response = await api.put(`${API_PREFIX}/${id}`, updates)
    return response.data
  },

  /**
   * 删除角色卡片
   * @param {string} id - 卡片ID
   * @returns {Promise<Object>}
   */
  async deleteCard(id) {
    const response = await api.delete(`${API_PREFIX}/${id}`)
    return response
  },

  /**
   * 更新解锁状态
   * @param {string} id - 卡片ID
   * @param {boolean} unlocked - 是否解锁
   * @returns {Promise<Object>}
   */
  async updateUnlockStatus(id, unlocked) {
    const response = await api.patch(`${API_PREFIX}/${id}/unlock`, { unlocked })
    return response.data
  }
}

export default characterCardApi




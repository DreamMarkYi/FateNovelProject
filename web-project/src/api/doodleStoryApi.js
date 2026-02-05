import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const API_PREFIX = '/api/mongo/doodle-stories'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 自动添加 JWT Token（如果需要）
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
 * Doodle Story API 服务
 */
export const doodleStoryApi = {
  /**
   * 获取所有涂鸦故事
   * @param {Object} params - 查询参数 (page, limit)
   * @returns {Promise<{success: boolean, data: Array, pagination: Object}>}
   */
  async getAllDoodleStories(params = {}) {
    const response = await api.get(API_PREFIX, { params })
    return response
  },

  /**
   * 获取激活的涂鸦故事
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getActiveDoodleStories() {
    const response = await api.get(`${API_PREFIX}/active`)
    return response
  },

  /**
   * 根据ID获取涂鸦故事
   * @param {string} id - 故事ID
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async getDoodleStoryById(id) {
    const response = await api.get(`${API_PREFIX}/${id}`)
    return response
  },

  /**
   * 创建新的涂鸦故事
   * @param {Object} storyData - 故事数据
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async createDoodleStory(storyData) {
    const response = await api.post(API_PREFIX, storyData)
    return response
  },

  /**
   * 批量创建涂鸦故事
   * @param {Array} storiesData - 故事数据数组
   * @returns {Promise<{success: boolean, message: string, data: Array}>}
   */
  async createMultipleDoodleStories(storiesData) {
    const response = await api.post(`${API_PREFIX}/batch`, { stories: storiesData })
    return response
  },

  /**
   * 更新涂鸦故事
   * @param {string} id - 故事ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async updateDoodleStory(id, updates) {
    const response = await api.put(`${API_PREFIX}/${id}`, updates)
    return response
  },

  /**
   * 删除涂鸦故事
   * @param {string} id - 故事ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteDoodleStory(id) {
    const response = await api.delete(`${API_PREFIX}/${id}`)
    return response
  },

  /**
   * 切换故事激活状态
   * @param {string} id - 故事ID
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async toggleDoodleStoryStatus(id) {
    const response = await api.patch(`${API_PREFIX}/${id}/toggle`)
    return response
  }
}

export default doodleStoryApi































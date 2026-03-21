import axios from 'axios'

const isProd = import.meta.env.PROD
const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim()
// 生产环境默认走同源反向代理，避免依赖 localhost
const API_BASE_URL = envBaseUrl || (isProd ? '' : 'http://localhost:3000')
const API_PREFIX = '/api/portfolio'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => {
    const payload = response?.data
    const isObjectPayload = payload !== null && typeof payload === 'object' && !Array.isArray(payload)

    // 统一校验 portfolio 后端响应结构，避免 HTML 等非 JSON 响应被静默当成空数据
    if (!isObjectPayload) {
      const requestUrl = `${response?.config?.baseURL || ''}${response?.config?.url || ''}`
      throw new Error(`Invalid portfolio API response from ${requestUrl}`)
    }

    if (payload.success === false) {
      throw new Error(payload.message || 'Portfolio API request failed')
    }

    return payload
  },
  (error) => {
    console.error('Portfolio API Error:', error)
    return Promise.reject(error)
  }
)

export const portfolioArticleApi = {
  async getDisplayConfig() {
    return api.get(`${API_PREFIX}/config`)
  },

  async listArticles() {
    return api.get(`${API_PREFIX}/articles`)
  },

  async getNovelConfig() {
    return api.get(`${API_PREFIX}/novel`)
  },

  async generateNovelAccessNameHashes(names = []) {
    return api.post(`${API_PREFIX}/novel/access/hash`, { names })
  },

  async listNovelChapters() {
    return api.get(`${API_PREFIX}/novel/chapters`)
  },

  async verifyNovelChapterAccess(id, guardianName) {
    const normalizedName = String(guardianName || '').trim()
    return api.post(`${API_PREFIX}/novel/chapters/${id}/access`, {
      guardianName: normalizedName,
      accessName: normalizedName,
      name: normalizedName,
    })
  },

  async getNovelChapterById(id, accessToken = '') {
    const token = String(accessToken || '').trim()
    return api.get(`${API_PREFIX}/novel/chapters/${id}`, {
      headers: token ? { 'x-novel-access-token': token } : {},
    })
  },

  async getArticleById(id) {
    return api.get(`${API_PREFIX}/articles/${id}`)
  },

  async listMemos() {
    return api.get(`${API_PREFIX}/memos`)
  },

  async verifyMemoAccess(accessName) {
    const normalizedName = String(accessName || '').trim()
    return api.post(`${API_PREFIX}/memos/access`, {
      accessName: normalizedName,
      guardianName: normalizedName,
      name: normalizedName,
    })
  },

  async saveMemo(payload, accessToken = '') {
    const token = String(accessToken || '').trim()
    return api.post(`${API_PREFIX}/memos`, payload, {
      headers: token ? { 'x-portfolio-memo-access-token': token } : {},
    })
  },

  /** 仅开发环境后端接受；用于置顶 */
  async updateMemoDevFlags(id, payload) {
    const safeId = String(id || '').trim()
    return api.patch(`${API_PREFIX}/memos/${encodeURIComponent(safeId)}`, payload)
  },

  async saveArticle(payload) {
    return api.post(`${API_PREFIX}/articles`, payload)
  },

  async saveNovelConfig(payload) {
    return api.post(`${API_PREFIX}/novel`, payload)
  },

  async saveNovelChapter(payload) {
    return api.post(`${API_PREFIX}/novel/chapters`, payload)
  },
}

export default portfolioArticleApi

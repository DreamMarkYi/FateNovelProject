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
  (response) => response.data,
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
    return api.post(`${API_PREFIX}/novel/chapters/${id}/access`, { guardianName })
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
    return api.post(`${API_PREFIX}/memos/access`, { accessName })
  },

  async saveMemo(payload, accessToken = '') {
    const token = String(accessToken || '').trim()
    return api.post(`${API_PREFIX}/memos`, payload, {
      headers: token ? { 'x-portfolio-memo-access-token': token } : {},
    })
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

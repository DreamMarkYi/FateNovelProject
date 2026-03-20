import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
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

  async listNovelChapters() {
    return api.get(`${API_PREFIX}/novel/chapters`)
  },

  async getNovelChapterById(id) {
    return api.get(`${API_PREFIX}/novel/chapters/${id}`)
  },

  async getArticleById(id) {
    return api.get(`${API_PREFIX}/articles/${id}`)
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

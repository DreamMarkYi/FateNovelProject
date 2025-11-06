// MongoDB API配置
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// MongoDB API前缀
const MONGO_API_PREFIX = '/api/mongo'

// 小说API
export const novelApi = {
  // 获取所有小说
  getAllNovels: (params = {}) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/novels`, { params })
  },
  
  // 获取已发布的小说
  getPublishedNovels: (params = {}) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/novels/published`, { params })
  },
  
  // 根据ID获取小说
  getNovelById: (id) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/novels/${id}`)
  },
  
  // 创建小说
  createNovel: (data) => {
    return axios.post(`${API_BASE_URL}${MONGO_API_PREFIX}/novels`, data)
  },
  
  // 更新小说
  updateNovel: (id, data) => {
    return axios.put(`${API_BASE_URL}${MONGO_API_PREFIX}/novels/${id}`, data)
  },
  
  // 删除小说
  deleteNovel: (id) => {
    return axios.delete(`${API_BASE_URL}${MONGO_API_PREFIX}/novels/${id}`)
  },
  
  // 点赞小说
  likeNovel: (id) => {
    return axios.post(`${API_BASE_URL}${MONGO_API_PREFIX}/novels/${id}/like`)
  }
}

// 章节API
export const chapterApi = {
  // 获取小说的所有章节
  getChaptersByNovel: (novelId, params = {}) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/chapters/novel/${novelId}`, { params })
  },
  
  // 根据章节号获取章节
  getChapterByNumber: (novelId, chapterNumber) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/chapters/novel/${novelId}/number/${chapterNumber}`)
  },
  
  // 根据ID获取章节
  getChapterById: (id) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/chapters/${id}`)
  },
  
  // 创建章节
  createChapter: (data) => {
    return axios.post(`${API_BASE_URL}${MONGO_API_PREFIX}/chapters`, data)
  },
  
  // 批量创建章节
  batchCreateChapters: (data) => {
    return axios.post(`${API_BASE_URL}${MONGO_API_PREFIX}/chapters/batch`, data)
  },
  
  // 更新章节
  updateChapter: (id, data) => {
    return axios.put(`${API_BASE_URL}${MONGO_API_PREFIX}/chapters/${id}`, data)
  },
  
  // 删除章节
  deleteChapter: (id) => {
    return axios.delete(`${API_BASE_URL}${MONGO_API_PREFIX}/chapters/${id}`)
  }
}

// 故事章节API
export const storySectionApi = {
  // 获取所有故事章节
  getAllStorySections: () => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/story-sections`)
  },
  
  // 获取激活的故事章节
  getActiveStorySections: () => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/story-sections/active`)
  },
  
  // 根据ID获取故事章节
  getStorySectionById: (id) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/story-sections/${id}`)
  },
  
  // 创建故事章节
  createStorySection: (data) => {
    return axios.post(`${API_BASE_URL}${MONGO_API_PREFIX}/story-sections`, data)
  },
  
  // 更新故事章节
  updateStorySection: (id, data) => {
    return axios.put(`${API_BASE_URL}${MONGO_API_PREFIX}/story-sections/${id}`, data)
  },
  
  // 删除故事章节
  deleteStorySection: (id) => {
    return axios.delete(`${API_BASE_URL}${MONGO_API_PREFIX}/story-sections/${id}`)
  }
}

// 房间API
export const roomApi = {
  // 获取所有房间
  getAllRooms: () => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/rooms`)
  },
  
  // 获取可用的房间
  getAvailableRooms: () => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/rooms/available`)
  },
  
  // 根据ID获取房间
  getRoomById: (id) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/rooms/${id}`)
  },
  
  // 创建房间
  createRoom: (data) => {
    return axios.post(`${API_BASE_URL}${MONGO_API_PREFIX}/rooms`, data)
  },
  
  // 更新房间
  updateRoom: (id, data) => {
    return axios.put(`${API_BASE_URL}${MONGO_API_PREFIX}/rooms/${id}`, data)
  },
  
  // 删除房间
  deleteRoom: (id) => {
    return axios.delete(`${API_BASE_URL}${MONGO_API_PREFIX}/rooms/${id}`)
  }
}

// 概念API
export const conceptApi = {
  // 获取所有概念
  getAllConcepts: () => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/concepts`)
  },
  
  // 获取激活的概念
  getActiveConcepts: () => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/concepts/active`)
  },
  
  // 根据ID获取概念
  getConceptById: (id) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/concepts/${id}`)
  },
  
  // 创建概念
  createConcept: (data) => {
    return axios.post(`${API_BASE_URL}${MONGO_API_PREFIX}/concepts`, data)
  },
  
  // 更新概念
  updateConcept: (id, data) => {
    return axios.put(`${API_BASE_URL}${MONGO_API_PREFIX}/concepts/${id}`, data)
  },
  
  // 删除概念
  deleteConcept: (id) => {
    return axios.delete(`${API_BASE_URL}${MONGO_API_PREFIX}/concepts/${id}`)
  }
}

// Sowaka故事API
export const sowakaStoryApi = {
  // 获取所有Sowaka故事
  getAllSowakaStories: (params = {}) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/sowaka-stories`, { params })
  },
  
  // 获取激活的Sowaka故事
  getActiveSowakaStories: () => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/sowaka-stories/active`)
  },
  
  // 获取当前显示的Sowaka故事
  getCurrentSowakaStory: () => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/sowaka-stories/current`)
  },
  
  // 根据ID获取Sowaka故事
  getSowakaStoryById: (id) => {
    return axios.get(`${API_BASE_URL}${MONGO_API_PREFIX}/sowaka-stories/${id}`)
  },
  
  // 创建Sowaka故事
  createSowakaStory: (data) => {
    return axios.post(`${API_BASE_URL}${MONGO_API_PREFIX}/sowaka-stories`, data)
  },
  
  // 更新Sowaka故事
  updateSowakaStory: (id, data) => {
    return axios.put(`${API_BASE_URL}${MONGO_API_PREFIX}/sowaka-stories/${id}`, data)
  },
  
  // 删除Sowaka故事
  deleteSowakaStory: (id) => {
    return axios.delete(`${API_BASE_URL}${MONGO_API_PREFIX}/sowaka-stories/${id}`)
  },
  
  // 切换故事激活状态
  toggleSowakaStoryStatus: (id) => {
    return axios.patch(`${API_BASE_URL}${MONGO_API_PREFIX}/sowaka-stories/${id}/toggle`)
  }
}

export default {
  novels: novelApi,
  chapters: chapterApi,
  storySections: storySectionApi,
  rooms: roomApi,
  concepts: conceptApi,
  sowakaStories: sowakaStoryApi
}


import { createRouter, createWebHistory } from 'vue-router'
import { useUserSession } from '../composables/useUserSession'
import HomePage from '../views/HomePage.vue'
import BluePage from '../views/BluePage.vue'
import SowakaPage from '../views/SowakaPage.vue'
import ChapterPage from '../views/ChapterPage.vue'
import MinimalistPage from '../views/MinimalistPage.vue'
import CardCollectionPage from '../views/CardCollectionPage.vue'
import NovelShowPage from '../views/NovelShowPage.vue'
import exNight  from  '../views/MinimalistPageNightOnly.vue'
import normalNight  from  '../views/MinimalistPageNormalNighty.vue'
import StartPage from '../views/StartPage.vue'
import exDay from '../views/MinimalistPageDayOnly.vue'
import ChapterSelectPage from '../views/ChapterSelectPage.vue'
import ChapterNodeEditor from '../views/ChapterNodeEditor.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // === 公共页面（无需身份验证）===
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { public: true }
    },
    {
      path: '/blue',
      name: 'blue',
      component: BluePage,
      meta: { public: true }
    },
    {
      path: '/sowaka',
      name: 'sowaka',
      component: SowakaPage,
      meta: { public: true }
    },
    {
      path: '/chapters',
      name: 'chapters',
      component: ChapterPage,
      meta: { public: true }
    },
    {
      path: '/minimalist',
      name: 'minimalist',
      component: MinimalistPage,
      meta: { public: true }
    },
    {
      path: '/cards',
      name: 'cards',
      component: CardCollectionPage,
      meta: { public: true }
    },
    {
      path: '/start',
      name: 'start',
      component: StartPage,
      meta: { public: true }
    },
    {
      path: '/chapter-editor',
      name: 'chapter-editor',
      component: ChapterNodeEditor,
      meta: { public: true }
    },
    {
      path: '/doodle-story',
      name: 'DoodleStory',
      component: () => import('@/views/DoodleStoryPage.vue'),
      meta: { public: true }
    },
    
    // === 昼用户专属页面 ===
    {
      path: '/exDay',
      name: 'exDay',
      component: exDay,
      meta: { requireIdentity: 'day' }
    },
    
    // === 夜用户专属页面 ===
    {
      path: '/exNight',
      name: 'exNight',
      component: exNight,
      meta: { requireIdentity: 'night' }
    },
    {
      path: '/normalNight',
      name: 'normalNight',
      component: normalNight,
      meta: { requireIdentity: 'night' }
    },
    
    // === 需要完成 StartPage 才能访问（任意身份）===
    {
      path: '/novel-show',
      name: 'novel-show',
      component: NovelShowPage,
      meta: { requireAnyIdentity: true }
    },
    {
      path: '/visual-novel',
      name: 'visual-novel',
      component: NovelShowPage,
      meta: { requireAnyIdentity: true }
    },
    {
      path: '/chapter-select',
      name: 'chapter-select',
      component: ChapterSelectPage,
      meta: { requireAnyIdentity: true }
    }
  ]
})

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
  const userSession = useUserSession()
  
  // 公共页面直接放行
  if (to.meta.public) {
    return next()
  }
  
  // 没有设置 meta 的页面也直接放行
  if (!to.meta.requireIdentity && !to.meta.requireAnyIdentity) {
    return next()
  }
  
  // 确保 userId 已初始化
  if (!userSession.userId.value) {
    await userSession.initSession('RouterGuard')
  }
  
  // 【安全】从后端验证身份（关键：不信任本地缓存）
  const { identity, hasCompletedStartPage } = await userSession.verifyIdentity()
  
  // 需要特定身份的页面
  if (to.meta.requireIdentity) {
    if (identity !== to.meta.requireIdentity) {
      console.warn(`🚫 身份不匹配: 需要 ${to.meta.requireIdentity}，当前 ${identity}`)
      // 跳转到正确的首页
      return next(userSession.getHomeRoute())
    }
  }
  
  // 需要任意身份（完成 StartPage）的页面
  if (to.meta.requireAnyIdentity) {
    if (!hasCompletedStartPage || (identity !== 'day' && identity !== 'night')) {
      console.warn('🚫 用户未完成 StartPage，跳转到开始页面')
      return next('/start')
    }
  }
  
  next()
})

export default router

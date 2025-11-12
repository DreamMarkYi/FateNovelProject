import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import BluePage from '../views/BluePage.vue'
import SowakaPage from '../views/SowakaPage.vue'
import ChapterPage from '../views/ChapterPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/blue',
      name: 'blue',
      component: BluePage
    },
    {
      path: '/sowaka',
      name: 'sowaka',
      component: SowakaPage
    },
    {
      path: '/chapters',
      name: 'chapters',
      component: ChapterPage
    }
  ]
})

export default router


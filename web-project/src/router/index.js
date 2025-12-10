import { createRouter, createWebHistory } from 'vue-router'
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
    },
    {
      path: '/minimalist',
      name: 'minimalist',
      component: MinimalistPage
    },
    {
      path: '/cards',
      name: 'cards',
      component: CardCollectionPage
    },
    {
      path: '/novel-show',
      name: 'novel-show',
      component: NovelShowPage
    },
      {
          path: '/exNight',
          name: 'exNight',
          component: exNight
      },
      {
          path: '/normalNight',
          name: 'normalNight',
          component: normalNight
      },
      {
          path: '/start',
          name: 'start',
          component: StartPage
      },
      {
          path: '/exDay',
          name: 'exDay',
          component: exDay
      }

  ]
})

export default router


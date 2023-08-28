import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
  {
    path: '/',
    name: 'fileAi',
    component: () => import(/* webpackChunkName: "fileAi" */ '@/views/fileAi/index.vue')
  },
  {
    path: '/404',
    component: () => import('@/views/404.vue'),
    meta: { title: '404' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  },
  {
    path: '/:pathMatch(.*)',
    redirect: '/404'
  }
  ]
})

export default router

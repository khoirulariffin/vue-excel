import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/pages/home/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/pages/editor/EditorView.vue'),
    },
  ],
})

export default router

import type { RouteRecordRaw } from 'vue-router'
import { createMemoryHistory, createRouter as _createRouter, createWebHistory } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: () => import('@/views/HomePage.vue'),
  },
  {
    path: '/contact',
    component: () => import('@/views/ContactPage.vue'),
  },
]

export function createRouter() {
  return _createRouter({
    // use appropriate history implementation for server/client
    // import.meta.env.SSR is injected by Vite.
    history: import.meta.env.SSR
        ? createMemoryHistory('/')
        : createWebHistory('/'),
    routes,
    scrollBehavior: (to) => {
      if (to.hash) {
        return {
          el: to.hash,
          behavior: 'smooth',
        }
      }

      return { left: 0, top: 0 }
    },
  })
}

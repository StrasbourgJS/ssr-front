import { createSSRApp } from 'vue'
import App from '@/App.vue'
import { createRouter } from '@/plugins/router'
import type { CreateAppReturn } from '#/ssr'

/**
 * SSR requires a fresh app instance per request, therefore we export a function that creates a fresh app instance.
 *
 * @returns {CreateAppReturn}
 */
export function createApp(): CreateAppReturn {
  const app = createSSRApp(App)

  const router = createRouter()
  app.use(router)
  return { app, router }
}

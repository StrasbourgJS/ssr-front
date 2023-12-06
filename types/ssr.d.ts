import type { Router } from 'vue-router'
import type { App } from 'vue'
import type { ViteDevServer } from 'vite'
import type { Express } from 'express'

export interface CTX {
  modules: Set<string>;
  __teleportBuffers?: Record<string, string[]>;
  teleports?: Record<string, string>;
}

export type SSRManifest = Record<string, string[]>

export interface CreateAppReturn {
  app: App<Element>;
  router: Router;
}

export interface ServerReturn {
  app: Express;
  vite: ViteDevServer;
}

export type MetaType =
  'author'
  | 'description'
  | 'keywords'
  | 'og:description'
  | 'og:image'
  | 'og:site_name'
  | 'og:title'
  | 'og:type'
  | 'og:url'
  | 'robots'
  | 'twitter:card'
  | 'twitter:creator'
  | 'twitter:description'
  | 'twitter:image'
  | 'twitter:site'
  | 'twitter:title'

export interface MetaReturn {
  title: string;
  meta: string;
}

export interface RenderReturn {
  appHtml: string;
  ctx: CTX;
  preloadLinks: string;
  title: string;
  meta: string;
}

export type RenderFunction = (url: string, manifest: SSRManifest) => Promise<RenderReturn>

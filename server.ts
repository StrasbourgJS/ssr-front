import type { Request, Response } from 'express'
import express from 'express';
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import type { ServerReturn } from './types/ssr'
import type { ViteDevServer } from 'vite'
import * as jsdom from 'jsdom'

const isTest = process.env.VITEST

export const createServer = async (
    root = process.cwd(),
    hmrPort = 1337,
): Promise<ServerReturn> => {
  // @ts-ignore
  const app = express()
  const vite: ViteDevServer = await (await import('vite')).createServer({
    root,
    logLevel: isTest ? 'error' : 'info',
    server: {
      middlewareMode: true,
      watch: {
        // During tests we edit the files too fast and sometimes chokidar
        // misses change events, so enforce polling for consistency
        usePolling: true,
        interval: 100,
      },
      hmr: {
        port: hmrPort,
      },
    },
    appType: 'custom',
  })
  app.use(vite.middlewares)

  // use vite's connect instance as middleware
  app.use('*', async (req: Request, res: Response) => {
    try {
      const url = req.originalUrl.replace(/\/test/, '')

      // always read fresh template in dev
      let template = readFileSync(resolve('index.html'), 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      const render = (await vite.ssrLoadModule('/src/entry-server.ts')).render

      const { appHtml, ctx, preloadLinks, title, meta } = await render(url, {})
      let html = template
          .replace(`<!--preload-links-->`, preloadLinks)
          .replace(`<!--app-html-->`, appHtml)
          .replace(`<!--title-->`, title)
          .replace(`<!--meta-->`, meta)

      if (ctx.teleports) {
        const DOMParsed = new jsdom.JSDOM(html)
        for (const teleportsKey in ctx.teleports) {
          const parent = DOMParsed.window.document.querySelector(teleportsKey)
          if (parent) {
            parent.insertAdjacentHTML(
                'afterbegin',
                ctx.teleports[teleportsKey],
            )
          }
        }

        html = DOMParsed.serialize()
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite && vite.ssrFixStacktrace(e as Error)
      console.error((e as Error).stack)
      res.status(500).end((e as Error).stack)
    }
  })

  return { app, vite }
}

if (!isTest) {
  createServer()
      .then(({ app }) => app.listen(3000, () => {
            console.log('Serveur lancé sur le port http://localhost:3000')
          }),
      )
}

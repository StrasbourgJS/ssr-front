import {
  createApp,
  createRouter,
  eventHandler,
  fromNodeMiddleware,
  send,
  appendHeader,
  sendError,
  toNodeListener,
} from "h3";
import { listen } from "listhen";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import type { ServerReturn } from "./types/ssr";
import type { ViteDevServer } from "vite";
import * as jsdom from "jsdom";

const isTest = process.env.VITEST;

export const createServer = async (
  root = process.cwd(),
  hmrPort = 1337
): Promise<ServerReturn> => {
  const app = createApp({ debug: true });
  const vite: ViteDevServer = await (
    await import("vite")
  ).createServer({
    root,
    logLevel: isTest ? "error" : "info",
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
    appType: "custom",
  });

  app.use(fromNodeMiddleware(vite.middlewares));

  // use vite's connect instance as middleware
  app.use(
    "*",
    eventHandler(async (event) => {
      try {
        const url = event.path.replace(/\/test/, "");

        // always read fresh template in dev
        let template = readFileSync(resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        const render = (await vite.ssrLoadModule("/src/entry-server.ts"))
          .render;

        const { appHtml, ctx, preloadLinks, title, meta } = await render(
          url,
          {}
        );
        let html = template
          .replace(`<!--preload-links-->`, preloadLinks)
          .replace(`<!--app-html-->`, appHtml)
          .replace(`<!--title-->`, title)
          .replace(`<!--meta-->`, meta);

        if (ctx.teleports) {
          const DOMParsed = new jsdom.JSDOM(html);
          for (const teleportsKey in ctx.teleports) {
            const parent =
              DOMParsed.window.document.querySelector(teleportsKey);
            if (parent) {
              parent.insertAdjacentHTML(
                "afterbegin",
                ctx.teleports[teleportsKey]
              );
            }
          }

          html = DOMParsed.serialize();
        }

        appendHeader(event, "Content-Type", "text/html");
        return send(event, html);
      } catch (e) {
        vite && vite.ssrFixStacktrace(e as Error);
        console.error((e as Error).stack);
        return sendError(event, e);
      }
    })
  );

  return { app, vite };
};

if (!isTest) {
  createServer().then(({ app }) =>
    listen(toNodeListener(app), { port: 3000 }).then(() => {
      console.log("Serveur lancé sur le port http://localhost:3000");
    })
  );
}

import { handleSsr } from "./ssr";
import { handleStaticAssets } from "./static-assets";
import type { ExecutionContext } from "@cloudflare/workers-types";
import {
  MethodNotAllowedError,
  NotFoundError,
} from "@cloudflare/kv-asset-handler/dist/types";

import { Env } from "./types";
import { Api } from "./api";
import { isAPiURL, isAssetURL, isSSR } from "./util";

const api = Api;

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (!isAssetURL(url)) {
        console.log(`
        \nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        ${new Date().toLocaleTimeString()}
        worker.fetch -> ${
          request.method
        } -> ${url} -> content-type: ${request.headers.get("Content-Type")}\n
      `);
      }

      return await handleFetchEvent(request, env, ctx);
    } catch (e) {
      console.error(e);
      if (e instanceof NotFoundError) {
        return new Response("Not Found", { status: 404 });
      } else if (e instanceof MethodNotAllowedError) {
        return new Response("Method Not Allowed", { status: 405 });
      } else {
        return new Response(JSON.stringify(e), { status: 500 });
      }
    }
  },
};

async function handleFetchEvent(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  let res;
  switch (true) {
    case isAssetURL(url):
      res = await handleStaticAssets(request, env, ctx);
      break;
    case isAPiURL(url):
      res = await api.handle(request, env, ctx);
      break;
    default:
      // this is only logged on page reload due to client routing
      console.log(
        `${url.pathname} is SSR ${isSSR(url, env.SSR_BASE_PATHS.split(","))}`
      );
      res =
        (await handleSsr(request, env, ctx)) ??
        new Response("Not Found", { status: 404 });
  }
  if (!isAssetURL(url)) {
    console.log(`
        worker.END RES -> ${
          res.status
        } -> ${url} -> content-type: ${res.headers.get("content-type")}
        ${new Date().toLocaleTimeString()}\nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`);
  }
  return res;
}

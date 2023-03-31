import { handleSsr } from "./ssr";
import { handleStaticAssets } from "./static-assets";
import type { ExecutionContext } from "@cloudflare/workers-types";
import {
  MethodNotAllowedError,
  NotFoundError,
} from "@cloudflare/kv-asset-handler/dist/types";

import { Env } from "./types";
import { Api } from "./api";
import { isAPiURL, isAssetURL } from "./util";

const api = Api;

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
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
  if (env.LOG_LEVEL === "debug") {
    console.log("worker.handleFetchEvent");
  }
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
      res =
        (await handleSsr(request, env, ctx)) ??
        new Response("Not Found", { status: 404 });
  }
  return res;
}

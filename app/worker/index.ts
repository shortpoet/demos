import { handleSsr } from './ssr';
import { handleStaticAssets } from './static-assets';
import type { ExecutionContext } from '@cloudflare/workers-types';
import {
  MethodNotAllowedError,
  NotFoundError,
} from '@cloudflare/kv-asset-handler/dist/types';
import { isAPI, isAssetURL } from './util';
import { Env } from './types';
import { RequestHandler } from './api';
import { handleAPI } from './api';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    waitUntil: (promise: Promise<any>) => void,
  ): Promise<Response> {
    try {
      const req = new RequestHandler(request, env);

      const response = await handleFetchEvent(req, env, ctx, waitUntil);

      return response;
    } catch (e) {
      console.error(e);
      if (e instanceof NotFoundError) {
        return new Response('Not Found', { status: 404 });
      } else if (e instanceof MethodNotAllowedError) {
        return new Response('Method Not Allowed', { status: 405 });
      } else {
        return new Response(JSON.stringify(e), { status: 500 });
      }
    }
  },
};

async function handleFetchEvent(
  request: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
  waitUntil: (promise: Promise<any>) => void,
): Promise<Response> {
  if (env.LOG_LEVEL === 'debug') {
    console.log('worker.handleFetchEvent');
  }
  const url = new URL(request.url);

  if (isAssetURL(url)) {
    if (env.LOG_LEVEL === 'debug') {
      console.log('worker.handleFetchstaticAssets');
    }
    return await handleStaticAssets(request, env, ctx);
  }
  if (isAPI(url)) {
    return handleAPI(request, env, ctx, waitUntil);
  }

  const response = await handleSsr(request, env, ctx);
  if (response !== null) return response;

  return new Response('Not Found', { status: 404 });
}

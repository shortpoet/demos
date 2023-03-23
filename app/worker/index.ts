import { handleSsr } from './ssr';
import { handleStaticAssets } from './static-assets';
import type { ExecutionContext } from '@cloudflare/workers-types';
import {
  MethodNotAllowedError,
  NotFoundError,
} from '@cloudflare/kv-asset-handler/dist/types';
import { isAPI, isAssetURL, logLevel } from './util';
import { Env } from './types';
import { defineInit, RequestHandler } from './api';
import { handleAPI } from './api';
const FILE_LOG_LEVEL = 'error';
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    waitUntil: (promise: Promise<any>) => void,
  ): Promise<Response> {
    try {
      // BUG: sending env back as response body. includes all static manifest etc.

      console.log('worker.fetch');
      console.log(JSON.stringify(request, null, 2));
      if (request.body) {
        console.log('worker.RequestHandler.req.body', request.body);
        if (request.body instanceof ReadableStream) {
          console.log(
            'worker.RequestHandler.req.body instanceof ReadableStream',
          );
          console.log(await request.clone().body.pipeTo(new WritableStream()));
        }
      }

      const handler = new RequestHandler(request, env);
      // const req = new RequestHandler(request, env, await defineInit(request));
      console.log('worker.handleFetchEvent.handler');
      console.log(JSON.stringify(handler, null, 2));

      const response = await handleFetchEvent(handler, env, ctx, waitUntil);

      return response;
    } catch (e) {
      console.error('worker.fetch');
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
  handler: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
  waitUntil: (promise: Promise<any>) => void,
): Promise<Response> {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.handleFetchEvent');
  }
  const url = new URL(handler.url);

  if (isAssetURL(url)) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('worker.handleFetchstaticAssets');
    }
    return await handleStaticAssets(handler.req, env, ctx);
  }
  if (isAPI(url)) {
    return handleAPI(handler, env, ctx, waitUntil);
  }

  const response = await handleSsr(handler.req, env, ctx);
  if (response !== null) return response;

  return new Response('Not Found', { status: 404 });
}

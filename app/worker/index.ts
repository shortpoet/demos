import { handleSsr } from './ssr';
import { handleStaticAssets } from './static-assets';
import type { ExecutionContext } from '@cloudflare/workers-types';
import {
  MethodNotAllowedError,
  NotFoundError,
} from '@cloudflare/kv-asset-handler/dist/types';
import { isAPI, isAssetURL, logger, logLevel } from './util';
import { Env } from './types';
import { defineInit, RequestHandler, WorkerRequest } from './api';
import { handleAPI } from './api';
import { exposeSession } from './api';
const FILE_LOG_LEVEL = 'error';
export default {
  async fetch(
    request: WorkerRequest,
    env: Env,
    ctx: ExecutionContext,
    waitUntil: (promise: Promise<any>) => void,
  ): Promise<Response> {
    try {
      // BUG: sending env back as response body. includes all static manifest etc.
      if (!isAssetURL(new URL(request.url))) {
        console.log(`
      \nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n
      ${new Date().toLocaleTimeString()}
      worker.fetch -> ${request.url}
      \n
      `);
      }
      // console.log(JSON.stringify(request, null, 2));
      const handler = new RequestHandler(request, env);
      await handler.initData(env);

      // const req = new RequestHandler(request, env, await defineInit(request));
      // console.log('worker.handleFetchEvent.handler');
      // console.log(JSON.stringify(handler, null, 2));

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
// declare module globalThis {
//   let process: { env: Env };
// }
// export interface Env {
//   NEXTAUTH_SECRET: string;
//   NEXTAUTH_URL: string;
// }

async function handleFetchEvent(
  handler: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
  waitUntil: (promise: Promise<any>) => void,
): Promise<Response> {
  const log = logger(FILE_LOG_LEVEL, env);
  log('worker.handleFetchEvent');
  const url = new URL(handler.url);

  // endless redirect
  // await exposeSession(handler, env);

  if (isAssetURL(url)) {
    log('worker.handleFetchEvent.isAssetURL');
    return await handleStaticAssets(handler.req, env, ctx);
  }
  if (isAPI(url)) {
    const apiRes = handleAPI(handler, env, ctx, waitUntil);
    // console.log('worker.handleFetchEvent.apiRes');
    // console.log(JSON.stringify(apiRes, null, 2));
    return apiRes;
  }

  const response = await handleSsr(handler, env, ctx);
  console.log(
    `worker.handleFetchEvent.response: ${JSON.stringify(response, null, 2)}`,
  );
  log(response);
  if (response !== null) return response;
  return new Response('Not Found', { status: 404 });
}

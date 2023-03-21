import { Env } from '../types';
import { logLevel } from '../util';
import { createJsonResponse, handleCors, handleOptions } from '../util';
import { RequestHandler } from './auth';
import { handleHealth } from './health';

export { handleAPI };

const FILE_LOG_LEVEL = 'info';

async function handleAPI(
  request: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
  waitUntil: (promise: Promise<any>) => void,
) {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.handleAPI');
  }

  const url: URL = new URL(request.url);

  if (request.method === 'OPTIONS') {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('worker.handleAPI.optionsMethod');
    }

    return handleCors(request, env);
  }

  if (url.pathname.startsWith('/api/health')) {
    return await handleHealth(request, env, ctx);
  }

  return createJsonResponse({ error: 'Not Found' }, request, env, 404);
}

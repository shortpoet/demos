import { Env } from '../types';
import { logLevel } from '../util';
import { createJsonResponse, handleCors, handleOptions } from '../util';
import { RequestHandler } from '.';
import { handleHealth } from './health';
import { handleSession } from './auth';

export { handleAPI };

const FILE_LOG_LEVEL = 'info';

async function handleAPI(
  handler: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
  waitUntil: (promise: Promise<any>) => void,
) {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.handleAPI');
  }

  const url: URL = new URL(handler.req.url);

  if (handler.req.method === 'OPTIONS') {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('worker.handleAPI.optionsMethod');
    }
    try {
      return handleCors(handler, env);
    } catch (error) {
      console.error('worker.handleAPI.optionsMethod.error');
      console.error(error);
    }
  }

  if (url.pathname.startsWith('/api/health')) {
    try {
      return await handleHealth(handler, env, ctx);
    } catch (error) {
      console.error('worker.handleAPI.health.error');
      console.error(error);
    }
  }

  if (url.pathname.startsWith('/api/auth/session')) {
    try {
      return await handleSession(handler, env, ctx);
    } catch (error) {
      console.error('worker.handleSession.error');
      console.error(error);
    }
  }

  return createJsonResponse({ error: 'Not Found' }, handler, env, 404);
}

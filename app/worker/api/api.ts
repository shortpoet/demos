import { Env } from '../types';
import { logger, logLevel } from '../util';
import { createJsonResponse, handleCors, handleOptions } from '../util';
import { RequestHandler } from '.';
import { handleHealth } from './health';
import { handleSession } from './auth';
import { handleNextAuth } from './next/_handler';

export { handleAPI };

const FILE_LOG_LEVEL = 'error';

async function handleAPI(
  handler: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
  waitUntil: (promise: Promise<any>) => void,
) {
  const log = logger(FILE_LOG_LEVEL, env);
  log(`\tworker.handleAPI`);
  const url: URL = new URL(handler.req.url);
  let res;
  try {
    log(`\t-> ${handler.req.method}://.${url.pathname}\n`);
    switch (true) {
      case handler.req.method === 'OPTIONS':
        res = handleOptions(handler, env);
        break;

      case url.pathname.startsWith('/api/health'):
        res = await handleHealth(handler, env, ctx);
        break;
      case url.pathname.startsWith('/api/auth/session'):
        res = await handleSession(handler, env, ctx);
        break;
      case url.pathname.startsWith('/api/next-auth'):
        res = await handleNextAuth(handler, env, ctx);
        break;

      default:
        res = createJsonResponse({ error: 'Not Found' }, handler, env, 404);
        break;
    }
  } catch (error) {
    console.error(
      `\nworker.handleAPI.error\n-> ${handler.req.method}://.${url.pathname}\n`,
    );
    console.error(error);
  }
  log(`\n\t<- END API HANDLE\n`);
  return res;
}

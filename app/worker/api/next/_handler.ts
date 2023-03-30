import { isValidJwt } from '../auth';
import { Env } from '../../types';
import {
  createJsonResponse,
  generateTypedUUID,
  generateUUID,
  getCookie,
  logger,
  logLevel,
  parseCookie,
} from '../../util';
import { RequestHandler } from '../RequestHandler';
import { Session, User } from '../../../types';
import { getUser, sessionUser } from '../auth/user';
import { getToken } from '@auth/core/jwt';
import { Auth } from '@auth/core';
import authConfig from './auth';
import { handleSsr } from 'ssr';

const FILE_LOG_LEVEL = 'debug';

export { handleNextAuth, handle };

// const url = new URL(req.url);
// const nextauth = url.pathname.split('/').splice(0, 3).join('/');
// Object.entries(nextauth).forEach(([key, value]) => {
//   url.searchParams.set(key, value);
// });

async function handle(req: Request, env: Env) {
  console.log(`\nXXXXXXXXXXXX\tHANDLE\n`);
  console.log('req -> url');
  console.log(req.url);
  const res = await Auth(req, authConfig(env));
  // res.headers.set('Access-Control-Allow-Origin', '*');
  // console.log('res');
  // console.log('res', {
  //   ...res,
  //   body: res.body ? { truncated: true } : res.body,
  // });
  // console.log(JSON.stringify(res, null, 2));
  return res;
}

async function _handle(handler: RequestHandler, env: Env) {
  const res = await Auth(handler.req, authConfig(env));
  console.log('res');
  console.log(res);
  console.log(JSON.stringify(res, null, 2));
  return res;
  const nextauth = handler.url.pathname.split('/').splice(0, 3).join('/');
  const url = handler.createQueryURL({ nextauth });
  return await Auth(new Request(url, handler.req), authConfig(env));
}

async function handleNextAuth(
  handler: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
) {
  const url = new URL(handler.req.url);
  const method = handler.req.method;
  const log = logger(FILE_LOG_LEVEL, env);
  log(
    `worker.api.auth.next.handleNextAuth -> ${handler.req.method}://.${url.pathname}\n`,
  );
  let res;

  try {
    res = await _handle(handler, env);
  } catch (error) {
    console.error(
      `\nworker.handleNextAuth.error\n-> ${handler.req.method}://.${url.pathname}\n`,
    );
    console.error(error);
  }
  return res;
}

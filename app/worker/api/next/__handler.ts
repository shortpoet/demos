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
// import cookieParser from 'cookie-parser';
// import setCookie from 'set-cookie-parser';

const FILE_LOG_LEVEL = 'debug';

export {
  handleNextAuth,
  //  handleGenerated
};

const AuthError = class AuthError extends Error {};

async function _handle(handler: RequestHandler, env: Env) {
  const nextauth = handler.url.pathname.split('/').splice(0, 3).join('/');
  const url = handler.createQueryURL({ nextauth });
  return await Auth(new Request(url, handler.req), authConfig(env));
}

async function handleRequest(handler: RequestHandler, env: Env) {
  const urlOriginal = new URL(handler.req.url);
  console.log('urlOriginal', urlOriginal.href);
  const log = logger(FILE_LOG_LEVEL, env);
  log(`\n^^^^^^^^^^^^^^^^^^^^^\tworker.api.auth.next.handleRequest`);
  const url = new URL(handler.req.url);
  const action = url.pathname.split('/').slice(2);
  log(`action: ${action}`);

  try {
    const token = await getToken({
      req: handler.req,
      secret: env.NEXTAUTH_SECRET,
    });
    console.log('token', token);

    const sessionToken = handler.user
      ? (handler.user.token = token ? JSON.stringify(token) : undefined)
      : undefined;

    const needsLogin = ['verify-email' /*, 'otp' */, 'signin'].includes(
      action[1],
    );

    log(`needsLogin: ${needsLogin}`);

    // api/next-auth/callback/credentials
    if (action[0] === 'callback') {
      if (handler.req.method === 'GET') {
        console.log('GET -> transformGetRequest');
        transformGetRequest(handler.req as any, env);
      }
      // const body: BodyInit = sessionToken ?? undefined;
      // const init = new Request(handler.req, {
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body,
      // });

      // if (needsLogin && !sessionToken)
      //   return Response.redirect('/api/next-auth/signin', 307);
      // if (!needsLogin && sessionToken)
      //   return new Response('Already logged-in', { status: 403 });
    }

    const nextAuthUrl = handler.createQueryURL({ nextauth: action.join('/') });
    log(`nextAuthUrl: ${nextAuthUrl}`);

    // DIES HERE
    // handler.res = new Response();
    // const res = await handler.nextAuth(
    //   new Request(nextAuthUrl, handler.req),
    //   handler.res,
    // );
    // log(`res: ${res}`);

    const c = new Request(nextAuthUrl, handler.req);
    console.log('c.BODY_USED', c.bodyUsed);

    const other = await Auth(c, authConfig(env));
    console.log('other', other);
    return other;
    // return res;
  } catch (error) {
    console.log('error', error);
  }
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
  // await exposeSession(handler, env);

  try {
    switch (true) {
      case method === 'GET' && /^\/api\/next-auth\/.*$/i.test(url.pathname):
        res = await _handle(handler, env);
        break;
      case method === 'POST' && /^\/api\/next-auth\/.*$/i.test(url.pathname):
        res = await _handle(handler, env);
        break;
      // case method === 'GET' &&
      //   /^\/api\/next-auth\/(csrf|session|signin)$/i.test(url.pathname):
      //   res = await handleRequest(handler, env);
      //   break;
      // case method === 'POST' &&
      //   /^\/api\/next-auth\/signin\/(github)$/i.test(url.pathname):
      //   res = await handleRequest(handler, env);
      //   break;
      // case method === 'POST' &&
      //   /^\/api\/next-auth\/callback\/(register|login|signin|credentials)$/i.test(
      //     url.pathname,
      //   ):
      //   res = await handleRequest(handler, env);
      //   break;
      // case method === 'GET' &&
      //   /^\/api\/next-auth\/callback\/(verify-email|otp)$/i.test(url.pathname):
      //   res = await handleRequest(handler, env);
      //   break;
      // case method === 'POST' &&
      //   /^\/api\/next-auth\/signout$/i.test(url.pathname):
      //   res = await handleRequest(handler, env);
      //   break;
      default:
        res = createJsonResponse({ error: 'Not Found' }, handler, env, 404);
        break;
    }
  } catch (error) {
    console.error(
      `\nworker.handleNextAuth.error\n-> ${handler.req.method}://.${url.pathname}\n`,
    );
    console.error(error);
  }
  return res;
}

function transformGetRequest(handler: RequestHandler, env: Env) {
  const uri = env.NEXTAUTH_URL;
  // const { csrfCookie } = cookieNames(true);
  const cookies = handler.req.headers.get('Cookie') || '';
  // const csrfToken = (getCookie(cookies, csrfCookie) || '').split('|')[0];
  // const body: BodyInit = JSON.stringify({
  //   ...handler.query,
  //   redirect: 'true',
  //   json: 'false',
  //   csrfToken,
  // });
  const init = {
    ...handler.req,
    headers: {
      ...handler.req.headers,
    },
    method: 'POST',
  };
  const _req = new Request(handler.req.url, init);
  handler.req = _req;
}

// case method === 'GET' && url.pathname.startsWith('/api/next-auth/signin'):
//   res = await handleSignin(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/signout'):
//   res = await handleSignout(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/callback'):
//   res = await handleCallback(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/verify-request'):
//   res = await handleVerifyRequest(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/csrf'):
//   res = await handleCSRF(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/providers'):
//   res = await handleProviders(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/client'):
//   res = await handleClient(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/events'):
//   res = await handleEvents(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/configuration'):
//   res = await handleConfiguration(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/jwks'):
//   res = await handleJWKS(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/secret'):
//   res = await handleSecret(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/adapters'):
//   res = await handleAdapters(handler, env, ctx);
//   break;
// case method === 'GET' && url.pathname.startsWith('/api/next-auth/debug'):
//   res = await handleDebug(handler, env, ctx);
//   break;

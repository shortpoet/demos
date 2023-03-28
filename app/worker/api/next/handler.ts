import { isValidJwt } from '../auth';
import { Env } from '../../types';
import {
  createJsonResponse,
  generateTypedUUID,
  generateUUID,
  getCookie,
  logLevel,
  parseCookie,
} from '../../util';
import { RequestHandler } from '../RequestHandler';
import { Session, User } from '../../../types';
import { getUser, sessionUser } from '../auth/user';
import { getToken } from '@auth/core/jwt';
import { Auth } from '@auth/core';
import AuthHandler from './auth';

const FILE_LOG_LEVEL = 'error';

export { handleNextAuth };

const uri = process.env.NEXTAUTH_URL;

if (!uri) {
  throw new Error('Please add your NEXTAUTH_URL to .env');
}

const AuthError = class AuthError extends Error {};

const useSecureCookie = (uri || '').startsWith('https://');
// const sessionCookie =  (useSecureCookie ? '__Secure-' : '') + 'next-auth.session-token'
const csrfCookie = (useSecureCookie ? '__Host-' : '') + 'next-auth.csrf-token';
const callbackCookie =
  (useSecureCookie ? '__Secure-' : '') + 'next-auth.callback-url';

const transformGetRequest = (handler: RequestHandler) => {
  const cookies = handler.req.headers.get('Cookie') || '';
  const csrfToken = (getCookie(cookies, csrfCookie) || '').split('|')[0];
  const body: BodyInit = JSON.stringify({
    ...handler.query,
    redirect: 'true',
    json: 'false',
    csrfToken,
  });
  const init = {
    headers: {
      ...handler.req.headers,
    },
    method: 'POST',
    body,
  };
  const _req = new Request(handler.req.url, init);
};

const handleRequest = async (handler: RequestHandler, env: Env) => {
  const action = new URL(handler.req.url).pathname.split('/').slice(2);

  const token = await getToken({
    req: handler.req,
    secret: env.JWT_SECRET,
  });
  const sessionToken = token ? JSON.stringify(token) : undefined;

  const needsLogin = ['verify-email' /*, 'otp' */].includes(action[1]);

  if (action[0] === 'callback') {
    if (handler.req.method === 'GET') transformGetRequest(handler.req as any);
  }
  const body: BodyInit = sessionToken ?? undefined;

  handler.req.body = handler.req.body.sessionToken = sessionToken
    ? JSON.stringify(sessionToken)
    : undefined;

  if (needsLogin && !sessionToken)
    return Response.redirect('/next-auth/login', 307);
  if (!needsLogin && sessionToken)
    return new Response('Already logged-in', { status: 403 });

  handler.req.query.nextauth = action;
  authHandler(handler.req, handler.res);
};

// import cookieParser from 'cookie-parser';
// import setCookie from 'set-cookie-parser';

const exposeSession = async (handler: RequestHandler) => {
  // Fetch session
  const options = handler.req.headers.get('Cookie')
    ? { headers: { cookie: handler.req.headers.get('Cookie') } }
    : {};

  const sessionRes = await fetch(`${uri}/session`, options);
  const session: Session = await sessionRes.json();
  // Pass session to next()
  handler.res.locals.session = session;
  // Include set-cookie in response

  const setCookies = sessionRes.headers.get('set-cookie');
  if (setCookies) {
    handler.res.headers.set('set-cookie', setCookies);
  }
  const cookies = handler.req.headers.get('Cookie') || '';

  const parsed = parseCookie(setCookies);
  // Pass csrfToken to next()
  const csrfToken: string =
    getCookie(cookies, csrfCookie) ||
    parsed[csrfCookie] ||
    handler.req.headers.get(csrfCookie);

  handler.res.locals.csrfToken = csrfToken.split('|')[0];
  // Pass callbackUrl to next()
  const callbackUrl: string =
    parsed[callbackCookie] || handler.req.headers.get(callbackCookie);
  handler.res.locals.callbackUrl = callbackUrl;
};

async function handleNextAuth(
  handler: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
) {
  const url = new URL(handler.req.url);
  const method = handler.req.method;
  let res;

  const authHandler = (req, res) => Auth(req, AuthHandler(env));
  handler.nextAuth = authHandler;

  // const nextauth = req.path.split('/');
  // nextauth.splice(0, 3);
  // req.query.nextauth = nextauth;

  // NextAuthHandler(req, res);

  try {
    switch (true) {
      case method === 'GET' && /^\/auth\/(csrf|session)$/.test(url.pathname):
        res = await handleRequest(handler, env);
        break;
      case method === 'POST' &&
        /^\/auth\/callback\/(register|login)$/i.test(url.pathname):
        res = await handleRequest(handler, env);
        break;
      case method === 'GET' &&
        /^\/auth\/callback\/(verify-email|otp)$/i.test(url.pathname):
        res = await handleRequest(handler, env);
        break;
      case method === 'POST' && /^\/auth\/signout$/.test(url.pathname):
        res = await handleRequest(handler, env);
        break;
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

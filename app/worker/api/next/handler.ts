import { Env } from '../../types';
import { getCookie, logger, parseCookie } from '../../util';
import { RequestHandler } from '../RequestHandler';
import { Auth } from '@auth/core';
import authConfig from './auth';

const FILE_LOG_LEVEL = 'debug';

export { handleNextAuth, handle, exposeSession };

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
  return await Auth(new Request(req.url, req), authConfig(env));
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
    await exposeSession(handler, env);
    // res.headers.set('Access-Control-Allow-Origin', '*');
    res = await handle(handler.req, env);
  } catch (error) {
    console.error(
      `\nworker.handleNextAuth.error\n-> ${handler.req.method}://.${url.pathname}\n`,
    );
    console.error(error);
  }
  return res;
}

function cookieNames(useSecureCookie: boolean) {
  // const useSecureCookie = true;
  // const useSecureCookie = (env.NEXTAUTH_URL || '').startsWith('https://');
  // const sessionCookie =  (useSecureCookie ? '__Secure-' : '') + 'next-auth.session-token'
  const csrfCookie =
    (useSecureCookie ? '__Host-' : '') + 'next-auth.csrf-token';
  const callbackCookie =
    (useSecureCookie ? '__Secure-' : '') + 'next-auth.callback-url';
  return { csrfCookie, callbackCookie };
}

const exposeSession = async (handler: RequestHandler, env: Env) => {
  console.log(`\n$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$\texposeSession`);
  // Fetch session
  const handlerReqCookie = handler.req.headers.get('Cookie');
  const options = handlerReqCookie
    ? { headers: { cookie: handlerReqCookie } }
    : {};

  console.log('options', options);

  const uri = `${env.NEXTAUTH_URL}/session`;
  const baseUrl = new URL(handler.req.url).origin;
  // const gUri = `${baseUrl}/api/next-auth/session`;
  const gUri = baseUrl.includes('localhost')
    ? 'http://192.168.1.70:3000/api/next-auth/session'
    : // ? 'http://[::1]:3000/api/next-auth/session'
      `${baseUrl}/api/next-auth/session`;
  const useSecureCookie = gUri.startsWith('https://');
  console.log(`\nURI\n\n${uri}\n\n`);
  console.log(`\nG_URI\n\n${gUri}\n\n`);

  try {
    // fetch within worker unsupported in CF
    // https://community.cloudflare.com/t/get-error-code-1042-when-fetching-within-worker/288031
    // const sessionRes = await fetch(`${gUri}`, options);
    const sessionRes = await Auth(new Request(gUri, options), authConfig(env));
    console.log('sessionRes', JSON.stringify(sessionRes, null, 2));
    let session;
    try {
      session = await sessionRes.clone().json();
    } catch (error: any) {
      console.log('error', error);
      if (error instanceof SyntaxError) {
        console.log('SyntaxError');
        console.log(JSON.stringify(sessionRes, null, 2));
        const text = await sessionRes.text();
        console.log('text', text);
        session = text;
      }
    }
    handler.res = new Response();
    handler.res.locals = {};
    // Pass session to next()
    handler.res.locals.session = session;
    handler.session = session;
    // Include set-cookie in response

    const setCookies = sessionRes.headers.get('set-cookie');
    if (setCookies) {
      console.log(`\nHAS_SET_COOKIES\n\n${setCookies}\n\n}`);
      handler.res.headers.set('set-cookie', setCookies);
    }
    const cookies = handler.req.headers.get('Cookie') || '';
    const parsedReq = parseCookie(cookies);
    console.log(
      `\nPARSED_REQ_COOKIE_\n\n${JSON.stringify(parsedReq, null, 2)}\n\n`,
    );

    const { csrfCookie, callbackCookie } = cookieNames(useSecureCookie);
    console.log(`\nCSRF_COOKIE_NAME\n\n${csrfCookie}\n\n`);
    console.log(`\nCALLBACK_COOKIE_NAME\n\n${callbackCookie}\n\n`);
    const parsedSet = parseCookie(setCookies);
    console.log(
      `\nPARSED_SET_COOKIE_\n\n${JSON.stringify(parsedSet, null, 2)}\n\n`,
    );
    // Pass csrfToken to next()
    const csrfToken: string =
      getCookie(cookies, csrfCookie) ||
      parsedSet[csrfCookie] ||
      handler.req.headers.get(csrfCookie);

    console.log(`\nCSRF_TOKEN\n\n${csrfToken}\n\n`);

    handler.res.locals.csrfToken = csrfToken.split('|')[0];
    // Pass callbackUrl to next()
    const callbackUrl: string =
      parsedSet[callbackCookie] || handler.req.headers.get(callbackCookie);

    console.log(`\nCALLBACK_URL\n\n${callbackUrl}\n\n`);

    handler.res.locals.callbackUrl = callbackUrl;
    console.log('handler.res.locals', handler.res.locals);
    console.log(JSON.stringify(session, null, 2));
  } catch (error) {
    console.error(error);
  }
};

// import * as crypt from 'crypto';

import { isValidJwt } from '.';
import { Env } from '../../types';
import { createJsonResponse, generateUUID, logLevel } from '../../util';
import { RequestHandler } from '../RequestHandler';
import { Session, User } from '../types';

const FILE_LOG_LEVEL = 'debug';

export { handleSession, getSessionFromCookie };

async function getSessionFromCookie(
  handler: RequestHandler,
  env: Env,
  user?: User,
): Promise<Session | undefined> {
  const cookieName = 'demo-cfw-ssr-session-token';
  const sessionCookie = handler.req.headers.get('Cookie');
  console.log('worker.handleSsr.sessionCookie', sessionCookie);
  let res;
  if (sessionCookie) {
    const sessionToken = sessionCookie.split(`${cookieName}=`)[1];
    // const sessionTokenB64Decoded = _atob(sessionToken);
    console.log('worker.handleSsr.sessionToken', sessionToken);
    // console.log(
    //   'worker.handleSsr.sessionTokenB64Decoded',
    //   sessionTokenB64Decoded,
    // );
    if (sessionToken) {
      const session = await env.DEMO_CFW_SSR.get(sessionToken);
      console.log('worker.handleSsr.session', session);
      const value = await env.DEMO_CFW_SSR.list();
      // console.log('worker.handleSsr.value', value);
      console.log('worker.handleSsr.value', value.keys);
      for (const key in value.keys) {
        console.log(
          'worker.handleSsr.value.keys',
          JSON.stringify(value.keys[key], null, 2),
        );
      }

      if (session) {
        const sessionJson = JSON.parse(session);
        res = sessionJson;
        // console.log('worker.handleSsr.sessionJson', sessionJson);
        // if (sessionJson.expires > new Date(Date.now())) {
        //   user = sessionJson.user;
        // }
      }
    }
  }
  return res;
}

async function generateSessionToken(
  env: Env,
  sessionId: string,
): Promise<string> {
  // const token = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(await env.__SECRET__);
  let out;
  try {
    const secretKey = await crypto.subtle.importKey(
      'raw',
      secretKeyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify', 'sign'],
    );

    const timestamp = Date.now();
    const payload = `${sessionId}.${timestamp}`;
    // const payload = 'test';
    const payloadData = encoder.encode(payload);
    // const signature = 'test';

    const sign = await crypto.subtle.sign('HMAC', secretKey, payloadData);
    const signature = new Uint8Array(sign);
    const signatureBase64 = Buffer.from(signature).toString('base64');

    console.log('signature', signature);
    out = `${payload}.${signatureBase64}`;
  } catch (error) {
    console.log('generateSessionToken.error', error);
  }
  return out;
}

async function handleSession(
  handler: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
) {
  const url = new URL(handler.req.url);
  const method = handler.req.method;
  let res;

  if (url.pathname.startsWith('/api/auth/session')) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('worker.api.auth.session.handleSession');
    }

    try {
      const { valid, payload, status } = await isValidJwt(handler, env, ctx);

      if (!valid) {
        res = createJsonResponse(
          {
            error: `worker.api.auth.session.handleSession.unauthorized.${payload}`,
          },
          handler,
          env,
          status,
        );
        return res;
      }
      let session: Session;
      switch (method) {
        case 'GET':
          console.log('worker.api.auth.session.handleSession.get');
          const sessionTokenParam = url.searchParams.get('sessionToken');
          session = JSON.parse(await env.DEMO_CFW_SSR.get(sessionTokenParam));
          res = await handler.handleRequest(env, ctx, session, 200, {
            withAuth: true,
          });
          break;
        case 'POST':
          console.log('worker.api.auth.session.handleSession.post');
          session = await getSessionFromCookie(handler, env);
          if (session) {
            res = await handler.handleRequest(env, ctx, session, 200, {
              withAuth: true,
            });
            break;
          }
          const generateSessionId = (length) =>
            crypto.getRandomValues(new Uint8Array(length)).join('');
          const sessionId = generateSessionId(16);
          const sessionToken = await generateSessionToken(env, sessionId);
          console.log(`sessionToken: 
          XXXXXXXXXXXXXXXXXXXXX
          ${sessionToken}
          `);
          console.log(`sessionId:
          XXXXXXXXXXXXXXXXXXXXX
          ${sessionId}
          `);
          session = {
            id: sessionId,
            user: handler.user,
            userId: handler.user.sub,
            created: new Date(Date.now()),
            updated: new Date(Date.now()),
            expires: new Date(Date.now() + 1000 * 60 * 60 * 3),
            accessToken: handler.user.token,
            sessionToken,
          };
          await env.DEMO_CFW_SSR.put(sessionId, JSON.stringify(session));

          res = await handler.handleRequest(env, ctx, { sessionToken }, 204, {
            withAuth: true,
          });
          break;
        case 'DELETE':
          await env.DEMO_CFW_SSR.delete(handler.user.sub);
          res = await handler.handleRequest(env, ctx, { result: 'Ok' }, 204, {
            withAuth: true,
          });
          break;
        default:
          res = createJsonResponse(
            { error: `worker.api.auth.session.handleSession.method.${method}` },
            handler,
            env,
            404,
          );
          break;
      }
    } catch (error) {
      console.error(
        `worker.api.auth.session.handleSession.error.method ${method}`,
      );
      console.error(error);
      res = createJsonResponse(
        { error: 'worker.api.auth.session.handleSession.error' },
        handler,
        env,
        404,
      );
    }
  }

  console.log(
    'worker.api.auth.session.handleSession.res',
    JSON.stringify(res, null, 2),
  );

  return res;
}

// https://community.cloudflare.com/t/node-crypto-vs-web-crypto/202174/2
// function convertPem(pem) {
//   return Buffer.from(
//     pem
//       .split('\n')
//       .map((s) => s.trim())
//       .filter((l) => l.length && !l.startsWith('---'))
//       .join(''),
//     'base64',
//   );
// }
// function createSigningKey(keyData) {
//   return crypto.subtle.importKey(
//     'pkcs8',
//     keyData,
//     { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
//     false,
//     ['sign'],
//   );
// }
// async function createSignature(text, key) {
//   const textBuffer = Buffer.from(text, 'utf8');
//   const sign = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, textBuffer);
//   return Buffer.from(sign).toString('base64');
// }

// function generateSessionT(env: Env): string {
//   const token = crypt.randomBytes(64).toString('base64url');
//   console.log('token', token);
//   const timestamp = Date.now();
//   const payload = `${token}.${timestamp}`;
//   const signature = crypt
//     .createHmac('sha256', env.__SECRET__)
//     .update(payload)
//     .digest('base64url');
//   console.log('signature', signature);
//   return `${payload}.${signature}`;
// }

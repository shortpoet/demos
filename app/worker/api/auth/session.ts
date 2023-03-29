import { isValidJwt } from '.';
import { Env } from '../../types';
import {
  createJsonResponse,
  generateTypedUUID,
  generateUUID,
  logLevel,
  getCookie,
  logger,
} from '../../util';
import { RequestHandler } from '../RequestHandler';
import { Session, User } from '../../../types';
import { getUser, sessionUser } from './user';
import { escapeNestedKeys } from '../../../util';

const FILE_LOG_LEVEL = 'error';

export { handleSession, getSessionFromCookie };

async function clearExpiredSessions(
  env: Env,
  log = logger(FILE_LOG_LEVEL, env),
) {
  const envVars = await env.DEMO_CFW_SSR_SESSIONS.list();
  for (const key in envVars.keys) {
    const session: Session = JSON.parse(
      await env.DEMO_CFW_SSR_SESSIONS.get(envVars.keys[key].name),
    );
    if (session) {
      if (
        new Date(session.expires).getTime() < new Date(Date.now()).getTime()
      ) {
        log(
          `worker.session.clearExpiredSessions.envVars.keys.expiration.delete: ${JSON.stringify(
            session,
            null,
            2,
          )}`,
        );
        await env.DEMO_CFW_SSR_SESSIONS.delete(envVars.keys[key].name);
      }
    }
  }
}

async function clearAllKeys(
  kv: KVNamespace,
  env: Env,
  excludes = [],
  log = logger(FILE_LOG_LEVEL, env),
) {
  const envVars = await kv.list();
  for (const key in envVars.keys) {
    if (excludes.includes(envVars.keys[key].name)) {
      continue;
    }
    log(
      `worker.session.clearAllKeys.envVars.keys.delete: ${JSON.stringify(
        envVars.keys[key].name,
        null,
        2,
      )}`,
    );
    await kv.delete(envVars.keys[key].name);
  }
}

async function clearAllSessions(env: Env, log = logger(FILE_LOG_LEVEL, env)) {
  const envVars = await env.DEMO_CFW_SSR_SESSIONS.list();
  for (const key in envVars.keys) {
    if (!envVars.keys[key].name.startsWith('@session@')) {
      continue;
    }
    log(
      `worker.session.clearAllSessions.envVars.keys.delete: ${JSON.stringify(
        envVars.keys[key].name,
        null,
        2,
      )}`,
    );
    await env.DEMO_CFW_SSR_SESSIONS.delete(envVars.keys[key].name);
  }
}

async function getSessionFromCookie(
  handler: RequestHandler,
  env: Env,
  user?: User,
  log = logger(FILE_LOG_LEVEL, env),
): Promise<Session | undefined> {
  const cookieName = 'demo-cfw-ssr-session-token';
  const cookies = decodeURIComponent(handler.req.headers.get('Cookie'));
  let res;
  // override next-auth session for now
  if (handler.url.pathname.startsWith('/next-auth')) {
    console.log(
      `\tworker.session.getSessionFromCookie.nextAuth -> skipping session for ${handler.url.pathname}`,
    );
    return res;
  }
  if (cookies) {
    const sessionToken = getCookie(cookies, cookieName);
    log(`worker.session.getSessionFromCookie.sessionToken: ${sessionToken}`);
    if (sessionToken) {
      const sessionId = sessionToken.split('.')[0];
      const session = await env.DEMO_CFW_SSR_SESSIONS.get(sessionId);
      log(`worker.session.getSessionFromCookie.session: ${session}`);

      if (logLevel(FILE_LOG_LEVEL, env)) {
        const envVars = await env.DEMO_CFW_SSR_SESSIONS.list();
        for (const key in envVars.keys) {
          console.log(
            `worker.session.envVars.getSessionFromCookie.keys:\n${JSON.stringify(
              envVars.keys[key].name,
              null,
              2,
            )}`,
          );
        }
      }

      if (session) {
        const sessionJson: Session = JSON.parse(session);
        let logObj = escapeNestedKeys({ sessionJson }, [
          'token',
          'accessToken',
        ]);
        log(
          `worker.session.getSessionFromCookie.sessionJson:\n${JSON.stringify(
            logObj,
            null,
            2,
          )}`,
        );
        if (
          sessionJson.expires &&
          new Date(sessionJson.expires).getTime() >
            new Date(Date.now()).getTime()
        ) {
          console.log(
            `\tworker.session.getSessionFromCookie.NOT EXPIRED ${new Date(
              sessionJson.expires,
            ).toLocaleTimeString()} > ${new Date(
              Date.now(),
            ).toLocaleTimeString()}\n`,
          );
          res = sessionJson;
          user = sessionJson.user;
        } else {
          console.log(
            `\tworker.session.getSessionFromCookie.EXPIRED ${new Date(
              sessionJson.expires,
            ).toLocaleTimeString()} < ${new Date(
              Date.now(),
            ).toLocaleTimeString()}\n`,
          );
          await env.DEMO_CFW_SSR_SESSIONS.delete(sessionToken);
        }
      }
    }
  }
  return res;
}

async function generateSessionToken(
  env: Env,
  sessionId: string,
  log = logger(FILE_LOG_LEVEL, env),
): Promise<string> {
  // const token = crypto.getRandomenvVarss(new Uint32Array(1))[0].toString(16);
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
    log(`
    generateSessionToken.sign ${sign}\n
    generateSessionToken.signature ${signature.values()}\n
    generateSessionToken.signatureBase64 ${signatureBase64}\n
    `);
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
  log = logger(FILE_LOG_LEVEL, env),
) {
  const url = new URL(handler.req.url);
  const method = handler.req.method;
  let res;
  await clearExpiredSessions(env);
  // await clearAllKeys(env.DEMO_CFW_SSR, env, ['gitInfo']);
  // await clearAllKeys(env.DEMO_CFW_SSR_SESSIONS, env);
  // await clearAllKeys(env.DEMO_CFW_SSR_USERS, env);
  // await clearAllSessions(env);

  if (url.pathname.startsWith('/api/auth/session')) {
    log(`worker.api.auth.session.handleSession ${url.pathname}`);
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
          log(`worker.api.auth.session.handleSession.GET ${url.pathname}`);
          const sessionTokenParam = url.searchParams.get('sessionToken');
          session = JSON.parse(
            await env.DEMO_CFW_SSR_SESSIONS.get(sessionTokenParam),
          );
          res = await handler.handleRequest(env, ctx, session, 200, {
            withAuth: true,
          });
          break;
        case 'POST':
          log(`worker.api.auth.session.handleSession.POST ${url.pathname}`);
          session = await getSessionFromCookie(handler, env);
          if (session !== undefined) {
            res = await handler.handleRequest(env, ctx, { session }, 200, {
              withAuth: true,
            });
          } else {
            const sessionId = generateTypedUUID(16, 'session');
            const sessionToken = await generateSessionToken(env, sessionId);
            const user = await sessionUser(handler.user, env);
            log(`
            XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
            \tsessionToken -> ${sessionToken}\n\
            \tsessionId -> ${sessionId}
            `);
            session = {
              id: sessionId,
              user: user,
              userId: user.id,
              created: new Date(Date.now()),
              updated: new Date(Date.now()),
              expires: new Date(Date.now() + 1000 * 60 * 60 * 3),
              accessToken: user.token,
              sessionToken,
            };
            await env.DEMO_CFW_SSR_SESSIONS.put(
              sessionId,
              JSON.stringify(session),
            );

            res = await handler.handleRequest(env, ctx, { session }, 204, {
              withAuth: true,
            });
          }
          break;
        case 'DELETE':
          await env.DEMO_CFW_SSR_SESSIONS.delete(handler.user.sub);
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
        `Error: worker.api.auth.session.handleSession.error.method ${method}`,
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
  log(
    `worker.api.auth.session.handleSession.res ${JSON.stringify(res, null, 2)}`,
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

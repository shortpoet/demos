import { isValidJwt } from '../auth';
import { Env } from '../../types';
import {
  createJsonResponse,
  generateTypedUUID,
  generateUUID,
  logLevel,
} from '../../util';
import { RequestHandler } from '../RequestHandler';
import { Session, User } from '../../../types';
import { getUser, sessionUser } from '../auth/user';

const FILE_LOG_LEVEL = 'error';

export { handleNextAuth };

async function clearExpiredSessions(env: Env) {
  const envVars = await env.DEMO_CFW_SSR_SESSIONS.list();
  for (const key in envVars.keys) {
    // if (logLevel(FILE_LOG_LEVEL, env)) {
    //   console.log(
    //     'worker.session.clearExpiredSessions.envVars.keys',
    //     JSON.stringify(envVars.keys[key], null, 2),
    //   );
    // }

    const session: Session = JSON.parse(
      await env.DEMO_CFW_SSR_SESSIONS.get(envVars.keys[key].name),
    );
    if (new Date(session.expires).getTime() < new Date(Date.now()).getTime()) {
      if (logLevel(FILE_LOG_LEVEL, env)) {
        console.log(
          'worker.session.clearExpiredSessions.envVars.keys.expiration.delete',
          JSON.stringify(session, null, 2),
        );
      }
      await env.DEMO_CFW_SSR_SESSIONS.delete(envVars.keys[key].name);
    }
  }
}

async function clearAllKeys(kv: KVNamespace, env: Env, excludes = []) {
  const envVars = await kv.list();
  for (const key in envVars.keys) {
    if (excludes.includes(envVars.keys[key].name)) {
      continue;
    }
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(
        'worker.session.clearAllKeys.envVars.keys DELETE',
        JSON.stringify(envVars.keys[key].name, null, 2),
      );
    }
    await env.DEMO_CFW_SSR_SESSIONS.delete(envVars.keys[key].name);
  }
}

async function clearAllSessions(env: Env) {
  const envVars = await env.DEMO_CFW_SSR_SESSIONS.list();
  for (const key in envVars.keys) {
    if (!envVars.keys[key].name.startsWith('@session@')) {
      continue;
    }
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(
        'worker.session.clearAllKeys.envVars.keys',
        JSON.stringify(envVars.keys[key], null, 2),
      );
    }
    await env.DEMO_CFW_SSR_SESSIONS.delete(envVars.keys[key].name);
  }
}

async function getSessionFromCookie(
  handler: RequestHandler,
  env: Env,
  user?: User,
): Promise<Session | undefined> {
  const cookieName = 'demo-cfw-ssr-session-token';
  const sessionCookie = decodeURIComponent(handler.req.headers.get('Cookie'));
  // if (logLevel(FILE_LOG_LEVEL, env)) {
  //   console.log('worker.getSessionFromCookie.sessionCookie', sessionCookie);
  // }
  let res;
  if (sessionCookie) {
    const sessionToken = sessionCookie
      .split(`; `)
      .find((row) => {
        return row.startsWith(cookieName) && row.split('=')[1];
      })
      ?.split('=')[1];

    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(
        'worker.session.getSessionFromCookie.sessionToken',
        sessionToken,
      );
    }
    if (sessionToken) {
      const session = await env.DEMO_CFW_SSR_SESSIONS.get(sessionToken);

      if (logLevel(FILE_LOG_LEVEL, env)) {
        console.log('worker.session.getSessionFromCookie.session', session);
      }

      if (logLevel(FILE_LOG_LEVEL, env)) {
        const envVars = await env.DEMO_CFW_SSR_SESSIONS.list();
        for (const key in envVars.keys) {
          console.log(
            'worker.session.envVars.getSessionFromCookie.keys',
            JSON.stringify(envVars.keys[key].name, null, 2),
          );
        }
      }

      if (session) {
        const sessionJson: Session = JSON.parse(session);
        // console.log('worker.session.getSessionFromCookie.session', sessionJson);
        if (
          new Date(sessionJson.expires).getTime() >
          new Date(Date.now()).getTime()
        ) {
          console.log(
            `worker.session.getSessionFromCookie.NOT expired ${new Date(
              sessionJson.expires,
            ).getTime()} > ${new Date(Date.now()).getTime()}`,
          );
          res = sessionJson;
          if (logLevel(FILE_LOG_LEVEL, env)) {
            console.log(
              'worker.session.getSessionFromCookie.sessionJson',
              sessionJson,
            );
          }
          user = sessionJson.user;
        } else {
          console.log(
            `worker.session.getSessionFromCookie.expired ${new Date(
              sessionJson.expires,
            ).getTime()} < ${new Date(Date.now()).getTime()}`,
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
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('generateSessionToken.sign', sign);
      console.log('generateSessionToken.signature', signature.values());
      console.log('generateSessionToken.signatureBase64', signatureBase64);
    }
    out = `${payload}.${signatureBase64}`;
  } catch (error) {
    console.log('generateSessionToken.error', error);
  }
  return out;
}

async function handleNextAuth(
  handler: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
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
          if (logLevel(FILE_LOG_LEVEL, env)) {
            console.log('worker.api.auth.session.handleSession.get');
          }
          const sessionTokenParam = url.searchParams.get('sessionToken');
          session = JSON.parse(
            await env.DEMO_CFW_SSR_SESSIONS.get(sessionTokenParam),
          );
          res = await handler.handleRequest(env, ctx, session, 200, {
            withAuth: true,
          });
          break;
        case 'POST':
          if (logLevel(FILE_LOG_LEVEL, env)) {
            console.log('worker.api.auth.session.handleSession.post');
          }
          session = await getSessionFromCookie(handler, env);
          if (session !== undefined) {
            // console.log(
            //   'worker.api.auth.session.handleSession.post.session',
            //   session,
            // );
            res = await handler.handleRequest(env, ctx, session, 200, {
              withAuth: true,
            });
          } else {
            const sessionId = generateTypedUUID(16, 'session');
            const sessionToken = await generateSessionToken(env, sessionId);
            const user = await sessionUser(handler.user, env);
            if (logLevel(FILE_LOG_LEVEL, env)) {
              console.log(`sessionToken: 
          XXXXXXXXXXXXXXXXXXXXX
          ${sessionToken}
          `);
              console.log(`sessionId:
          XXXXXXXXXXXXXXXXXXXXX
          ${sessionId}
          `);
            }
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

            res = await handler.handleRequest(env, ctx, { sessionToken }, 204, {
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
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log(
      'worker.api.auth.session.handleSession.res',
      JSON.stringify(res, null, 2),
    );
  }

  return res;
}

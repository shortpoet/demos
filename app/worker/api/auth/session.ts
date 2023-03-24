import { isValidJwt } from '.';
import { Env } from '../../types';
import { createJsonResponse, generateUUID, logLevel } from '../../util';
import { RequestHandler } from '../RequestHandler';
import { Session, User } from '../types';

const FILE_LOG_LEVEL = 'debug';

export { handleSession };

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
          session = JSON.parse(await env.DEMO_CFW_SSR.get(handler.user.sub));
          res = await handler.handleRequest(env, ctx, session, 200, {
            withAuth: true,
          });
        case 'POST':
          session = {
            id: generateUUID(16),
            user: handler.user,
            userId: handler.user.sub,
            created: new Date(Date.now()),
            updated: new Date(Date.now()),
            expires: new Date(Date.now() + 1000 * 60 * 60 * 3),
            accessToken: handler.user.token,
            sessionToken: handler.user.token,
          };
          await env.DEMO_CFW_SSR.put(handler.user.sub, JSON.stringify(session));

          res = await handler.handleRequest(env, ctx, { result: 'Ok' }, 204, {
            withAuth: true,
          });
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

  return res;
}

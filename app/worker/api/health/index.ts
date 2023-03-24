/** source/controllers/posts.ts */
import { Env } from '../../types';
import { logLevel, msToTime } from '../../util';
import { RequestHandler } from '..';
import { createJsonResponse, generateUUID } from '../../util';
// @ts-expect-error
import rawManifest from '__STATIC_CONTENT_MANIFEST';
import { HealthCheck } from '../types';

const FILE_LOG_LEVEL = 'error';

export { handleHealth };

const healthCheckJson = async (handler: RequestHandler, env: Env) => {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.getHealth');
    // console.log('worker.getHealth.env');
    // console.log(await env.DEMO_CFW_SSR);
  }
  let gitInfo;
  try {
    gitInfo =
      env.ENVIRONMENT === 'dev'
        ? JSON.parse(await env.DEMO_CFW_SSR.get('gitInfo'))
        : JSON.parse(await env.DEMO_CFW_SSR.get('gitInfo'));
  } catch (error) {
    console.error('worker.getHealth.gitInfo.error');
    console.error(error);
  }
  let version = '';
  try {
    version = JSON.parse(rawManifest)['__STATIC_CONTENT_MANIFEST'];
  } catch (error) {
    console.error('worker.getHealth.healthCheckJson.version.error');
    console.error(error);
  }
  const res: HealthCheck = {
    status: 'OK',
    version,
    uptime: msToTime(process.uptime()),
    env: env.ENVIRONMENT,
    timestamp: new Date(Date.now()),
    gitInfo: gitInfo,
  };
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.getHealth.healthCheckJson.res');
    console.log(res);
  }
  return res;
};

const handleHealth = async (
  handler: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
) => {
  const url = new URL(handler.req.url);
  const method = handler.req.method;
  let res;

  if (url.pathname.startsWith('/api/health/debug')) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('worker.health.handleHealth.debug');
    }
    if (method === 'GET' || method === 'POST') {
      try {
        res = await handler.handleRequest(
          env,
          ctx,
          {
            handler: {
              ...handler,
              user: {
                ...handler.user,
                token: handler.user.token.substring(0, 8) + '...',
              },
            },
            req: handler.req,
            env,
            ctx,
            rawManifest: JSON.parse(rawManifest),
          },
          200,
          { withAuth: true },
        );
      } catch (error) {
        console.error('worker.health.handleHealth.debug.error');
        console.error(error);
        res = createJsonResponse(
          { error: 'worker.health.handleHealth.debug.error' },
          handler,
          env,
          404,
        );
      }
    }
  }

  if (url.pathname.startsWith('/api/health/check')) {
    if (method === 'GET' || method === 'POST') {
      if (logLevel(FILE_LOG_LEVEL, env)) {
        console.log('worker.health.handleHealth.check');
      }
      try {
        res = await handler.handleRequest(
          env,
          ctx,
          await healthCheckJson(handler, env),
          200,
          { withAuth: true },
        );
      } catch (error) {
        console.error('worker.health.handleHealth.check.error');
        console.error(error);
        res = createJsonResponse(
          { error: 'worker.health.handleHealth.check.error' },
          handler,
          env,
          404,
        );
      }

      // try {
      //   const healthCheck = await healthCheckJson(handler, env);
      //   if (logLevel(FILE_LOG_LEVEL, env)) {
      //     console.log(
      //       'worker.health.handleHealth.check.healthCheck',
      //       healthCheck,
      //     );
      //   }
      //   res = createJsonResponse(<HealthCheck>healthCheck, handler, env, 200);
      // } catch (error) {
      //   console.error('worker.health.handleHealth.check.error');
      //   console.error(error);
      //   res = createJsonResponse({ error: 'Not Found' }, handler, env, 404);
      // }
    }
  }

  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.health.handleHealth.res', JSON.stringify(res, null, 2));
    console.log({ req: handler.req, env, ctx, rawManifest });
  }
  return res;
};

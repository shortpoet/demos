/** source/controllers/posts.ts */
import { Env } from '../../types';
import { logLevel, msToTime } from '../../util';
import { RequestHandler } from '..';
import { createJsonResponse, generateUUID } from '../../util';
// @ts-expect-error
import rawManifest from '__STATIC_CONTENT_MANIFEST';
import { HealthCheck } from '../../../types';
import { KVNamespace } from '@cloudflare/workers-types';
import { escapeNestedKeys } from '../../../util';

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

const parseEnv = async (kv: KVNamespace) => {
  const envVars = await kv.list();
  const out = {};
  for (let [k, v] of Object.entries(envVars.keys)) {
    let logObj = escapeNestedKeys(JSON.parse(await kv.get(v.name)), [
      'token',
      'accessToken',
    ]);

    out[v.name] = logObj;
  }
  return out;
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
        let sanitizedToken = null;
        if (handler.user && handler.user.token) {
          sanitizedToken = handler.user.token.substring(0, 7);
          if (logLevel(FILE_LOG_LEVEL, env)) {
            console.log('worker.health.handleHealth.debug.sanitizedToken');
            console.log(sanitizedToken);
          }
        }
        const excludes = [
          'token',
          'accessToken',
          '__SECRET__',
          'ADMIN_USERS',
          'AUTH0_CLIENT_SECRET',
          'NEXTAUTH_SECRET',
          'AUTH0_CLIENT_ID',
        ];
        let handlerLog = escapeNestedKeys(handler, excludes);
        let envLog = escapeNestedKeys(env, excludes);
        res = await handler.handleRequest(
          env,
          ctx,
          {
            handler: handlerLog,
            req: handler.req,
            // TODO this is expensive, only do it if needed; add a flag to the request using params
            env: {
              ...envLog,
              // DEMO_CFW_SSR: await parseEnv(env.DEMO_CFW_SSR),
              DEMO_CFW_SSR_USERS: await parseEnv(env.DEMO_CFW_SSR_USERS),
              // DEMO_CFW_SSR_SESSIONS: await parseEnv(env.DEMO_CFW_SSR_SESSIONS),
            },
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
          { withAuth: false },
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

/** source/controllers/posts.ts */
import { Env } from '../../types';
import { logger, logLevel, msToTime } from '../../util';
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
  const log = logger(FILE_LOG_LEVEL, env);
  log('worker.healthCheckJson');
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
  log(`worker.getHealth.healthCheckJson.res: ${JSON.stringify(res)}`);
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
  const log = logger(FILE_LOG_LEVEL, env);
  log('worker.handleHealth');
  // TODO add commits with emojis endpoint

  try {
    switch (true) {
      case url.pathname.startsWith('/api/health/debug') &&
        (method === 'GET' || method === 'POST'):
        log('worker.health.handleHealth.debug');
        let sanitizedToken = null;
        if (handler.user && handler.user.token) {
          sanitizedToken = handler.user.token.substring(0, 7);
          if (logLevel(FILE_LOG_LEVEL, env)) {
            console.log('worker.health.handleHealth.debug.sanitizedToken');
            console.log(sanitizedToken);
          }
        }
        const excludes = ['token', 'ADMIN_USERS', 'secret', 'client_id'];
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
              // @ts-expect-error
              DEMO_CFW_SSR_USERS: await parseEnv(env.DEMO_CFW_SSR_USERS),
              // DEMO_CFW_SSR_SESSIONS: await parseEnv(env.DEMO_CFW_SSR_SESSIONS),
            },
            ctx,
            rawManifest: JSON.parse(rawManifest),
          },
          200,
          { withAuth: true },
        );
        break;
      case url.pathname.startsWith('/api/health') &&
        (method === 'GET' || method === 'POST'):
        log('worker.health.handleHealth');
        res = await handler.handleRequest(
          env,
          ctx,
          await healthCheckJson(handler, env),
          200,
          { withAuth: false },
        );
      default:
        log('worker.health.handleHealth.default');
        res = createJsonResponse(
          { error: 'worker.health.handleHealth.debug.error' },
          handler,
          env,
          404,
        );
        break;
    }
  } catch (error) {
    console.error('worker.health.handleHealth.error');
    console.error(error);
  }
  log(`
    worker.health.handleHealth.res\n
    ${JSON.stringify(res, null, 2)}\n
    ${{ req: handler.req, env, ctx, rawManifest }}'n
  `);
  return res;
};

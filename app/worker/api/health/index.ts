/** source/controllers/posts.ts */
import { Env } from '../../types';
import { logLevel, msToTime } from '../../util';
import { RequestHandler } from '../auth';
import { createJsonResponse, generateUUID } from '../../util';
import rawManifest from '__STATIC_CONTENT_MANIFEST';
import { HealthCheck } from '../types';

const FILE_LOG_LEVEL = 'debug';

export { handleHealth };

const healthCheckJson = async (req: RequestHandler, env: Env) => {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.getHealth');
  }
  console.log('worker.getHealth.env');
  console.log(await env.DEMO_CFW_SSR);
  const gitInfo =
    env.ENVIRONMENT === 'dev'
      ? JSON.parse(await env.DEMO_CFW_SSR.get('gitInfo'))
      : JSON.parse(await env.DEMO_CFW_SSR.get('gitInfo'));

  const res: HealthCheck = {
    status: 'OK',
    version: JSON.parse(rawManifest)['__STATIC_CONTENT_MANIFEST'],
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
  req: RequestHandler,
  env: Env,
  ctx: ExecutionContext,
) => {
  const url = new URL(req.url);
  const method = req.method;
  let res;

  if (url.pathname.startsWith('/api/health/debug')) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('worker.health.handleHealth.debug');
    }
    if (method === 'GET') {
      res = await req.handleRequest(
        req,
        env,
        ctx,
        { req, env, ctx, rawManifest: JSON.parse(rawManifest) },
        200,
        { withAuth: true },
      );
    }
  }

  if (url.pathname.startsWith('/api/health/check')) {
    if (method === 'GET') {
      if (logLevel(FILE_LOG_LEVEL, env)) {
        console.log('worker.health.handleHealth.check');
      }
      res = createJsonResponse(
        <HealthCheck>await healthCheckJson(req, env),
        req,
        env,
        200,
      );
    }
  }
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.health.handleHealth.res', JSON.stringify(res, null, 2));
    console.log({ req, env, ctx, rawManifest });
  }
  return res;
};

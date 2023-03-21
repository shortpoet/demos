import { Env } from '../types';
import { handleOptions, logLevel } from '.';
import { RequestHandler } from '../api/auth';

export { createJsonResponse, cloneResponse, cacheResponse };
const FILE_LOG_LEVEL = 'debug';

function cloneResponse(response: Response): Response[] {
  const { body } = response;
  const [body1, body2] =
    body && typeof body.tee === 'function' ? body.tee() : [body, body];
  return [new Response(body1, response), new Response(body2, response)];
}

function createJsonResponse(
  o: any,
  request: RequestHandler,
  env: Env,
  status: number = 200,
  statusText: string = 'OK',
  headers?: any,
) {
  return new Response(
    JSON.stringify(o),
    handleOptions(request, env, status, statusText, {
      ...headers,
      'Content-Type': 'application/json',
    }),
  );
}

async function cacheResponse(
  req: Request,
  env: Env,
  ctx: ExecutionContext,
  options: {
    cache?: Cache;
    cacheTTL: number;
  },
): Promise<Response> {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.cacheResponse');
    // console.log(JSON.stringify(request, null, 2));
  }
  // const cache = options?.cache || caches.default;
  // const cacheTTL = options?.cacheTTL || env.CACHE_TTL;
  // const cacheKey = new Request(req.url.toString(), req);
  // cacheKey.headers.set("Cache-Control", `max-age=${cacheTTL}`);

  const cacheUrl = new URL(req.url);

  // Construct the cache key from the cache URL
  const cacheKey = new Request(cacheUrl.toString(), req);
  const cache = caches.default;
  cacheKey.headers.set('Cache-Control', `s-max-age=${options.cacheTTL}`);

  let res = await cache.match(cacheKey);

  if (!res) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(
        `res for request url: ${req.url} not present in cache. Fetching and caching request.`,
      );
    }

    // If not in cache, get it from origin
    res = await fetch(req);

    // Must use res constructor to inherit all of res's fields
    res = new Response(res.body, res);

    // Cache API respects Cache-Control headers. Setting s-max-age to 10
    // will limit the res to be in cache for 10 seconds max

    // Any changes made to the res here will be reflected in the cached value
    res.headers.append('Cache-Control', 's-maxage=10');

    ctx.waitUntil(cache.put(cacheKey, res.clone()));
  } else {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(`Cache hit for: ${req.url}.`);
    }
  }
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.cacheResponse');
    console.log(
      `final res for request url: ${req.url} is: ${JSON.stringify(
        res,
        null,
        2,
      )}`,
    );
  }

  return res;
}

import { mapRequestToAsset, Options } from '@cloudflare/kv-asset-handler';
import { logLevel } from '.';
import { RequestHandler } from '../api';
import { Env, LogLevel, LOG_LOVELS } from '../types';

export { setCacheOptions, handleOptions, handleCors };
const FILE_LOG_LEVEL = 'debug';

function handleOptions(
  request: RequestHandler,
  env: Env,
  status: number = 200,
  statusText: string = 'OK',
  headers?: any,
) {
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.handleOptions');
    // console.log(JSON.stringify(request, null, 2));
  }
  return handleCors(request, env, status, statusText, headers);
}

function handleCors(
  request: RequestHandler,
  env: Env,
  status: number = 200,
  statusText: string = 'OK',
  headers?: any,
) {
  if (!request.headers) return;
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.handleCors');
  }
  // this is not technically allowed by spec but can be abused in other ways
  // https://stackoverflow.com/questions/1653308/access-control-allow-origin-multiple-origin-domains
  const allowedOrigins = [
    'https://cloudflare-workers-vue-dev.shortpoet.workers.dev',
    'https://cloudflare-workers-vue.shortpoet.workers.dev',
    'https://ssr-dev.shortpoet.com',
    'https://ssr.shortpoet.com',
    'http://localhost:3000',
  ];
  const allowedMethods = 'GET,POST,OPTIONS';
  const allowedMethodsAll = 'GET,HEAD,POST,OPTIONS,DELETE';
  const allowedHeaders = 'Content-Type,Authorization,X-Ping';
  const maxAge = 1728000;

  // const logAllHeader = request.headers.entries();
  // for (const [key, value] of logAllHeader) {
  //   console.log("worker.fetch", key, value);
  // }

  const tryLogHeader = (key: string, req) => {
    // console.log("worker.handleOptions.header.key", key);
    if (!req) return;
    if (!req.headers) return;
    const value = req.headers.get(key);
    if (value) {
      console.log('worker.handleOptions.header.value', key, value);
    }
  };

  const checkOrigin = (request) => {
    if (!request.headers) return;
    const origin = request.headers.get('Origin');
    return allowedOrigins.find((o) => o === origin);
  };
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.handleOptions.checkOrigin', checkOrigin(request || ''));
  }

  tryLogHeader('Origin', request);
  tryLogHeader('Authorization', request);
  tryLogHeader('X-Ping', request);
  tryLogHeader('Access-Control-Request-Method', request);
  tryLogHeader('Access-Control-Request-Headers', request);
  tryLogHeader('sec-fetch-dest', request);
  tryLogHeader('sec-fetch-mode', request);
  tryLogHeader('sec-fetch-site', request);

  // const checkOrigin = (request) => {
  //   if (!request.headers) return;
  //   const origin = request.headers.get("Origin");
  //   return allowedOrigins.find((o) => o === origin);
  // };
  // console.log(
  //   "worker.handleOptions.checkOrigin",
  //   checkOrigin(request.headers.get("Origin") || "")
  // );
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    // "Access-Control-Allow-Origin": checkOrigin(request),
    'Access-Control-Allow-Methods': `${allowedMethodsAll}`,
    'Access-Control-Allow-Headers': `${allowedHeaders}`,
    'Access-Control-Max-Age': `${maxAge}`,
  };

  if (
    request.headers.get('Origin') !== null &&
    (request.headers.get('X-Ping') === 'pong' ||
      request.headers.get('Authorization') !== null ||
      (request.headers.get('Access-Control-Request-Method') !== null &&
        request.headers.get('Access-Control-Request-Headers') !== null) ||
      request.isAuthenticated)
  ) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('worker.handleOptions: CORS');
      console.log('corsHeaders', JSON.stringify(corsHeaders, null, 2));
    }
    return new Response(null, {
      status,
      statusText,
      headers: {
        ...headers,
        ...corsHeaders,
      },
    });
  } else {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('worker.handleOptions: NO CORS');
    }

    return new Response(null, {
      status,
      statusText,
      headers: {
        ...headers,
        Allow: `${allowedMethods}`,
      },
    });
  }
}

function setCacheOptions(request: Request, DEBUG: boolean) {
  let options: Partial<Options> = {};
  const url = new URL(request.url);
  let browserTTL = 60 * 60 * 24 * 365; // 365 days
  let edgeTTL = 60 * 60 * 24 * 2; // 2 days

  if (DEBUG) {
    options.cacheControl = {
      bypassCache: true,
    };
  } else {
    options.cacheControl = {
      browserTTL,
      edgeTTL,
      bypassCache: false,
    };
  }

  return options;
}

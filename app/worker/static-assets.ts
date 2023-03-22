import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
export { handleStaticAssets };

import rawManifest from '__STATIC_CONTENT_MANIFEST';
import { setCacheOptions } from './util';
const KV_ASSET_NAMESPACE = 'CLOUDFLARE_WORKERS_VUE';

async function handleStaticAssets(request, env, ctx) {
  const DEBUG = env.LOG_LEVEL === 'debug';
  if (env.LOG_LEVEL === 'debug') {
    console.log('worker.handleStaticAssets');
  }
  let options = setCacheOptions(request, DEBUG);

  const getAssetFromKVArgs = {
    request,
    waitUntil(promise) {
      return ctx.waitUntil(promise);
    },
  };

  try {
    try {
      if (env.LOG_LEVEL === 'debug') {
        console.log('worker.handleStaticAssets.getAssetFromKV');
      }
      options = {
        ...options,
        ASSET_NAMESPACE:
          '__STATIC_CONTENT' in env ? env.__STATIC_CONTENT : undefined,
        ASSET_MANIFEST:
          '__STATIC_CONTENT_MANIFEST' in env
            ? env.__STATIC_CONTENT_MANIFEST
            : JSON.parse(rawManifest),
      };
      const page = await getAssetFromKV(getAssetFromKVArgs, options);
      const response = new Response(page.body, page);
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('Referrer-Policy', 'unsafe-url');
      response.headers.set('Feature-Policy', 'none');

      return response;
    } catch (error) {
      console.error('error', error);
      return new Response(error.message || error.toString(), { status: 500 });
    }
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(getAssetFromKVArgs, {
          mapRequestToAsset: (req) =>
            new Request(`${new URL(req.url).origin}/404.html`, req),
        });

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404,
        });
      } catch (e) {
        console.error('error', e);
      }
    }

    return new Response(e.message || e.toString(), { status: 500 });
  }
}

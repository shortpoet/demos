import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
export { handleStaticAssets };
// @ts-expect-error
import rawManifest from "__STATIC_CONTENT_MANIFEST";
import { Env } from "./types";
import { setCacheOptions } from "./util";

async function handleStaticAssets(
  request: Request,
  env: Env,
  ctx: ExecutionContext
) {
  const DEBUG = env.LOG_LEVEL === "debug";
  let options = setCacheOptions(request, DEBUG);

  const getAssetFromKVArgs = {
    request,
    waitUntil(promise: Promise<any>) {
      return ctx.waitUntil(promise);
    },
  };

  try {
    try {
      options = {
        ...options,
        ASSET_NAMESPACE:
          "__STATIC_CONTENT" in env ? env.__STATIC_CONTENT : undefined,
        ASSET_MANIFEST:
          "__STATIC_CONTENT_MANIFEST" in env
            ? env.__STATIC_CONTENT_MANIFEST
            : JSON.parse(rawManifest),
      };
      const page = await getAssetFromKV(getAssetFromKVArgs, options);
      const response = new Response(page.body, page);
      response.headers.set("X-XSS-Protection", "1; mode=block");
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("Referrer-Policy", "unsafe-url");
      response.headers.set("Feature-Policy", "none");

      return response;
    } catch (error: any) {
      console.log("error", error);
      return new Response(error.message || error.toString(), { status: 500 });
    }
  } catch (e: any) {
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
      } catch (e: any) {
        console.log("error", e);
      }
    }

    return new Response(e.message || e.toString(), { status: 500 });
  }
}

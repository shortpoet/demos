import { mapRequestToAsset, Options } from "@cloudflare/kv-asset-handler";

export { setCacheOptions, isAssetURL };

const isAssetURL = (url: URL) => url.pathname.startsWith("/assets/");

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

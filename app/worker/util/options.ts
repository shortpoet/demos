import { Options } from "@cloudflare/kv-asset-handler";
export { setCacheOptions };

const tryLogHeader = (key: string, req: Request) => {
  // console.log("worker.handleOptions.header.key", key);
  if (!req) return;
  if (!req.headers) return;
  const value = req.headers.get(key);
  if (value) {
    if (key === "Authorization") {
      console.log(
        "worker.handleOptions.header.value",
        key,
        `${value.slice(0, 15)}...`
      );
      return;
    }
    console.log("worker.handleOptions.header.value", key, value);
  } else {
    console.log("worker.handleOptions.header.value", key, "undefined");
  }
};

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

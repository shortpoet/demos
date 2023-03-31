import { Options } from "@cloudflare/kv-asset-handler";
export { setCacheOptions, handleCors };

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

function handleCors(
  req: Request,
  status: number = 200,
  statusText: string = "OK",
  headers?: any
) {
  console.log("handleCors");
  tryLogHeader("Origin", req);
  tryLogHeader("Authorization", req);
  tryLogHeader("X-Ping", req);
  tryLogHeader("Access-Control-Request-Method", req);
  tryLogHeader("Access-Control-Request-Headers", req);
  tryLogHeader("sec-fetch-dest", req);
  tryLogHeader("sec-fetch-mode", req);
  tryLogHeader("sec-fetch-site", req);

  if (!req.headers) return;
  // this is not technically allowed by spec but can be abused in other ways
  // https://stackoverflow.com/questions/1653308/access-control-allow-origin-multiple-origin-domains
  const allowedOrigins = [
    "https://cloudflare-workers-vue-dev.shortpoet.workers.dev",
    "https://cloudflare-workers-vue.shortpoet.workers.dev",
    "https://ssr-dev.shortpoet.com",
    "https://ssr.shortpoet.com",
    "http://localhost:3000",
  ];
  const allowedMethods = "GET,POST,OPTIONS";
  const allowedMethodsAll = "GET,HEAD,POST,OPTIONS,DELETE";
  const allowedHeaders = "Content-Type,Authorization,X-Ping";
  const maxAge = 1728000;

  const checkOrigin = (request: Request) => {
    if (!request.headers) return;
    const origin = request.headers.get("Origin");
    return allowedOrigins.find((o) => o === origin);
  };

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    // "Access-Control-Allow-Origin": checkOrigin(request),
    "Access-Control-Allow-Methods": `${allowedMethodsAll}`,
    "Access-Control-Allow-Headers": `${allowedHeaders}`,
    "Access-Control-Max-Age": `${maxAge}`,
  };

  const hasOrigin =
    req.headers.get("Origin") !== null ||
    // adding this to allow localhost testing
    req.headers.get("host") !== null;

  console.log("hasOrigin", hasOrigin);
  console.log("host", req.headers.get("host"));

  const isPingPong = req.headers.get("X-Ping") === "pong";
  console.log("isPingPong", isPingPong);
  const isAuth = req.headers.get("Authorization") !== null;
  console.log("isAuth", isAuth);

  const isACRM = req.headers.get("Access-Control-Request-Method") !== null;
  console.log("isACRM", isACRM);
  const isACRH = req.headers.get("Access-Control-Request-Headers") !== null;
  console.log("isACRH", isACRH);

  if (hasOrigin && (isPingPong || isAuth || (isACRM && isACRH))) {
    console.log("handleCors: preflight");
    return new Response(null, {
      status,
      statusText,
      headers: {
        ...headers,
        ...corsHeaders,
      },
    });
  } else {
    console.log("handleCors: normal");
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

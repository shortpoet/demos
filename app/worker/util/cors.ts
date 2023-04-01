// https://github.com/kwhitley/itty-cors/blob/2b5811ed21da9bfa9cdac36437a8801a686a1708/src/itty-cors.ts
interface CorsOptions {
  origins?: string | string[];
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
  headers?: any;
}

export const useCors = (options: CorsOptions = {}) => {
  // @ts-ignore
  const {
    origins = ["*"],
    methods = ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders = ["Content-Type", "Authorization", "X-Ping"],
    exposedHeaders = ["Content-Type", "Authorization", "X-Ping"],
    credentials = true,
    maxAge = 1728000,
    headers = {},
  } = options;

  // console.log("useCors", options);

  let allowOrigin: any;

  const originsArray =
    typeof origins === "string" ? origins.split(",") : origins;

  const exposed =
    typeof exposedHeaders === "string"
      ? exposedHeaders
      : exposedHeaders.join(", ");

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
  // The CORS-safelisted response headers are: Cache-Control, Content-Language, Content-Length, Content-Type, Expires, Last-Modified, Pragma. To expose a non-CORS-safelisted response header, you can specify:
  // Access-Control-Expose-Headers: Content-Encoding
  // For requests without credentials, a server can also respond with a wildcard value:
  // However, this won't wildcard the Authorization header, so if you need to expose that, you will need to list it explicitly:
  // Access-Control-Expose-Headers: *, Authorization

  const responseHeaders = {
    "Access-Control-Allow-Methods":
      typeof methods === "string" ? methods : methods.join(", "),
    "Access-Control-Allow-Headers":
      typeof allowedHeaders === "string"
        ? allowedHeaders
        : allowedHeaders.join(", "),
    ...headers,
  };

  if (maxAge) {
    responseHeaders["Access-Control-Max-Age"] = maxAge;
  }

  const preflight = (req: Request) => {
    const useMethods = [...new Set(["OPTIONS", ...methods])];
    const origin = req.headers.get("Origin") || "";

    allowOrigin =
      originsArray.includes(origin) || originsArray.includes("*")
        ? { "Access-Control-Allow-Origin": origin }
        : false;

    const validPreflight =
      req.headers.has("Access-Control-Request-Method") &&
      req.headers.has("Access-Control-Request-Headers") &&
      req.headers.has("Origin");

    if (req.method === "OPTIONS") {
      if (validPreflight) {
        // custom check/reject requested method and headers
        const headers = {
          ...responseHeaders,
          ...allowOrigin,
          "Access-Control-Allow-Credentials": credentials ? "true" : "false",
          "Access-Control-Expose-Headers": exposed,
          "Access-Control-Allow-Methods": useMethods.join(", "),
        };
        return new Response(null, { headers });
      }

      return new Response(null, {
        headers: {
          Allow: useMethods.join(", "),
        },
      });
    }
  };

  const corsify = (res: Response) => {
    if (!res) {
      throw new Error(
        "No fetch handler responded and no upstream to proxy specified"
      );
    }
    const { headers, status, body } = res;
    if (status === 101) {
      // protocol switch/shift (websocket?) bypass
      return res;
    }
    const incomingHeaders = Object.fromEntries(headers);
    if (incomingHeaders["access-control-allow-origin"]) {
      // already has cors headers
      return res;
    }
    return new Response(body, {
      status,
      headers: {
        ...incomingHeaders,
        ...responseHeaders,
        ...allowOrigin,
        "Access-Control-Allow-Credentials": credentials ? "true" : "false",
        "Access-Control-Expose-Headers": exposed,
        "content-type": headers.get("content-type"),
      },
    });
  };
  return { preflight, corsify };
};

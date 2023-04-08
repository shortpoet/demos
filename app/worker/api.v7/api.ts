//  https://github.com/unjs/unenv/blob/e4e5d39aea36b4f7905d519d575de133564fd1cf/src/runtime/fetch/call.ts
// https://github.com/JamieCurnow/h3-worker
import { listen } from "listhen";
import { fetch } from "node-fetch-native";
import {
  createApp,
  createRouter,
  eventHandler,
  toNodeListener,
  createError,
  proxyRequest,
  useSession,
  defineEventHandler,
  useBase,
  fromNodeMiddleware,
  isPreflightRequest,
  handleCors,
  appendCorsHeaders,
  appendCorsPreflightHeaders,
  H3CorsOptions,
  isCorsOriginAllowed,
  H3Event,
  sendNoContent,
} from "h3";
import { Env } from "../types";
import {
  __healthCheck,
  _healthCheck,
  healthCheck,
  healthCheckH3,
} from "../handlers";
import data from "../../data/data.json";
// import { corsOpts, useCors } from "../util";
// const { preflight, corsify } = useCors(corsOpts);
// export { corsify };
import type { ExecutionContext } from "@cloudflare/workers-types";
import { createCall } from "unenv/runtime/fetch/index";
import { requestHasBody, useRequestBody } from "./utils/body";
// import { EventEmitter } from "node:events";

// const emitter = new EventEmitter();
// emitter.on("test", (data) => {
//   console.log("emitter.on -> data", data);
// });

export { Api };

// const Api = {
//   handle: handle(app),
// };

const Api = {
  handle: async (
    req: Request,
    resp: Response,
    env: Env,
    ctx: ExecutionContext
  ) => {
    console.log("Api.handle -> v7");
    // const out = app.handler({ req, env, ctx });
    // console.log("Api.handle -> out", out);
    // const handle = useBase("/api", router.handler);
    const localCall = createCall(toNodeListener(app) as any);
    // make a new url
    const url = new URL(req.url);

    // handle body
    let body;
    if (requestHasBody(req)) {
      body = await useRequestBody(req);
    }
    console.log("Api.handle -> localCall");
    // call the handler
    const r = await localCall({
      context: {
        // https://developers.cloudflare.com/workers//runtime-apis/request#incomingrequestcfproperties
        cf: (req as any).cf,
        env,
        ctx,
      },
      url: url.pathname + url.search,
      host: url.hostname,
      protocol: url.protocol,
      // @ts-ignore
      headers: req.headers,
      method: req.method,
      redirect: req.redirect,
      body,
    });

    // return the response
    return new Response(r.body, {
      // @ts-ignore
      headers: r.headers,
      status: r.status,
      statusText: r.statusText,
    });
    return new Response("Hello World");
  },
};

const app = createApp({ debug: true });
const router = createRouter()
  // .options("*", (e) => {
  //   console.log("router.options -> e", e);
  //   if (isPreflightRequest(e)) {
  //     appendCorsPreflightHeaders(e, corsOpts);
  //     return new Response(null, {
  //       status: 204,
  //     });
  //   }
  //   return new Response("ok");
  // })
  .get(
    "/api/test",
    defineEventHandler(() => "Hello World")
  )
  .get(
    "/api/hello",
    defineEventHandler(() => ({ hello: "world" }))
  )
  // .get(
  //   "/api/json-data",
  //   defineEventHandler((e) => {
  //     console.log("json-data -> e", e);
  //     return data;
  //   })
  // )
  .get("/api/json-data", jsonData)
  // .get(
  //   "/api/json-data",
  //   defineEventHandler(() => data)
  // )
  // .get(
  //   "/api/json-data",
  //   eventHandler(async (event) => {
  //     console.log("json-data -> event", event);
  //     return data;
  //   })
  // )
  .get(
    "/api",
    eventHandler((event) =>
      proxyRequest(event, "http://icanhazip.com", {
        fetch,
      })
    )
  )
  .get(
    "/api/error/:code",
    eventHandler((event) => {
      throw createError({
        statusCode: Number.parseInt(event.context.params?.code || ""),
      });
    })
  )
  .get(
    "/api/hello/:name",
    eventHandler(async (event) => {
      const password = "secretsecretsecretsecretsecretsecretsecret";
      const session = await useSession<{ ctr: number }>(event, {
        password,
        maxAge: 5,
      });
      await session.update((data) => ({ ctr: Number(data.ctr || 0) + 2 }));
      await session.update({ ctr: Number(session.data.ctr || 0) - 1 });
      return `Hello ${event.context.params?.name}! (you visited this page ${session.data.ctr} times. session id: ${session.id})`;
    })
  )
  .get(
    "/api/health/check",
    async (e) =>
      await healthCheckH3(e.node.req, e.node.res, e.node.req["__unenv__"].env)
  )
  .get(
    "/api/health/check2",
    async (e) =>
      await healthCheckH3(e.node.req, e.node.res, e.node.req["__unenv__"].env)
  );
const corsOpts: H3CorsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3333",
    "https://demos-dev.shortpoet.com",
  ],
  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS",
    "HEAD",
    "PATCH",
    "TRACE",
    "CONNECT",
  ],
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "X-Ping",
    // ""
  ],
  exposeHeaders: ["Content-Type", "Authorization", "X-Ping"],
  credentials: true,
  maxAge: "86400",
  preflight: {
    statusCode: 200,
  },
};

app.use(
  eventHandler((event) => {
    if (isPreflightRequest(event)) {
      appendCorsPreflightHeaders(event, corsOpts);
      sendNoContent(event, corsOpts.preflight?.statusCode);
      return true;
    }
    appendCorsHeaders(event, corsOpts);
  })
);

// app.use(
//   // from fromNodeMiddleware fails in cloudflare
//   // r.off is not a function
//   fromNodeMiddleware((req, res, next) => {
//     console.log("fromNodeMiddleware -> res", res);
//     const event = new H3Event(req, res);
//     if (isPreflightRequest(event)) {
//       appendCorsPreflightHeaders(event, corsOpts);
//       sendNoContent(event, corsOpts.preflight?.statusCode);
//       return true;
//     }
//     appendCorsHeaders(event, corsOpts);
//     next();
//   })
// );

app.use(router);

// export default useBase('/api', router.handler)

// listen(toNodeListener(app));

async function jsonData(event: H3Event) {
  // console.log("jsonData -> event", event);
  // console.log("jsonData -> event.keys", Object.keys(event.node.req));
  // console.log("jsonData -> event", Object.keys(event.node.req));
  // console.log("jsonData -> event", Object.keys(event.node.res));
  console.log(
    "jsonData -> event.__unenv__",
    event.node.req["__unenv__"].env.API_VERSION
  );
  console.log("jsonData -> event.context", event.context);
  // await appendCorsHeaders(event, corsOpts);
  // console.log(event.node.req.headers);
  return data;
}

//  https://github.com/unjs/unenv/blob/e4e5d39aea36b4f7905d519d575de133564fd1cf/src/runtime/fetch/call.ts
// https://github.com/JamieCurnow/h3-worker
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
  isPreflightRequest,
  appendCorsHeaders,
  appendCorsPreflightHeaders,
  H3CorsOptions,
  H3Event,
  sendNoContent,
} from "h3";
import { Env } from "../types";
import { healthCheckH3 } from "../handlers";
import data from "../../data/data.json";
import type { ExecutionContext } from "@cloudflare/workers-types";
import { createCall } from "unenv/runtime/fetch/index";
import { requestHasBody, useRequestBody } from "./utils/body";

export { Api };

const Api = {
  handle: async (
    req: Request,
    resp: Response,
    env: Env,
    ctx: ExecutionContext
  ) => {
    console.log("Api.handle -> v7");
    const localCall = createCall(toNodeListener(app) as any);
    const url = new URL(req.url);
    let body;
    if (requestHasBody(req)) {
      body = await useRequestBody(req);
    }
    console.log("Api.handle -> localCall");
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
  },
};

const app = createApp({ debug: true });
const router = createRouter()
  .get(
    "/api/test",
    defineEventHandler(() => "Hello World")
  )
  .get(
    "/api/hello",
    defineEventHandler(() => ({ hello: "world" }))
  )
  .get("/api/json-data", jsonData)
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

app.use(router);

async function jsonData(event: H3Event) {
  console.log(
    "jsonData -> event.__unenv__",
    event.node.req["__unenv__"].env.API_VERSION
  );
  console.log("jsonData -> event.context", event.context);
  return data;
}

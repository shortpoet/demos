// https://github.com/honojs/hono/blob/3317ca128a7ae4a83cecea09f2d7ff647b577a3b/src/adapter/cloudflare-pages/handler.ts
import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../types";
import { __healthCheck, _healthCheck, healthCheck } from "../handlers";
import data from "../../data/data.json";
import { corsOpts, useCors } from "../util";
const { preflight, corsify } = useCors(corsOpts);
export { corsify };

const app = new Hono();

export { Api };

// const Api = {
//   handle: handle(app),
// };

const Api = {
  handle: (req: Request, resp: Response, env: Env, ctx: ExecutionContext) => {
    console.log("Api.handle -> v6");
    const out = app.fetch(req, env, ctx);
    // console.log("Api.handle -> out", out);
    return out;
  },
};

const route = app
  .basePath("/api")
  .options("*", (c) => {
    return Promise.resolve(preflight(c.req));
  })
  .get(
    "/hello-name",
    zValidator(
      "query",
      z.object({
        name: z.string(),
      })
    ),
    (c) => {
      const { name } = c.req.valid("query");
      return c.jsonT({
        message: `Hello ${name}!`,
      });
    }
  )
  .get("/json-data", jsonData)
  .get("/hello", () => {
    return Promise.resolve(
      corsify(
        new Response(JSON.stringify({ hello: "world" }), {
          headers: { "content-type": "application/json" },
        })
      )
    );
  })
  .get("/health/check", async (c) =>
    Promise.resolve(corsify(await healthCheck(c.req, c.res, c.env)))
  )
  // Also typing for this
  // using c: any for now
  .get("/health/check2", __healthCheck);

function jsonData(c: any) {
  // TODO figure out typing for c Context
  // WARN this env has __SECRET__
  console.log(c.env);
  return Promise.resolve(
    corsify(
      new Response(JSON.stringify(data, null, 2), {
        headers: { "content-type": "application/json" },
      })
    )
  );
}

export type AppType = typeof route;

// export const onRequest = handle(app)

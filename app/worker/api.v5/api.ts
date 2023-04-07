import { IRequest, RequestLike, Router } from "./router";
import data from "../../data/data.json";
import { healthCheck, _healthCheck } from "../handlers";
import { corsOpts, useCors } from "../util";
import { Env } from "../types";
import { ServerResponse } from "http";
const { preflight, corsify } = useCors(corsOpts);
export { corsify };

// declare a custom Request type to allow request injection from middleware
type RequestWithAuthors = {
  authors?: string[];
} & IRequest;

// middleware that modifies the request
const withAuthors = (request: IRequest) => {
  request.authors = ["foo", "bar"];
};

const Api = Router({ base: "/api" });

export { Api };

Api.all("*", () => {})
  .options("*", preflight)
  .get("/authors", withAuthors, (request: RequestWithAuthors) => {
    // return request.authors?.[0];
    return Promise.resolve(
      corsify(
        new Response(JSON.stringify({ authors: request.authors }), {
          headers: { "content-type": "application/json" },
        })
      )
    );
  })
  .get("/hello", (req: RequestLike) => {
    // console.log("req", req);
    console.log(`hello world!`);
    return Promise.resolve(
      corsify(
        new Response(JSON.stringify({ hello: "world" }), {
          headers: { "content-type": "application/json" },
        })
      )
    );
  })
  .get("/json-data", jsonData)
  .get("/health/check", async (req: IRequest, res: ServerResponse, env: Env) =>
    Promise.resolve(corsify(await healthCheck(req, res, env)))
  )
  .get("/health/check2", _healthCheck)
  // catch-all not found
  .all("*", (req: RequestLike) => {
    return Promise.resolve(
      corsify(
        new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        })
      )
    );
  });

function jsonData() {
  return Promise.resolve(
    corsify(
      new Response(JSON.stringify(data, null, 2), {
        headers: { "content-type": "application/json" },
      })
    )
  );
}

// const loggerMiddleware = (req: Request, res: Response, next: () => void) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   next();
// };

// Api.handle(
//   { url: "/api/users?id=123", method: "GET", query: {} },
//   loggerMiddleware
// );

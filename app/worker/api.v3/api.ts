import { Handler, RequestLike, Router } from "./router";
import data from "../../data/data.json";
import { healthCheck, _healthCheck } from "../handlers";
import { corsOpts, useCors } from "../util";
const { preflight, corsify } = useCors(corsOpts);
export { corsify };

const Api = Router({
  base: "/api",
  routes: {
    "*": {
      // all: [() => Promise.resolve(undefined)],
      options: [(req) => Promise.resolve(preflight(req))],
    },
    "/hello": {
      get: [
        (req: RequestLike) => {
          // console.log("req", req);
          console.log(`hello world!`);
          return Promise.resolve(
            corsify(
              new Response(JSON.stringify({ hello: "world" }), {
                headers: { "content-type": "application/json" },
              })
            )
          );
        },
      ],
    },
    "/json-data": {
      get: [jsonData],
    },
    "/health/check2": {
      get: [
        async (req, res, env) =>
          Promise.resolve(corsify(await healthCheck(req, res, env))),
      ],
    },
    "/health/check": {
      get: [_healthCheck],
    },
    // "/users": { get: [getUser], post: [createUser] },
    // "/users/:userId": {
    //   get: [userHandler],
    // },
  },
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

export { Api };

// const loggerMiddleware = (req: Request, res: Response, next: () => void) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   next();
// };

// Api.handle(
//   { url: "/api/users?id=123", method: "GET", query: {} },
//   loggerMiddleware
// );

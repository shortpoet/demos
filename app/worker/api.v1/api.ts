import { Handler, Router } from "./router";
import data from "../../data/data.json";
import { healthCheck, _healthCheck } from "../handlers";
import { corsOpts, useCors } from "../util";
const { preflight, corsify } = useCors(corsOpts);
export { corsify };

const Api = Router();

Api.use((req) => {
  if (new URL(req.url).port === "3333") {
    console.log(`
  \nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  ${new Date().toLocaleTimeString()}
  Api.use -> ${req.method} -> ${req.url} -> content-type: ${req.headers.get(
      "Content-Type"
    )}\n
`);
  }
  return Promise.resolve(undefined);
});

Api.use((req) => {
  return Promise.resolve(preflight(req));
});

Api.use((req: Request): Promise<Response | undefined> => {
  const path = new URL(req.url).pathname;
  if (path === "/api/hello") {
    return Promise.resolve(
      corsify(
        new Response(JSON.stringify({ hello: "world" }), {
          headers: { "content-type": "application/json" },
        })
      )
    );
  }
  return Promise.resolve(undefined);
});

Api.use((req) => {
  const path = new URL(req.url).pathname;
  if (path === "/api/json-data") {
    return Promise.resolve(
      corsify(
        new Response(JSON.stringify(data, null, 2), {
          headers: { "content-type": "application/json" },
        })
      )
    );
  }
  return Promise.resolve(undefined);
});

// using the origin derived from the preflight call in this file
// Api.use(async (req, env) => {
//   const path = new URL(req.url).pathname;
//   if (path === "/api/health/check") {
//     const corsified = corsify(await healthCheck(req, env));
//     console.log(
//       `about to return allowed ${JSON.stringify(
//         corsified.headers.get("Access-Control-Allow-Origin"),
//         null,
//         2
//       )}`
//     );
//     return Promise.resolve(corsified);
//   }
//   return Promise.resolve(undefined);
// });

// using  the origin derived from the exported corsify function
Api.use(_healthCheck);

export { Api };

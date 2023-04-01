import { Router } from "./router";
import data from "./data.json";
import { handleCors } from "../util";

const Api = Router();

Api.use((req) => {
  console.log(`
  \nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  ${new Date().toLocaleTimeString()}
  worker.fetch -> ${req.method} -> ${
    req.url
  } -> content-type: ${req.headers.get("Content-Type")}\n
`);

  console.log(`Api.use -> ${req.method} ${req.url}`);
  return Promise.resolve(undefined);
});

// Api.use((req) => {
//   if (req.method === "OPTIONS") {
//     console.log(`Api.use OPTIONS -> ${req.method} ${req.url}`);
//     return Promise.resolve(
//       handleCors(req)
//       // handleCors(req, 200, "Ok", {
//       //   "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
//       //   "Access-Control-Allow-Headers": "Content-Type, Authorization",
//       //   "Access-Control-Max-Age": "86400",
//       //   "Access-Control-Allow-Origin": "*",
//       // })
//     );
//   } else {
//     return Promise.resolve(undefined);
//   }
// });

Api.use((req: Request): Promise<Response | undefined> => {
  const path = new URL(req.url).pathname;
  if (path === "/api/hello") {
    return Promise.resolve(
      new Response(JSON.stringify({ hello: "world" }), {
        headers: { "content-type": "application/json" },
      })
    );
  }
  return Promise.resolve(undefined);
});

Api.use((req) => {
  const path = new URL(req.url).pathname;
  if (path === "/api/json-data") {
    return Promise.resolve(
      new Response(JSON.stringify(data, null, 2), {
        headers: { "content-type": "application/json" },
      })
    );
  }
  return Promise.resolve(undefined);
});

export { Api };

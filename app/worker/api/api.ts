import { Router } from "./router";
import data from "./data.json";
import { useCors } from "../util";

const Api = Router();

const { preflight, corsify } = useCors({
  origins: ["*"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Ping",
    // ""
  ],
  exposedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Ping",
    // ""
  ],
});

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

export { Api };

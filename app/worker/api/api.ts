import { Router } from "./router";
import data from "./data.json";
const Api = Router();

Api.use((req) => {
  console.log(`Api.use -> ${req.method} ${req.url}`);
  return Promise.resolve(undefined);
});

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
  if (path === "/api/data") {
    return Promise.resolve(
      new Response(JSON.stringify(data, null, 2), {
        headers: { "content-type": "application/json" },
      })
    );
  }
  return Promise.resolve(undefined);
});

export { Api };

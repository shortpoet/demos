// @ts-nocheck
// interface Request {
//   url: string;
//   params?: { [key: string]: string };
//   body?: any;
// }

interface Response {
  status: number;
  body?: any;
}

interface RouteHandler {
  (req: Request, ...args: any[]): Promise<Response | undefined>;
}

interface Route {
  method: string;
  path: RegExp;
  handlers: RouteHandler[];
}

interface Router {
  routes: Route[];
  handle: (req: Request, ...args: any[]) => Promise<Response | undefined>;
}

interface RouterOptions {
  base?: string;
  routes?: Route[];
}

function createRouter({ base = "", routes = [] }: RouterOptions = {}): Router {
  const router: Router = {
    routes,
    async handle(req: Request, ...args: any[]): Promise<Response | undefined> {
      let response: Response | undefined;
      let match: RegExpExecArray | null;
      const url = new URL(req.url);

      for (const { method, path, handlers } of routes) {
        if (
          (method === req.method || method === "ALL") &&
          (match = path.exec(url.pathname))
        ) {
          req.params = match.groups ?? {};
          for (const handler of handlers) {
            response = await handler(req, ...args);
            if (response) {
              return response;
            }
          }
        }
      }
      return undefined;
    },
  };

  return router;
}

function applyMiddleware(router: Router, ...middlewares: RouteHandler[]): void {
  for (const route of router.routes) {
    route.handlers.unshift(...middlewares);
  }
}

const router = createRouter({
  base: "/api",
  routes: [
    {
      method: "GET",
      path: /^\/users\/(?<id>\d+)$/,
      handlers: [(req) => ({ id: req.params?.id })],
    },
    {
      method: "POST",
      path: /^\/users$/,
      handlers: [(req) => ({ body: req.body })],
    },
  ],
});

applyMiddleware(router, async (req, next) => {
  console.log("Incoming Request:", req.url);
  const res = await next(req);
  console.log("Response:", res);
  return res;
});

const http = require("http");

http
  .createServer(async (req, res) => {
    const response = await router.handle({
      url: req.url,
      body: req.body,
      method: req.method,
    });

    if (!response) {
      res.writeHead(404);
      res.end();
    } else {
      res.writeHead(response.status, {
        "Content-Type": "application/json",
      });
      res.write(JSON.stringify(response.body));
      res.end();
    }
  })
  .listen(3000);

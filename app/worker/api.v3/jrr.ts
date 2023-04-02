// @ts-nocheck
import http, { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

type RouteHandler = (req: RequestLike, ...args: any[]) => Promise<any>;
type RouterType = {
  routes: any[];
  handle: (
    req: IncomingMessage,
    res: ServerResponse,
    ...args: any[]
  ) => Promise<void>;
};
type RequestLike = IncomingMessage & {
  params?: { [key: string]: any };
  query?: { [key: string]: any };
  proxy?: any;
  body?: any;
};
type Middleware = (handler: RouteHandler) => RouteHandler;

interface RouterOptions {
  base?: string;
  routes?: [string, string | RegExp, RouteHandler[]][];
}

const createRouter = ({
  base = "",
  routes = [],
}: RouterOptions = {}): RouterType => ({
  // @ts-ignore
  __proto__: new Proxy({} as RouterType, {
    get:
      (target, prop: string, receiver) =>
      (route: string, ...handlers: RouteHandler[]) =>
        routes.push([
          prop.toUpperCase(),
          RegExp(
            `^${
              (base + route)
                .replace(/(\/?)\*/g, "($1.*)?") // trailing wildcard
                .replace(/(\/$)|((?<=\/)\/)/, "") // remove trailing slash or double slash from joins
                .replace(/(:(\w+)\+)/, "(?<$2>.*)") // greedy params
                .replace(/:(\w+)(\?)?(\.)?/g, "$2(?<$1>[^/]+)$2$3") // named params
                .replace(/\.(?=[\w(])/, "\\.") // dot in path
                .replace(/\)\.\?\(([^\[]+)\[\^/g, "?)\\.?($1(?<=\\.)[^\\.)") // optional image format
            }/*$`
          ),
          handlers,
        ]) && receiver,
  }),
  routes,

  async handle(req: IncomingMessage, res: ServerResponse, ...args) {
    let response,
      match,
      url = new URL(req.url!, `http://${req.headers.host}`);
    const query: any = ((req as RequestLike).query = {});
    for (let [k, v] of url.searchParams) {
      query[k] = query[k] === undefined ? v : [query[k], v].flat();
    }
    for (let [method, route, handlers] of routes) {
      if (
        (method === req.method || method === "ALL") &&
        (match = url.pathname.match(route))
      ) {
        (req as RequestLike).params = match.groups || {};
        let i = 0;
        const next = async (err?: any) => {
          if (err) {
            console.error(err);
            res.writeHead(500).end();
            return;
          }
          const handler = handlers[i++];
          try {
            if (handler) {
              response = await handler(req.proxy || req, ...args);
              if (response !== undefined) {
                res
                  .writeHead(200, { "Content-Type": "application/json" })
                  .end(JSON.stringify(response));
              } else {
                await next();
              }
            }
          } catch (err) {
            console.error(err);
            res.writeHead(500).end();
          }
        };
        await next();
        return;
      }
    }
    res.writeHead(404).end();
  },
});

// const applyMiddleware = (router: RouterType, ...middlewares: Middleware[]): RouterType =>
// middlewares.reduce((acc, curr) => ({
//     ...

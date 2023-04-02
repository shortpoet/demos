// @ts-nocheck
// declare global {
//   interface Request {
//     query: { [key: string]: string | string[] };
//     params: { [key: string]: string };
//   }
// }
export interface RequestLike extends Request {
  url: string;
  method: string;
  params: {
    [key: string]: string;
  };
  query: {
    [key: string]: string | string[];
  };
  [key: string]: any;
}

export interface Handler {
  (req: RequestLike, ...args: any[]): Promise<Response | undefined>;
}

interface Route {
  [key: string]: Handler[];
}

interface Routes {
  [key: string]: Route;
}

interface Router {
  handle: (req: RequestLike, ...args: any) => Promise<any>;
}
// interface RouterType {
//   handlers: Handler[];
//   use(handler: Handler): RouterType;
//   handle(request: Request, ...args: any[]): Promise<Response>;
// }

const getHandlersForRoute = (
  routes: Routes,
  base: string,
  pathname: string,
  method: string
): Handler[] => {
  console.log("pathname", pathname);
  console.log("method", method);

  routes = base
    ? Object.keys(routes).reduce((acc, key) => {
        acc[`${base}${key}`] = routes[key];
        return acc;
      }, {} as Routes)
    : routes;

  const allRoutes = base ? routes[`${base}*`] : routes[`*`];
  const routeHandlers = routes[pathname] || {};
  const methodHandlers = routeHandlers[method] || [];
  const allMethod = allRoutes[method] || [];

  const allHandlers = allRoutes["all"] || [];
  return [...methodHandlers, ...allHandlers, ...allMethod];
};

const parseQueryParams = (
  queryParams: URLSearchParams
): Record<string, string | string[]> => {
  const params: Record<string, string | string[]> = {};
  queryParams.forEach((value, key) => {
    const currentValue = params[key];
    if (currentValue === undefined) {
      params[key] = value;
    } else {
      params[key] = Array.isArray(currentValue)
        ? currentValue.concat(value)
        : [currentValue, value];
    }
  });
  return params;
};

const loggerMiddleware = async (
  req: Request,
  res: Response,
  next: () => Promise<void>
) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  await next();
};

const errorHandlerMiddleware = async (
  err: Error,
  req: any,
  res: any,
  next: any
) => {
  console.error(`[${new Date().toISOString()}] ERROR: ${err.message}`);
  res.statusCode = 500;
  res.end();
};

export const Router = ({ base = "", routes = {} as Routes }): Router => ({
  async handle(request: RequestLike, response: Response, ...args: any[]) {
    try {
      const url = new URL(request.url);
      const method = request.method?.toLowerCase() || "get";
      const pathname = url.pathname.replace(/\/$/, "") || "/";
      const queryParams = url.searchParams;
      const query = parseQueryParams(queryParams);
      const params = request.params || {};

      let handlers = base
        ? getHandlersForRoute(routes, base, pathname, method)
        : getHandlersForRoute(routes, base, pathname, method);

      handlers = handlers.map(
        (handler) =>
          (req: RequestLike, ...args: any[]) => {
            const newReq = { ...req, url: req.url };
            Object.defineProperty(newReq, "query", {
              value: { ...query },
              writable: false,
              enumerable: true,
              configurable: true,
            });
            Object.defineProperty(newReq, "params", {
              value: { ...params },
              writable: false,
              enumerable: true,
              configurable: true,
            });
            return handler(newReq, ...args);
          }
      );

      if (handlers.length > 0) {
        const next = async (index: number) => {
          const currentHandler = handlers[index];
          if (currentHandler) {
            try {
              await currentHandler(request, ...args);
            } catch (err) {
              await errorHandlerMiddleware(err, request, response, () =>
                Promise.resolve()
              );
            }
            await next(index + 1);
          }
        };
        await loggerMiddleware(request, response, async () => {
          await next(0);
        });
      } else {
        response.statusCode = 404;
        response.end();
      }
    } catch (err) {
      await errorHandlerMiddleware(err, request, response, () =>
        Promise.resolve()
      );
    }
  },
});

declare global {
  interface Request {
    query: { [key: string]: string | string[] };
    params: { [key: string]: string };
  }
}
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
  // console.log("getHandlersForRoute");
  // console.log("route", routes);
  console.log("pathname", pathname);
  console.log("method", method);

  routes = base
    ? Object.keys(routes).reduce((acc, key) => {
        acc[`${base}${key}`] = routes[key];
        return acc;
      }, {} as Routes)
    : routes;

  // console.log("routes", routes);

  const allRoutes = base ? routes[`${base}*`] : routes[`*`];
  // console.log("allRoutes", allRoutes);
  const routeHandlers = routes[pathname] || {};
  // console.log("routeHandlers", routeHandlers);
  const methodHandlers = routeHandlers[method] || [];
  const allMethod = allRoutes[method] || [];

  const allHandlers = allRoutes["all"] || [];
  // console.log("allHandlers", allHandlers);
  // console.log("methodHandlers", methodHandlers);
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

export const Router = ({ base = "", routes = {} as Routes }): Router => ({
  async handle(request: RequestLike, ...args: any[]) {
    console.log("handle", args);
    // console.log("request", request);
    const url = new URL(request.url);
    const method = request.method?.toLowerCase() || "get";
    const pathname = url.pathname.replace(/\/$/, "") || "/";
    // console.log(url.pathname);
    // console.log(url.pathname.replace(/\/$/, ""));
    // const pathname = base
    //   ? `${base}/${url.pathname.replace(/\/$/, "")}`
    //   : url.pathname.replace(/\/$/, "") || "/";
    // console.log("pathname", pathname);
    const queryParams = url.searchParams;
    const query = parseQueryParams(queryParams);
    const params = request.params || {};

    let handlers = base
      ? getHandlersForRoute(routes, base, pathname, method)
      : getHandlersForRoute(routes, base, pathname, method);

    handlers = handlers.map((handler) => (req: RequestLike, ...args: any[]) => {
      const newReq = new Request(req.url.replace(base, ""), req);
      newReq.query = query;
      newReq.params = params;
      return handler(newReq, ...args);
    });

    // console.log("handlers", handlers);
    for (const handler of handlers) {
      // console.log("handler", handler);
      return await handler(request, ...args);
    }
  },
});

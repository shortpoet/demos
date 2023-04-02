// @ts-nocheck
interface RequestLike {
  url: string;
  method: string;
  query?: Record<string, string | string[]>;
  params?: Record<string, string>;
  [key: string]: any;
}

type RouteHandler = (req: RequestLike, ...args: any[]) => any;

type RouteDefinition = [string, RegExp, RouteHandler[]];

type Middleware = (req: RequestLike, res: any, next: () => void) => void;

type RouterType = {
  use: (handler: Middleware) => RouterType;
  routes: RouteDefinition[];
  handle: (req: RequestLike, ...args: any[]) => Promise<any>;
};

type RouterOptions = {
  base?: string;
  routes?: RouteDefinition[];
};

const createRouter = ({ base = '', routes = [] }: RouterOptions = {}): RouterType => {
  const middleware: Middleware[] = [];

  const use = (handler: Middleware): RouterType => {
    middleware.push(handler);
    return router;
  };

  const getHandlersForRoute = (
    pathname: string,
    method: string
  ): RouteHandler[] | undefined => {
    const matchingRoutes = routes.filter(([routeMethod, routePath]) => {
      const methodMatches = routeMethod === method || routeMethod === 'ALL';
      const pathMatch = pathname.match(routePath);
      return methodMatches && pathMatch;
    });

    if (matchingRoutes.length > 0) {
      const [, , handlers] = matchingRoutes[0];
      return handlers;
    }
  };

  const parseQueryParams = (queryParams: URLSearchParams): Record<string, string | string[]> => {
    const params: Record<string, string | string[]> = {};
    queryParams.forEach((value, key) => {
      const currentValue = params[key];
      if (currentValue === undefined) {
        params[key] = value;
      } else {
        params[key] = Array.isArray(currentValue) ? currentValue.concat(value) : [currentValue, value];
      }
    });
    return params;
  };

  const handle: RouterType['handle'] = async (req, ...args) => {
    const url = new URL(req.url);
    const method = req.method.toUpperCase();
    const pathname = url.pathname.replace(/\/$/, '') || '/';
    const queryParams = url.searchParams;
    const query = parseQueryParams(queryParams);

    req.query = query;

    let response: any, handlers: RouteHandler[] | undefined;

    for (let i = 0; i < middleware.length; i++) {
      await new Promise<void>((resolve) => middleware[i](req, response, resolve));
    }

    handlers = getHandlersForRoute(pathname, method);

    if (handlers) {
      const match = pathname.match(handlers[0][1]);
      if (match) {
        req.params = match.groups || {};
        for (let i = 0; i < handlers.length; i++) {
          response = await handlers[i][0](req, ...args);
          if (response !== undefined) {
            return response;
          }
        }
      }
    }

    return response;
  };

  const router: RouterType = {
    use,
    routes,
    handle,
  };

  return router;
};

// Usage example
const router = createRouter({
  base: '/api',
  routes: [
    ['GET', /^\/users\/(?<id>\d+)$/, [(req) => ({ id: req.params.id })]],
    ['POST', '/users', [(req) => ({ body: req.body })]],

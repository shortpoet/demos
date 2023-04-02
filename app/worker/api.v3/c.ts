// Import dependencies
import http from "http";

// Define types
interface Request {
  url: string;
  method: string;
  query: Record<string, string | string[]>;
  // Add any other properties your application needs
}

interface Response {
  // Define the properties and methods your application needs for a response object
}

interface Handler {
  (req: Request, res: Response): Promise<void>;
}

interface Route {
  [key: string]: {
    [key: string]: Handler[];
  };
}

interface Middleware {
  (req: Request, res: Response, next: () => void): void;
}

interface Router {
  use: (middleware: Middleware) => void;
  handle: (req: Request, ...args: any) => Promise<any>;
}

export const createRouter = ({ base = "", routes = {} }): Router => {
  const getHandlersForRoute = (
    route: Route,
    pathname: string,
    method: string
  ): Handler[] => {
    const routeHandlers = route[pathname] || {};
    const methodHandlers = routeHandlers[method] || [];
    return methodHandlers;
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

  const logger: Middleware = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  };

  const errorHandler: Middleware = (err, req, res, next) => {
    console.error(err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  };

  const middlewareStack: Middleware[] = [logger];

  const use = (middleware: Middleware) => {
    middlewareStack.push(middleware);
  };

  const handle: Router["handle"] = async (req, res) => {
    try {
      const url = new URL(req.url);
      const method = req.method.toLowerCase();
      const pathname = url.pathname.replace(/\/$/, "") || "/";
      const queryParams = url.searchParams;
      const query = parseQueryParams(queryParams);

      const handlers = getHandlersForRoute(routes, pathname, method);
      const handlersWithBase = base
        ? handlers.map((handler) => (req: Request, res: Response) => {
            req.url = req.url.replace(base, "");
            handler(req, res);
          })
        : handlers;

      const stack = [...middlewareStack, ...handlersWithBase];

      let idx = 0;
      const next = () => {
        if (idx < stack.length) {
          const middleware = stack[idx];
          idx++;
          middleware(req, res, next);
        }
      };

      next();
    } catch (err) {
      errorHandler(err, req, res);
    }
  };

  return {
    use,
    handle,
  };
};

// Usage example
const router = createRouter({ base: "/api" });

router.use((req, res, next) => {
  console.log("Middleware 1");
  next();
});

router.use((req, res, next) => {
  console.log("Middleware 2");
  next();
});

router.handle({ url: "/api/test", method: "GET", query: {} });

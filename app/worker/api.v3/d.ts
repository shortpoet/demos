const handle = async (req, res, ...middlewares) => {
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

  const mergedMiddlewares = [
    ...middlewares,
    logRequestsMiddleware(),
    errorHandlingMiddleware(),
  ];

  const executeMiddlewares = (
    middlewares: Middleware[],
    req: Request,
    res: Response
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const next = async () => {
        const middleware = middlewares.shift();
        if (middleware) {
          try {
            await middleware(req, res, next);
          } catch (err) {
            reject(err);
          }
        } else {
          resolve();
        }
      };
      next();
    });
  };

  await executeMiddlewares(mergedMiddlewares, { ...req, query }, res);

  for (const handler of handlersWithBase) {
    await handler({ ...req, query }, res);
  }
};

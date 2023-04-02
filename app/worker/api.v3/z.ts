

// Define middleware route
const middleware = (handler: Handler): Handler => {
  return async (req: RequestLike, ...args: any[]) => {
    console.log("Middleware for all routes");
    return handler(req, ...args);
 

interface Handler {
  (req: Request, ...args: any[]): Promise<Response | undefined>;
}

interface RouterType {
  handlers: Handler[];
  use(handler: Handler): RouterType;
  handle(request: Request, ...args: any[]): Promise<Response>;
}

export const Router = (): RouterType => ({
  handlers: [] as Handler[],

  use(handler: Handler) {
    this.handlers.push(handler);
    return this;
  },

  async handle(request: Request, ...args: any[]) {
    let result = new Response("Not Found", { status: 404 });
    for (const handler of this.handlers) {
      const response = await handler(request, ...args);
      if (response) {
        result = response;
        break;
      }
    }
    return result;
  },
});

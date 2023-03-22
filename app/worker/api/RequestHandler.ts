import { Env } from '../types';
import { logLevel } from '../util';
import { User } from './types';
import { createJsonResponse } from '../util';
import { isValidJwt } from './auth/jwt';

export { RequestHandler, defineInit };

const FILE_LOG_LEVEL = 'debug';

function defineInit(request: Request): RequestInit {
  return {
    method: request.method,
    headers: request.headers,
    cf: request.cf,
    redirect: request.redirect,
    fetcher: request.fetcher,
    integrity: request.integrity,
    signal: request.signal,
  };
}

class RequestHandler<CfHostMetadata = unknown> extends Request<CfHostMetadata> {
  declare isAuthenticated: boolean;
  private declare token: string;
  declare query?: Record<string, string>;
  declare params?: Record<string, string>;
  declare user?: User;

  constructor(req: Request, env: Env, init?: RequestInit) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(`worker.RequestHandler: ${req.url}`);
    }
    super(req, init);

    this.query = this._parseQuery(new URL(this.url));
    this.params = this._parseParams(new URL(this.url));
  }
  private _parseQuery(url: URL): Record<string, string> {
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });
    return query;
  }
  private _parseParams: (url: URL) => Record<string, string> = (url) => {
    const params: Record<string, string> = {};
    url.pathname.split('/').forEach((value, key) => {
      params[key] = value;
    });
    return params;
  };

  async handleRequest(
    req: RequestHandler,
    env: Env,
    ctx: ExecutionContext,
    content: any,
    status: number,
    options: {
      withAuth?: boolean;
      headers?: Record<string, string>;
    } = { withAuth: false, headers: {} },
  ): Promise<Response> {
    console.log(`worker.handleRequest: ${req.url}`);
    console.log('worker.handleRequest.options', options);
    let res;
    if (options.withAuth) {
      const { valid, payload, status } = await isValidJwt(req, env, ctx);
      let statusText = 'OK';
      if (!valid) {
        switch (status) {
          case 400:
            statusText = 'Bad Request. Token format may be incorrect.';
            res = createJsonResponse(
              {
                error: `Bad Request. Token format may be incorrect. ${payload.error}`,
              },
              req,
              env,
              status,
              statusText,
              options.headers,
            );
            break;
          case 401:
            statusText = `Unauthorized. Please Log in to continue. ${payload.error}`;
            res = createJsonResponse(
              {
                error:
                  'Unauthorized. Please Log in to .... this content is rated 18+ you must be logged in to continue.... age verify?',
              },
              req,
              env,
              status,
              statusText,
              {
                ...options.headers,
                'WWW-Authenticate': 'Bearer',
              },
            );
            break;
          case 403:
            statusText =
              'Forbidden. You are not authorized to access this content.';
            res = createJsonResponse(
              { error: statusText },
              req,
              env,
              status,
              statusText,
            );
            break;
          case 404:
            statusText = 'Not Found';
            res = createJsonResponse(
              { error: statusText },
              req,
              env,
              status,
              statusText,
              {
                ...options.headers,
                'WWW-Authenticate': 'Bearer',
              },
            );
          default:
            break;
        }

        if (logLevel(FILE_LOG_LEVEL, env)) {
          console.log(
            'worker.handleAuth0.unauthorized',
            // JSON.stringify(res, null, 2)
          );
        }
      } else {
        if (logLevel(FILE_LOG_LEVEL, env)) {
          console.log('worker.handleAuth0.authorized');
        }
        this.isAuthenticated = valid;
        this.token = payload.token;
        this.user = null;
        res = createJsonResponse(
          content,
          req,
          env,
          status,
          null,
          options?.headers,
        );
      }
    } else {
      this.isAuthenticated = false;
      this.token = null;
      this.user = null;
      res = createJsonResponse(
        content,
        req,
        env,
        status,
        null,
        options?.headers,
      );
      if (logLevel(FILE_LOG_LEVEL, env)) {
        console.log('worker.handleAuth0.noAuthNeeded');
        // console.log("worker.handleAuth0.noAuth", JSON.stringify(res, null, 2));
      }
    }
    return res;
  }
}

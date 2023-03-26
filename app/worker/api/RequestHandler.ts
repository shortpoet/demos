import { Env } from '../types';
import { cloneRequest, cloneResponse, isAssetURL, logLevel } from '../util';
import { BodyContext, User } from './types';
import { createJsonResponse } from '../util';
import { isValidJwt } from './auth/jwt';

export { RequestHandler, defineInit };

const FILE_LOG_LEVEL = 'error';

function defineInit(request: Request): RequestInit {
  return {
    method: request.method,
    headers: request.headers,
    body: request.body,
    cf: request.cf,
    redirect: request.redirect,
    fetcher: request.fetcher,
    integrity: request.integrity,
    signal: request.signal,
  };
}

class RequestHandler<CfHostMetadata = unknown> extends Request<CfHostMetadata> {
  // class RequestHandler<CfHostMetadata = unknown> extends Request<CfHostMetadata> {
  declare req: Request;
  declare url: string;
  declare isAuthenticated: boolean;
  private declare token: string;
  declare query?: Record<string, string>;
  declare params?: Record<string, string>;
  declare user?: User;
  declare data?: any;
  declare dump?: any;

  constructor(req: Request, env: Env, init?: RequestInit) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(`worker.RequestHandler: ${req.url}`);
    }
    super(req, (init = defineInit(req)));

    // const [stream1, stream2] = cloneRequest(req);
    // super(req, {
    //   ...init,
    //   body: stream1,
    // });
    // console.log(
    //   `worker.RequestHandler.stream: ${JSON.stringify(stream2, null, 2)}`,
    // );
    this.req = req;
    // this.url = req.url;
    this.query = this._parseQuery(new URL(this.url));
    this.params = this._parseParams(new URL(this.url));

    // if (this.body) {
    //   console.log('worker.RequestHandler.body', this.body);
    //   this.user = this._parseBodyData(this._parseBody(this.body)).user;
    //   this.data = this._parseBodyData(this._parseBody(this.body)).data;
    // }

    // const clone = this.clone();
    // if (clone.body) {
    //   console.log('worker.RequestHandler.clone.body', clone.body);
    //   this.user = this._parseBodyData(this._parseBody(clone.body)).user;
    //   this.data = this._parseBodyData(this._parseBody(clone.body)).data;
    // }
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

  private _parseBody: (body: any) => any = (body) => {
    if (body instanceof ReadableStream) {
      return body;
    }
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch (e) {
        return body;
      }
    }
    return body;
  };

  private _parseBodyData: (body: any) => { user?: User; data?: any } = (
    body,
  ) => {
    return {
      ...(body.user ? { user: body.user } : {}),
      ...(body.data ? { data: body.data } : {}),
    };
  };

  async initData(env) {
    let headerslength = 0;
    let headerString = '';
    for (let entry of this.req.headers.entries()) {
      const [key, value] = entry;
      // console.log(`${key}: ${value}`);
      headerString += `\n${key}: ${value}\n`;
      headerslength++;
    }
    if (!isAssetURL(new URL(this.url))) {
      console.log(`worker.initData -> ${this.url}`);
      console.log(`method -> ${this.req.method}`);
      console.log(`body -> ${this.req.body}`);
      console.log(`bodyUsed -> ${this.req.bodyUsed}`);
      console.log(`headers length -> ${headerslength} \n`);
    }
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(`headers ->  \n${headerString}\n`);
    }
    // this results in an error when there is a user object in request
    // but can't see any of the data
    if (this.req.method === 'POST') {
      const t = await this.req.text();
      // const j: BodyContext = await this.req.clone().json();
      // console.log('worker.handleRequest.text', t);
      // if (j) {
      //   this.user = j.user;
      //   this.data = j.data;
      // }
      const data = JSON.parse(t);
      // console.log('worker.handleRequest.data', data);
      this.user = data;
      this.data = data.data;
      // console.log('worker.handleRequest.body', this.data);
      // console.log('worker.handleRequest.user', this.user);
    }
  }

  async handleRequest(
    env: Env,
    ctx: ExecutionContext,
    content: any,
    status: number,
    options: {
      withAuth?: boolean;
      headers?: Record<string, string>;
    } = { withAuth: false, headers: {} },
  ): Promise<Response> {
    let res;

    if (options.withAuth) {
      const { valid, payload, status } = await isValidJwt(this, env, ctx);
      let statusText = 'OK';
      if (!valid) {
        switch (status) {
          case 400:
            statusText = 'Bad Request. Token format may be incorrect.';
            res = createJsonResponse(
              {
                error: `Bad Request. Token format may be incorrect. ${JSON.stringify(
                  payload.error,
                )}`,
              },
              this,
              env,
              status,
              statusText,
              options.headers,
            );
            break;
          case 401:
            statusText = `Unauthorized. Please Log in to continue. ${JSON.stringify(
              payload.error,
            )}`;
            res = createJsonResponse(
              {
                error:
                  'Unauthorized. Please Log in to .... this content is rated 18+ you must be logged in to continue.... age verify?',
              },
              this,
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
              this,
              env,
              status,
              statusText,
            );
            break;
          case 404:
            statusText = 'Not Found';
            res = createJsonResponse(
              { error: statusText },
              this,
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
        this.user = this.user;
        res = createJsonResponse(
          content,
          this,
          env,
          status,
          statusText,
          options?.headers,
        );
      }
    } else {
      this.isAuthenticated = false;
      this.token = null;
      this.user = null;
      res = createJsonResponse(
        content,
        this,
        env,
        status,
        'OK',
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

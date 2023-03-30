import { Env } from '../types';
import { isAssetURL, logLevel, readBody } from '../util';
import { Session, User } from '../../types';
import { createJsonResponse } from '../util';
import { isValidJwt } from './auth/jwt';
import type {
  Request as WorkerRequest,
  Fetcher,
  IncomingRequestCfPropertiesCloudflareAccessOrApiShield,
} from '@cloudflare/workers-types';

export { RequestHandler, WorkerRequest };

const FILE_LOG_LEVEL = 'error';

interface ResponsePlus extends Response {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
  clone(): Response;
  locals?: Record<string, any>;
}

class RequestHandler {
  // class RequestHandler<CfHostMetadata = unknown> extends Request<CfHostMetadata> {
  private _res?: ResponsePlus;
  declare req: Request;
  declare url: URL;
  declare isAuthenticated: boolean;
  private declare token: string;
  declare query?: Record<string, string>;
  declare params?: Record<string, string>;
  declare user?: User;
  declare session?: Session;
  declare data?: any;
  declare dump?: any;
  declare nextAuth?: any;

  constructor(req: Request, env: Env, init?: RequestInit) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(`worker.RequestHandler: ${req.url}`);
    }

    this.url = new URL(req.url);
    this.req = new Request(req.url, req);
    this.query = this._parseQuery(new URL(this.url));
    this.params = this._parseParams(new URL(this.url));
  }
  get res(): ResponsePlus {
    if (!this._res) {
      throw new Error('Response not set');
    }
    return this._res;
  }
  set res(res: ResponsePlus) {
    this._res = res;
  }
  createQueryURL(query: Record<string, string>): URL {
    const url = new URL(this.url);
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url;
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

  private _parseBody: (request: Request) => any = async (request) => {
    const ct = request.headers.get('Content-Type');
    let res;
    switch (true) {
      case ct && ct.includes('application/json'):
        res = await request.json();
        break;
      case ct && ct.includes('application/x-www-form-urlencoded'):
        res = await request.formData();
        console.log(
          `\n\tworker._parseBody -> ${
            this.url
          } -> POST -> res -> from-urlecnoded -> ${JSON.stringify(res)}\n`,
        );
        // const obj: Record<string, string> = {};
        // res.forEach((value, key) => {
        //   obj[key] = value;
        // });
        // console.log(`\n\tworker._parseBody -> ${this.url} -> POST -> obj -> ${obj}\n`);
        // return obj;
        break;
      case ct && ct.includes('multipart/form-data'):
        res = await request.formData();
        break;
      case request.body instanceof ReadableStream:
        res = await request.json();
        break;
      case typeof request.body === 'string':
        res = request.body;
      default:
        break;
    }
    return res;
  };

  async initData(env) {
    let headerslength = 0;
    let headerString = '';
    this.req.headers.forEach((value, key) => {
      headerString += `\n${key}: ${value}\n`;
      headerslength++;
    });
    if (!isAssetURL(new URL(this.url))) {
      console.log(`\tworker.initData -> ${this.url}`);
      console.log(`\tmethod -> ${this.req.method}`);
      console.log(`\tbody -> ${!!this.req.body}`);
      console.log(`\tbodyUsed -> ${this.req.bodyUsed}`);
      console.log(`\theaders length -> ${headerslength} \n`);
    }
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(`headers ->  \n${headerString}\n`);
    }
    const ct = this.req.headers.get('Content-Type');
    console.log(
      `\n\tworker.initData -> ${this.url} -> POST -> content type -> ${ct}\n`,
    );
    // const proxy = new Proxy(this.req, {
    //   get: (target, prop) => {
    //     // if (prop === 'body') {
    //     //   return readBody(target.body);
    //     // }
    //     return target[prop];
    //   },
    // });
    // this.req = proxy;
    if (this.req.body && this.req.method === 'POST') {
      this.data = await this._parseBody(this.req.clone());
      this.user = this.data;
      if (this.data && this.url && this.url.pathname === '/api/auth/session') {
        this.user = this.data;
      }
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
    this._res = res;
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
        // this.user = this.user;
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

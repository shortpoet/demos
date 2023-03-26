import { getSessionFromCookie, RequestHandler, _atob } from 'api';
import { logLevel, logger, isJsonURL } from './util';
import { renderPage } from 'vite-plugin-ssr';
import { PageContext } from '../types';
import { Env } from 'types';

export { handleSsr };

const FILE_LOG_LEVEL = 'debug';

async function handleSsr(handler: RequestHandler, env: Env, ctx) {
  const log = logger(FILE_LOG_LEVEL, env);
  const userAgent = handler.req.headers.get('User-Agent') || '';
  const session = await getSessionFromCookie(handler, env);
  const url = new URL(handler.req.url);
  let res;

  log(`
    worker.handleSsr
    ua: ${userAgent.substring(0, 8)} ...
  `);

  const pageContextInit = {
    urlOriginal: handler.req.url,
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    userAgent,
    session,
  };
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;

  log(`
    \nBEGIN\thttpResponse\n
    ${JSON.stringify(httpResponse, null, 2).substring(0, 100)}
    \nEND\thttpResponse\n
    `);
  const { redirectTo } = (<unknown>pageContext) as PageContext;

  if (!httpResponse) {
    log('http response is null');

    // const { redirectTo } = (<unknown>pageContext) as PageContext & {
    //   httpResponse: null;
    // };
    log(`
        \nBEGIN\tredirectTo\n
        ${JSON.stringify(redirectTo, null, 2)}
        \nEND\tredirectTo\n
      `);
    if (redirectTo) {
      const { origin } = url;
      const redirectToAbsolute = redirectTo.startsWith('/')
        ? `${origin}${redirectTo}`
        : redirectTo;
      log(`redirecting to ${redirectToAbsolute}`);
      res = new Response(null, {
        status: 307,
        headers: { Location: redirectToAbsolute },
      });
    }
  } else {
    let { statusCode, contentType } = httpResponse;
    if (isJsonURL(url)) {
      contentType = 'application/json';
      log(`
        \nBEGIN\tjson response\n
        ${JSON.stringify(url, null, 2)}
        \nEND\tjson response\n
        \nBEGIN\tredirect to\n
        ${redirectTo}
        \nEND\tredirect to\n
        `);
      if (redirectTo) {
        const { origin } = url;
        const redirectToAbsolute = redirectTo.startsWith('/')
          ? `${origin}${redirectTo}`
          : redirectTo;
        log(`redirecting to ${redirectToAbsolute}`);

        res = new Response(null, {
          status: 307,
          headers: {
            Location: redirectToAbsolute,
            'content-type': contentType,
          },
        });
      }
    } else {
      const { readable, writable } = new TransformStream();
      httpResponse.pipe(writable);
      res = new Response(readable, {
        headers: { 'content-type': contentType },
        status: statusCode,
      });
    }
  }
  log(`
    \nBEGIN\tresponse\n
    ${JSON.stringify(res, null, 2)}
    ${res.headers.get('content-type')}
    \nEND\tresponse\n
  `);
  return res;
}

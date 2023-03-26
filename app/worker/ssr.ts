import { getSessionFromCookie, RequestHandler, _atob } from 'api';
import { logLevel, logger } from './util';
import { renderPage } from 'vite-plugin-ssr';
import { PageContext } from '../types';
import { Env } from 'types';

export { handleSsr };

const FILE_LOG_LEVEL = 'error';

async function handleSsr(handler: RequestHandler, env: Env, ctx) {
  const log = logger(FILE_LOG_LEVEL, env);
  const userAgent = handler.req.headers.get('User-Agent') || '';
  const session = await getSessionFromCookie(handler, env);

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

  if (!httpResponse) {
    log('http response is null');

    const { redirectTo } = (<unknown>pageContext) as PageContext;
    // const { redirectTo } = (<unknown>pageContext) as PageContext & {
    //   httpResponse: null;
    // };
    log(`
    \nBEGIN\tredirectTo\n
    ${JSON.stringify(redirectTo, null, 2)}
    \nEND\tredirectTo\n
  `);

    if (redirectTo) {
      const { origin } = new URL(handler.req.url);
      const redirectToAbsolute = redirectTo.startsWith('/')
        ? `${origin}${redirectTo}`
        : redirectTo;
      log(`redirecting to ${redirectToAbsolute}`);
      return Response.redirect(redirectToAbsolute, 307);
    }

    return null;
  } else {
    const { statusCode, contentType } = httpResponse;
    const { readable, writable } = new TransformStream();
    httpResponse.pipe(writable);
    return new Response(readable, {
      headers: { 'content-type': contentType },
      status: statusCode,
    });
  }
}

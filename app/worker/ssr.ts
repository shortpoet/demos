import { getSessionFromCookie, RequestHandler, _atob } from 'api';
import { logLevel } from './util';
import { renderPage } from 'vite-plugin-ssr';
import { PageContext } from '../types';
import { Env } from 'types';

export { handleSsr };

const FILE_LOG_LEVEL = 'error';

async function handleSsr(handler: RequestHandler, env: Env, ctx) {
  const userAgent = handler.req.headers.get('User-Agent') || '';
  const session = await getSessionFromCookie(handler, env);

  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('ua', userAgent);
  }

  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.handleSsr');
  }

  let res;
  let statusCode;
  let pageContextInit = {
    urlOriginal: handler.req.url,
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    userAgent,
    session,
  };
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.handleSsr.pageContextInit', pageContextInit);
  }
  let pageContext = await renderPage(pageContextInit);
  let { httpResponse } = pageContext;
  let { contentType } = httpResponse;

  const { redirectTo } = (<unknown>pageContext) as PageContext & {
    httpResponse: null;
  };

  // if (redirectTo) {
  //   const { origin } = new URL(handler.url);
  //   const destinationURL = `${origin}${redirectTo}`;
  //   pageContextInit = {
  //     urlOriginal: destinationURL,
  //     fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
  //     userAgent,
  //     session,
  //   };
  //   pageContext = await renderPage(pageContextInit);
  //   statusCode = 307;
  //   httpResponse = pageContext.httpResponse;
  //   httpResponse.statusCode = statusCode;
  //   httpResponse.contentType = contentType;
  //   console.log('redirecting to', destinationURL);
  //   // 301 is permanent, 302 is temporary,
  //   // 307 is temporary but preserves the HTTP method, 303 is temporary and always uses GET
  //   // return Response.redirect(destinationURL, statusCode);
  // }

  ({ statusCode } = httpResponse);
  ({ contentType } = httpResponse);
  const { readable, writable } = new TransformStream();
  httpResponse.pipe(writable);

  res = new Response(readable, {
    headers: { 'content-type': contentType },
    status: statusCode,
  });

  if (!httpResponse) {
    return null;
  } else {
    return res;
  }
}

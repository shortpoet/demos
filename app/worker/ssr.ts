import { getSessionFromCookie, RequestHandler, _atob } from 'api';
import { logLevel } from './util';
import { renderPage } from 'vite-plugin-ssr';
import { PageContext } from '../types';
import { Env } from 'types';

export { handleSsr };

const FILE_LOG_LEVEL = 'debug';

async function handleSsr(handler: RequestHandler, env: Env, ctx) {
  const userAgent = handler.req.headers.get('User-Agent') || '';
  const session = await getSessionFromCookie(handler, env);

  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log(`ua: ${userAgent.substring(0, 8)} ...`);
  }

  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.handleSsr');
  }
  const pageContextInit = {
    urlOriginal: handler.req.url,
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    userAgent,
    session,
  };
  if (logLevel(FILE_LOG_LEVEL, env)) {
    // console.log('worker.handleSsr.pageContextInit', pageContextInit);
  }
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (logLevel(FILE_LOG_LEVEL, env)) {
    // console.log('worker.handleSsr.pageContext', pageContext);
    console.log(`\nBEGIN\thttpResponse\n`);
    console.log(JSON.stringify(httpResponse, null, 2).substring(0, 100));
    console.log(`\nEND\thttpResponse\n`);
  }
  if (!httpResponse) {
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log('httpResponse is null');
    }
    const { redirectTo } = (<unknown>pageContext) as PageContext & {
      httpResponse: null;
    };
    if (logLevel(FILE_LOG_LEVEL, env)) {
      console.log(`\nBEGIN\tredirectTo\n`);
      console.log(JSON.stringify(redirectTo, null, 2));
      console.log(`\nEND\tredirectTo\n`);
    }
    if (redirectTo) {
      const { origin } = new URL(handler.req.url);
      const redirectToAbsolute = redirectTo.startsWith('/')
        ? `${origin}${redirectTo}`
        : redirectTo;
      if (logLevel(FILE_LOG_LEVEL, env)) {
        console.log('redirecting to', redirectToAbsolute);
      }
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

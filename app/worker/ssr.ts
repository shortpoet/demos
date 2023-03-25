import { getSessionFromCookie, _atob } from 'api';
import { logLevel } from './util';
import { renderPage } from 'vite-plugin-ssr';
import { PageContext } from '../types';

export { handleSsr };

const FILE_LOG_LEVEL = 'error';

async function handleSsr(handler, env, ctx) {
  const userAgent = handler.req.headers.get('User-Agent') || '';
  const session = await getSessionFromCookie(handler, env);

  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('ua', userAgent);
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
    console.log('worker.handleSsr.pageContextInit', pageContextInit);
  }
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (!httpResponse) {
    const { redirectTo } = (<unknown>pageContext) as PageContext & {
      httpResponse: null;
    };
    if (redirectTo) {
      return new Response(null, {
        status: 302,
        headers: { Location: redirectTo },
      });
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

import { getSessionFromCookie, _atob } from 'api';
import { logLevel } from './util';
import { renderPage } from 'vite-plugin-ssr';

export { handleSsr };

const FILE_LOG_LEVEL = 'error';

async function handleSsr(handler, env, ctx) {
  const userAgent = handler.req.headers.get('User-Agent') || '';
  let user = null;
  const session = await getSessionFromCookie(handler, env);
  if (session) {
    user = session.user;
  }

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
    user,
  };
  if (logLevel(FILE_LOG_LEVEL, env)) {
    console.log('worker.handleSsr.pageContextInit', pageContextInit);
  }
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (!httpResponse) {
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

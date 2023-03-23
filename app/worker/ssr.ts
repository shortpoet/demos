import { renderPage } from 'vite-plugin-ssr';

export { handleSsr };

async function handleSsr(handler, env, ctx) {
  const userAgent = handler.req.headers.get('User-Agent') || '';
  const user = handler.user;
  if (env.LOG_LEVEL === 'debug') {
    console.log('ua', userAgent);
  }

  if (env.LOG_LEVEL === 'debug') {
    console.log('worker.handleSsr');
  }
  const pageContextInit = {
    urlOriginal: handler.req.url,
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    userAgent,
    user,
  };
  console.log('worker.handleSsr.pageContextInit', pageContextInit);
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

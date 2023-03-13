import { renderPage } from "vite-plugin-ssr";

export { handleSsr };

async function handleSsr(request, env, ctx) {
  const userAgent = request.headers.get("User-Agent") || "";
  if (env.LOG_LEVEL === "debug") {
    console.log("ua", userAgent);
  }

  if (env.LOG_LEVEL === "debug") {
    console.log("worker.handleSsr");
  }
  const pageContextInit = {
    urlOriginal: request.url,
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    userAgent,
  };
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (!httpResponse) {
    return null;
  } else {
    const { statusCode, contentType } = httpResponse;
    const { readable, writable } = new TransformStream();
    httpResponse.pipe(writable);
    return new Response(readable, {
      headers: { "content-type": contentType },
      status: statusCode,
    });
  }
}

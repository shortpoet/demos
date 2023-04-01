import { renderPage } from "vite-plugin-ssr";
import { Env } from "./types";

export { handleSsr };

async function handleSsr(request: Request, env: Env, ctx: ExecutionContext) {
  const userAgent = request.headers.get("User-Agent") || "";
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

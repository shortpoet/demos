import { renderToString } from "@vue/server-renderer";
import { createHead, renderHeadToString } from "@vueuse/head";
import { escapeInject, dangerouslySkipEscape } from "vite-plugin-ssr";
import { PageContextServer } from "app/types/pageContext";
import { createApp } from "./app";

export { render };
export { passToClient };

// See https://vite-plugin-ssr.com/data-fetching
const passToClient = ["pageProps", "documentProps", "routeParams"];

async function render(pageContext: PageContextServer) {
  console.log("_default.server.render");
  const app = createApp(pageContext);
  const appHtml = await renderToString(app);

  const { headTags, htmlAttrs, bodyAttrs, bodyTags } = await renderHeadToString(
    createHead()
  );

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en" ${htmlAttrs}>
    <head>
      ${headTags}
    </head>
    <body${bodyAttrs}>
      <div id="app">${dangerouslySkipEscape(appHtml)}</div>
      ${bodyTags}
    </body>
    </html>`;

  return {
    documentHtml,
    pageContext: {
      // We can add some `pageContext` here, which is useful if we want to do page redirection https://vite-plugin-ssr.com/page-redirection
      enableEagerStreaming: true,
    },
  };
}

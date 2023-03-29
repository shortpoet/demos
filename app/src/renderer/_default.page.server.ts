import { renderToString } from '@vue/server-renderer';
import { createHead, renderHeadToString } from '@vueuse/head';
import { escapeInject, dangerouslySkipEscape } from 'vite-plugin-ssr';
import { PageContext, PageContextServer } from 'app/types/pageContext';
import { createApp } from './app';

export { render };
export { passToClient };
export { onBeforeRender };

async function onBeforeRender(pageContext: PageContext) {
  const session = pageContext.session;
  const user = pageContext.session?.user;
  console.log('_default.server.onBeforeRender');
  console.log(
    `_default.server.is logged in ${user !== null && user !== undefined}`,
  );
  const isAdmin = user?.role === 'admin';
  let redirectTo: string | undefined;
  const protectedRoutes = ['/api-data/debug', '/api-data/debug-plugin'];
  const path = pageContext.urlPathname;

  switch (true as boolean) {
    case protectedRoutes.includes(path) && !user:
      redirectTo = '/auth/login';
      break;
    // case !user.status.EMAIL_VERIFIED:
    //   redirectTo = '/register/verify-email';
    //   break;
    default:
      redirectTo = undefined;
      break;
  }

  return {
    pageContext: {
      redirectTo,
      session,
      isAdmin,
      pageProps: {
        isAdmin,
      },
    },
  };
}

// See https://vite-plugin-ssr.com/data-fetching
const passToClient = [
  'pageProps',
  'documentProps',
  'routeParams',
  'session',
  'csrfToken',
  'callbackUrl',
  'redirectTo',
  'isAdmin',
];

async function render(pageContext: PageContextServer) {
  console.log('_default.server.render');
  const app = createApp(pageContext);
  const appHtml = await renderToString(app);

  // See https://vite-plugin-ssr.com/head
  const { documentProps } = pageContext.exports;
  const { session, redirectTo } = pageContext;
  const title = (documentProps && documentProps.title) || 'Vite SSR app';
  const desc =
    (documentProps && documentProps.description) ||
    'App using Vite + vite-plugin-ssr';

  const { headTags, htmlAttrs, bodyAttrs, bodyTags } = await renderHeadToString(
    createHead(),
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

  if (redirectTo) {
    return {
      pageContext: { redirectTo },
    };
  }

  return {
    documentHtml,
    pageContext: {
      // We can add some `pageContext` here, which is useful if we want to do page redirection https://vite-plugin-ssr.com/page-redirection
      enableEagerStreaming: true,
      session,
      redirectTo,
    },
  };
}

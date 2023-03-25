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
  console.log('onBeforeRender');
  console.log(`is logged in ${user !== null && user !== undefined}`);

  let redirectTo: string | undefined;

  switch (true as boolean) {
    case !user:
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
];

async function render(pageContext: PageContextServer) {
  console.log('server.render');
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

  // if (redirectTo) {
  //   return {
  //     pageContext: { redirectTo, session },
  //   };
  // }

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

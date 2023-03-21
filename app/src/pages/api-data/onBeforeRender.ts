import type { PageContextBuiltIn } from 'vite-plugin-ssr';

export { onBeforeRender };

async function onBeforeRender(pageContext: PageContextBuiltIn) {
  const { urlPathname } = pageContext;
  if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
    console.log(`api-data.onBeforeRender: urlPathname: ${urlPathname}}`);
  }
  return {
    pageContext: {
      pageProps: {
        urlPathname,
      },
    },
  };
}

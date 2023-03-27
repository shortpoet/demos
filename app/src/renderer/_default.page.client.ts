import { PageContextBuiltInClient } from 'vite-plugin-ssr/client';
import { PageContext } from 'app/types/pageContext';
import { createApp } from './app';
import { usePageTitle } from '../composables/pageTitle';
import { navigate } from 'vite-plugin-ssr/client/router';

export const clientRouting = true;
export const prefetchStaticAssets = { when: 'VIEWPORT' };
export { render };

let app: Awaited<Promise<PromiseLike<ReturnType<typeof createApp>>>>;
async function render(pageContext: PageContextBuiltInClient & PageContext) {
  // console.log('client.render');
  const { session, redirectTo } = pageContext;
  // console.log(`session: ${session}`);

  if (redirectTo) {
    // console.log(`redirectTo: ${redirectTo}`);
    navigate(redirectTo);
    return;
  }

  // const { Page, Layout } = pageContext.exports;
  // console.log(Page, Layout);
  if (!app) {
    app = await createApp(pageContext);
    app.mount('#app');
  } else {
    app.changePage(pageContext);
  }
  const { title } = usePageTitle(pageContext);
  document.title = title;
}
